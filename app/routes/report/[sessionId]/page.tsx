import { useState, useEffect } from "react";
import { useParams } from "react-router";

const SESSION_POLL_INTERVAL = 2000;

interface SessionData {
  id: string;
  status: string;
  progress_data: Array<{
    type: string;
    node?: string;
    data: string | object;
    timestamp: number;
  }>;
  result: Record<string, any> | null;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/v1/violations/sessions/${sessionId}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            setError("Session not found");
          } else {
            setError("Failed to fetch session");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (typeof data.progress_data === "string") {
          data.progress_data = JSON.parse(data.progress_data);
        }
        if (typeof data.result === "string") {
          data.result = JSON.parse(data.result);
        }

        setSession(data);
        setError(null);

        if (data.status !== "processing") {
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, SESSION_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
          <p className="text-foreground/80">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-foreground/80">Loading session...</p>
        </div>
      </div>
    );
  }

  const isComplete = session.status === "complete";
  const isFailed = session.status === "failed";

  const getFormattedAnalysis = () => {
    if (!session.result) return null;
    const output = session.result.output || session.result;
    return output.formattedAnalysis || output;
  };

  const formatted = getFormattedAnalysis();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <p className="text-sm text-foreground/60 mb-2">Session ID</p>
          <p className="font-mono text-sm text-foreground/80">{session.id}</p>
        </div>

        <div>
          <p className="text-sm text-foreground/60 mb-2">Status</p>
          <p className="text-lg font-medium text-foreground">
            {session.status === "processing" ? "Processing..." : session.status}
          </p>
        </div>

        {Array.isArray(session.progress_data) &&
          session.progress_data.length > 0 && (
            <div>
              <p className="text-sm text-foreground/60 mb-4">Progress Events</p>
              <div className="space-y-2 bg-muted/30 p-4 rounded border border-border max-h-64 overflow-y-auto">
                {session.progress_data.map((event, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-foreground/80 pb-2 border-b border-border/30 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/60">
                        [{event.node || "system"}]
                      </span>{" "}
                      <span className="font-medium">{event.type}</span>
                      <span className="text-foreground/40 text-xs">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.data && (
                      <div className="text-foreground/70 ml-4 mt-1">
                        {typeof event.data === "string"
                          ? event.data
                          : JSON.stringify(event.data, null, 2)
                              .split("\n")
                              .slice(0, 3)
                              .join("\n")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {session.error && (
          <div>
            <p className="text-sm text-foreground/60 mb-2">Error</p>
            <p className="text-foreground/80 bg-destructive/10 p-4 rounded border border-destructive/20">
              {session.error}
            </p>
          </div>
        )}

        {isComplete && formatted && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-foreground/60 mb-4">Analysis Result</p>

              {/* Formatted Result */}
              <div className="space-y-4 bg-muted/30 p-6 rounded border border-border">
                {formatted.violation && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Violation Details
                    </h3>
                    <div className="space-y-2 text-sm text-foreground/80">
                      <p>
                        <span className="text-foreground/60">Title:</span>{" "}
                        {formatted.violation.title}
                      </p>
                      <p>
                        <span className="text-foreground/60">Description:</span>{" "}
                        {formatted.violation.description}
                      </p>
                      <p>
                        <span className="text-foreground/60">Types:</span>{" "}
                        {Array.isArray(formatted.violation.types)
                          ? formatted.violation.types.join(", ")
                          : "N/A"}
                      </p>
                      <p>
                        <span className="text-foreground/60">Confidence:</span>{" "}
                        {((formatted.violation.confidence || 0) * 100).toFixed(
                          1
                        )}
                        %
                      </p>
                      {formatted.violation.vehicleNumber && (
                        <p>
                          <span className="text-foreground/60">
                            Vehicle Number:
                          </span>{" "}
                          {formatted.violation.vehicleNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {formatted.validation && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Validation
                    </h3>
                    <div className="space-y-2 text-sm text-foreground/80">
                      <p>
                        <span className="text-foreground/60">Valid:</span>{" "}
                        {formatted.validation.isValid ? "Yes" : "No"}
                      </p>
                      {Array.isArray(formatted.validation.messages) &&
                        formatted.validation.messages.length > 0 && (
                          <div>
                            <p className="text-foreground/60 mb-1">Messages:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {formatted.validation.messages.map(
                                (msg: string, idx: number) => (
                                  <li key={idx} className="text-foreground/80">
                                    {msg}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {Array.isArray(formatted.applicableRules) &&
                  formatted.applicableRules.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Applicable Rules
                      </h3>
                      <div className="space-y-2">
                        {formatted.applicableRules.map(
                          (rule: Record<string, any>, idx: number) => (
                            <div
                              key={idx}
                              className="text-sm bg-background/30 p-3 rounded border border-border/50"
                            >
                              <p className="font-medium text-foreground">
                                {rule.section}: {rule.ruleTitle}
                              </p>
                              <p className="text-foreground/70 mt-1 text-xs">
                                {rule.ruleText}
                              </p>
                              <p className="text-foreground/60 mt-2 text-xs">
                                Similarity:{" "}
                                {(rule.similarityScore * 100).toFixed(1)}%
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Raw JSON */}
            <details className="text-xs">
              <summary className="cursor-pointer hover:text-foreground text-foreground/60">
                View Raw Data
              </summary>
              <pre className="mt-4 p-4 bg-background rounded border border-border overflow-auto max-h-96 text-foreground/70 whitespace-pre-wrap">
                {String(JSON.stringify(session.result, null, 2))}
              </pre>
            </details>
          </div>
        )}

        {!isComplete && !isFailed && (
          <div className="text-center">
            <p className="text-foreground/60">Polling for updates...</p>
          </div>
        )}
      </div>
    </div>
  );
}
