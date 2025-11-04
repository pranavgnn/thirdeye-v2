import { useEffect, useState } from "react";

interface ToolCall {
  type: string;
  node?: string;
  data: string | object;
  timestamp: number;
}

interface PerplexityToolCallsProps {
  toolCalls: ToolCall[];
  isProcessing: boolean;
}

export function PerplexityToolCalls({
  toolCalls,
  isProcessing,
}: PerplexityToolCallsProps) {
  const [displayedCalls, setDisplayedCalls] = useState<ToolCall[]>([]);

  useEffect(() => {
    setDisplayedCalls(toolCalls);
  }, [toolCalls]);

  if (!isProcessing && displayedCalls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {displayedCalls.map((call, idx) => (
        <div key={idx} className="flex items-start gap-3 group">
          {/* Animated dot indicator */}
          <div className="shrink-0 mt-1">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-primary/50 group-first:bg-primary group-first:animate-pulse" />
              {idx < displayedCalls.length - 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-2 w-0.5 h-4 bg-linear-to-b from-primary/50 to-primary/0" />
              )}
            </div>
          </div>

          {/* Tool call content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-tight">
                {call.node || "system"}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {call.type}
              </span>
            </div>
            {typeof call.data === "string" && call.data && (
              <p className="text-sm text-muted-foreground wrap-break-word">
                {call.data}
              </p>
            )}
          </div>
        </div>
      ))}

      {isProcessing && displayedCalls.length > 0 && (
        <div className="flex items-start gap-3 opacity-50">
          <div className="shrink-0 mt-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
