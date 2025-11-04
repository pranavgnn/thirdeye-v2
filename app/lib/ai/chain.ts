import { StateGraph, START, END } from "@langchain/langgraph";
import { analyzerNode } from "./nodes/analyzer";
import { vectorSearchNode } from "./nodes/vector-search";
import { formatterNode } from "./nodes/formatter";
import type { ChainState } from "./types";
import * as db from "~/lib/database";

export interface ChainStreamEvent {
  type:
  | "node_start"
  | "node_end"
  | "analysis_complete"
  | "error"
  | "final_result";
  node?: string;
  data: unknown;
  timestamp: number;
}

async function validationNode(
  state: ChainState
): Promise<Partial<ChainState>> {
  if (!state.analyzerOutput) {
    return {
      error: "Failed to analyze image",
      shouldSkip: true,
    };
  }

  const isValidImage =
    state.analyzerOutput.isIndia &&
    state.analyzerOutput.vehicleDetected &&
    state.analyzerOutput.violationDetected &&
    state.analyzerOutput.licensePlateDetected;

  if (!isValidImage) {
    return {
      shouldSkip: true,
    };
  }

  return {};
}

async function databaseNode(
  state: ChainState
): Promise<Partial<ChainState>> {
  if (state.shouldSkip || !state.analyzerOutput) {
    return {};
  }

  const CONFIDENCE_THRESHOLD = 0.7;
  const SIMILARITY_THRESHOLD = 0.75;
  const shouldEscalate = state.analyzerOutput.confidenceLevel < CONFIDENCE_THRESHOLD;

  // Normalize violation type to match database enum
  const violationTypeMapping: Record<string, string> = {
    speeding: "speeding",
    "rash_driving": "rash_driving",
    "wrong_parking": "wrong_parking",
    "red_light": "red_light",
    "helmet_violation": "helmet_violation",
    "not_wearing_helmet": "helmet_violation",
    "seatbelt_violation": "seatbelt_violation",
    "not_wearing_seatbelt": "seatbelt_violation",
    "phone_usage": "phone_usage",
    "no_license_plate": "no_license_plate",
    other: "other",
  };

  const rawViolationType = state.analyzerOutput.violationTypes
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/ /g, "_");

  const violationType = violationTypeMapping[rawViolationType] || "other";

  // Calculate total fines from rules with >75% similarity
  const matchedRules = state.vectorSearchResults.filter(
    (r) => r.similarityScore >= SIMILARITY_THRESHOLD
  );
  const totalFineAmount = matchedRules.reduce(
    (sum, rule) => sum + rule.fineAmountRupees,
    0
  );

  const violation = await db.insert(
    `INSERT INTO violation_reports 
      (violation_type, description, vehicle_number, severity, status, ai_assessment_score, recommended_fine_amount, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      violationType,
      state.analyzerOutput.description,
      state.analyzerOutput.vehicleNumber || null,
      state.analyzerOutput.confidenceLevel > 0.8 ? "high" : "medium",
      shouldEscalate ? "escalated" : "pending_review",
      state.analyzerOutput.confidenceLevel,
      totalFineAmount > 0 ? totalFineAmount : 2000,
      JSON.stringify({
        analyzedAt: new Date().toISOString(),
        rulesApplied: state.vectorSearchResults.map((r) => ({
          ruleId: r.ruleId,
          similarity: r.similarityScore,
          fineAmount: r.fineAmountRupees,
        })),
        matchedRules: matchedRules.length,
        totalMatchedFine: totalFineAmount,
        escalatedDueToLowConfidence: shouldEscalate,
      }),
    ]
  );

  if (violation?.id && shouldEscalate) {
    await db.insert(
      `INSERT INTO escalations (violation_id, escalation_reason, escalation_level, priority)
       VALUES ($1, $2, $3, $4)`,
      [
        violation.id,
        `Low confidence AI assessment (${(state.analyzerOutput.confidenceLevel * 100).toFixed(1)}%). Flagged for admin review.`,
        1,
        "high",
      ]
    );
  }

  return {
    reportId: violation?.id || null,
  };
}

export async function createViolationAnalysisChain() {
  const builder = new StateGraph<ChainState>({
    channels: {
      imageBase64: null,
      analyzerOutput: null,
      vectorSearchResults: null,
      reportId: null,
      error: null,
      shouldSkip: null,
      formattedAnalysis: null,
    },
  })
    .addNode("analyzer", analyzerNode)
    .addNode("validation", validationNode)
    .addNode("vectorSearch", vectorSearchNode)
    .addNode("database", databaseNode)
    .addNode("formatter", formatterNode)
    .addEdge(START, "analyzer")
    .addEdge("analyzer", "validation")
    .addConditionalEdges("validation", (state: ChainState) =>
      state.shouldSkip ? "formatter" : "vectorSearch"
    )
    .addEdge("vectorSearch", "database")
    .addEdge("database", "formatter")
    .addEdge("formatter", END);

  return builder.compile();
}

export async function* streamViolationAnalysis(
  imageBase64: string,
  onEvent?: (event: ChainStreamEvent) => void
) {
  const chain = await createViolationAnalysisChain();

  const inputState: ChainState = {
    imageBase64,
    analyzerOutput: null,
    vectorSearchResults: [],
    reportId: null,
    error: null,
    shouldSkip: false,
    formattedAnalysis: null,
  };

  try {
    const nodeNames: Record<string, string> = {
      analyzer: "Analyzing image with AI vision",
      validation: "Validating image requirements",
      vectorSearch: "Searching motor vehicle rules",
      database: "Saving to database",
      formatter: "Formatting results",
    };

    const emittedNodes = new Set<string>();

    // Stream the events for progress tracking
    for await (const event of chain.streamEvents(inputState, {
      version: "v2",
    })) {
      const eventType = event.event;
      const nodeName = event.metadata?.langgraph_node || "";

      if (eventType === "on_tool_start" || eventType === "on_tool_end") {
        const toolName = event.name || "tool";
        const streamEvent: ChainStreamEvent = {
          type: eventType === "on_tool_start" ? "node_start" : "node_end",
          node: toolName,
          data:
            eventType === "on_tool_start"
              ? `Calling ${toolName}`
              : `${toolName} completed`,
          timestamp: Date.now(),
        };
        if (onEvent) onEvent(streamEvent);
        yield streamEvent;
      }

      if (
        eventType === "on_chain_start" &&
        nodeName &&
        nodeName !== "chain" &&
        !emittedNodes.has(`${nodeName}:start`)
      ) {
        emittedNodes.add(`${nodeName}:start`);
        const streamEvent: ChainStreamEvent = {
          type: "node_start",
          node: nodeName,
          data: nodeNames[nodeName] || `Executing ${nodeName}`,
          timestamp: Date.now(),
        };
        if (onEvent) onEvent(streamEvent);
        yield streamEvent;
      }

      if (
        eventType === "on_chain_end" &&
        nodeName &&
        nodeName !== "chain" &&
        !emittedNodes.has(`${nodeName}:end`)
      ) {
        emittedNodes.add(`${nodeName}:end`);
        const streamEvent: ChainStreamEvent = {
          type: "node_end",
          node: nodeName,
          data: `Completed ${nodeName}`,
          timestamp: Date.now(),
        };
        if (onEvent) onEvent(streamEvent);
        yield streamEvent;
      }
    }

    // After streaming events, invoke the chain to get the complete final state
    const finalState = await chain.invoke(inputState);

    const streamEvent: ChainStreamEvent = {
      type: "final_result",
      data: finalState,
      timestamp: Date.now(),
    };
    if (onEvent) onEvent(streamEvent);
    yield streamEvent;

  } catch (error) {
    console.error("[Chain] Error during streaming:", error);
    const streamEvent: ChainStreamEvent = {
      type: "error",
      data: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    };
    if (onEvent) onEvent(streamEvent);
    yield streamEvent;
  }
}
