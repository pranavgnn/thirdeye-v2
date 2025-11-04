import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface ToolCall {
  type: string;
  node?: string;
  data: string | object;
  timestamp: number;
}

interface ToolCallsMonitorProps {
  toolCalls: ToolCall[];
  isProcessing: boolean;
}

export function ToolCallsMonitor({
  toolCalls,
  isProcessing,
}: ToolCallsMonitorProps) {
  const lastCall =
    toolCalls.length > 0 ? toolCalls[toolCalls.length - 1] : null;

  if (!isProcessing && !lastCall) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
      {isProcessing && (
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      )}
      <span className="text-sm font-medium text-blue-600">
        {isProcessing ? "Analyzing..." : lastCall?.type || "Complete"}
      </span>
    </div>
  );
}
