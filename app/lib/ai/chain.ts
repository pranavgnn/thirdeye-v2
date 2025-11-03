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
      "pending_review",
      state.analyzerOutput.confidenceLevel,
      state.vectorSearchResults.length > 0
        ? state.vectorSearchResults[0].similarityScore * 5000
        : 2000,
      JSON.stringify({
        analyzedAt: new Date().toISOString(),
        rulesApplied: state.vectorSearchResults.map((r) => r.ruleId),
      }),
    ]
  );

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

      console.log(`[Chain] Event: ${eventType}, Node: ${nodeName}`);

      // Emit tool call events
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
        console.log(`[Chain] Emitting ${toolName} ${eventType}`);
        if (onEvent) onEvent(streamEvent);
        yield streamEvent;
      }

      // Only emit node_start once per node
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
        console.log(`[Chain] Emitting node_start for ${nodeName}`);
        if (onEvent) onEvent(streamEvent);
        yield streamEvent;
      }

      // Only emit node_end once per node
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
        console.log(`[Chain] Emitting node_end for ${nodeName}`);
        if (onEvent) onEvent(streamEvent);
        yield streamEvent;
      }

      // Emit final result when chain completes
      if (eventType === "on_chain_end" && (nodeName === "chain" || nodeName === "")) {
        // Only emit final_result once
        if (!emittedNodes.has("final_result")) {
          emittedNodes.add("final_result");
          const streamEvent: ChainStreamEvent = {
            type: "final_result",
            data: event.data,
            timestamp: Date.now(),
          };
          console.log(
            `[Chain] Emitting final_result:`,
            JSON.stringify(streamEvent).slice(0, 200)
          );
          if (onEvent) onEvent(streamEvent);
          yield streamEvent;
        }
      }

      // Debug: log all on_chain_end events to see what we're missing
      if (eventType === "on_chain_end") {
        console.log(
          `[Chain] on_chain_end event - nodeName: "${nodeName}", event.data keys:`,
          Object.keys(event.data || {})
        );
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
