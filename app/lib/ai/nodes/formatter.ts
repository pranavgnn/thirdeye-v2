import type { ChainState, VectorSearchResult } from "../types";

interface FormattedAnalysis {
  status: string;
  violation: {
    title: string;
    description: string;
    types: string[];
    confidence: number;
    vehicleNumber?: string;
  };
  validation: {
    isValid: boolean;
    messages: string[];
  };
  applicableRules: VectorSearchResult[];
}

export async function formatterNode(
  state: ChainState
): Promise<Partial<ChainState>> {
  const formattedAnalysis: FormattedAnalysis = {
    status: state.shouldSkip ? "incomplete" : "complete",
    violation: {
      title: state.analyzerOutput?.title || "Unknown",
      description: state.analyzerOutput?.description || "",
      types: state.analyzerOutput?.violationTypes.split(",").map(t => t.trim()) || [],
      confidence: state.analyzerOutput?.confidenceLevel || 0,
      vehicleNumber: state.analyzerOutput?.vehicleNumber,
    },
    validation: {
      isValid: false,
      messages: [],
    },
    applicableRules: state.vectorSearchResults,
  };

  if (state.analyzerOutput) {
    const messages: string[] = [];

    if (!state.analyzerOutput.isIndia) {
      messages.push("Violation not in India");
    }

    if (!state.analyzerOutput.vehicleDetected) {
      messages.push("No vehicle detected");
    }

    if (!state.analyzerOutput.violationDetected) {
      messages.push("No violation detected");
    }

    if (!state.analyzerOutput.licensePlateDetected) {
      messages.push("No license plate detected");
    }

    formattedAnalysis.validation.messages = messages;

    formattedAnalysis.validation.isValid =
      state.analyzerOutput.isIndia &&
      state.analyzerOutput.vehicleDetected &&
      state.analyzerOutput.violationDetected &&
      state.analyzerOutput.licensePlateDetected &&
      state.analyzerOutput.confidenceLevel > 0.7;
  }

  return { formattedAnalysis };
}
