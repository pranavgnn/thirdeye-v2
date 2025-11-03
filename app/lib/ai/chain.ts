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
  const shouldEscalate = state.analyzerOutput.confidenceLevel < CONFIDENCE_THRESHOLD;

  const violation = await db.insert(
    `INSERT INTO violation_reports 
      (violationType, description, vehicleNumber, severity, status, aiAssessmentScore, recommendedFineAmount, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      state.analyzerOutput.violationTypes.split(",")[0],
      state.analyzerOutput.description,
      state.analyzerOutput.vehicleNumber || null,
      state.analyzerOutput.confidenceLevel > 0.8 ? "high" : "medium",
      shouldEscalate ? "escalated" : "pending_review",
      state.analyzerOutput.confidenceLevel,
      state.vectorSearchResults.length > 0
        ? state.vectorSearchResults[0].similarityScore * 5000
        : 2000,
      JSON.stringify({
        analyzedAt: new Date().toISOString(),
        rulesApplied: state.vectorSearchResults.map((r) => r.ruleId),
        escalatedDueToLowConfidence: shouldEscalate,
      }),
    ]
  );

  if (violation?.id && shouldEscalate) {
    await db.insert(
      `INSERT INTO escalations (violationId, escalationReason, escalationLevel, priority)
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

      if (eventType === "on_chain_end" && (nodeName === "chain" || nodeName === "")) {
        if (!emittedNodes.has("final_result")) {
          emittedNodes.add("final_result");
          const streamEvent: ChainStreamEvent = {
            type: "final_result",
            data: event.data,
            timestamp: Date.now(),
          };
          if (onEvent) onEvent(streamEvent);
          yield streamEvent;
        }
      }
    }
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
