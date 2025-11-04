import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { ImagePreview } from "./components/image-preview";
import { PerplexityToolCalls } from "./components/perplexity-tool-calls";
import { Check, AlertCircle } from "lucide-react";

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
  image_data?: string;
  created_at: string;
  updated_at: string;
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

        // Ensure dates are valid
        if (data.created_at && typeof data.created_at === "string") {
          const date = new Date(data.created_at);
          if (isNaN(date.getTime())) {
            data.created_at = new Date().toISOString();
          }
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-foreground">Error</h2>
          </div>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const getFormattedAnalysis = () => {
    if (!session.result) return null;
    const output = session.result.output || session.result;
    return output.formattedAnalysis || output;
  };

  const formatted = getFormattedAnalysis();
  const isComplete = session.status === "complete";
  const isFailed = session.status === "failed";
  const hasViolation =
    formatted?.violation && formatted.violation.confidence > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Processing State */}
        {!isComplete && !isFailed && session.status === "processing" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Analyzing Your Report
              </h1>
              <p className="text-muted-foreground mt-1">
                Our AI is processing your image...
              </p>
            </div>
            <PerplexityToolCalls
              toolCalls={
                Array.isArray(session.progress_data)
                  ? session.progress_data
                  : []
              }
              isProcessing={session.status === "processing"}
            />
          </div>
        )}

        {/* Complete State - Compact Layout */}
        {isComplete && formatted && (
          <div className="space-y-8">
            {/* Status Header */}
            <div className="text-center space-y-2">
              <div
                className={`text-sm font-semibold uppercase tracking-wider ${
                  hasViolation ? "text-destructive" : "text-green-600"
                }`}
              >
                Analysis Complete
              </div>
              <h1
                className={`text-4xl font-bold ${
                  hasViolation ? "text-destructive" : "text-green-600"
                }`}
              >
                {hasViolation ? "Violation Detected" : "No Violation Found"}
              </h1>
            </div>

            {hasViolation && formatted.violation && (
              <div className="space-y-8">
                {/* Structured Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vehicle Detected */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vehicle Status
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-foreground font-medium">
                        Vehicle Detected
                      </span>
                    </div>
                  </div>

                  {/* License Number */}
                  {formatted.violation.vehicle_number && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        License Plate
                      </p>
                      <p className="text-foreground font-mono font-semibold text-lg">
                        {formatted.violation.vehicle_number}
                      </p>
                    </div>
                  )}

                  {/* Violation Type */}
                  {formatted.violation.types &&
                    formatted.violation.types.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Violation Type
                        </p>
                        <p className="text-foreground capitalize">
                          {formatted.violation.types
                            .join(", ")
                            .replace(/_/g, " ")}
                        </p>
                      </div>
                    )}

                  {/* Confidence */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Confidence
                    </p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-destructive">
                        {((formatted.violation.confidence || 0) * 100).toFixed(
                          0
                        )}
                      </span>
                      <span className="text-muted-foreground text-sm mb-1">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </p>
                  <p className="text-foreground leading-relaxed text-sm">
                    {formatted.violation.description}
                  </p>
                </div>

                {/* Rules Broken */}
                {formatted.applicableRules &&
                  formatted.applicableRules.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Rules Broken
                      </p>
                      <div className="space-y-2">
                        {formatted.applicableRules.map(
                          (rule: Record<string, any>, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <p className="font-semibold text-foreground text-sm">
                                  {rule.section && (
                                    <span className="text-xs text-muted-foreground mr-2">
                                      {rule.section}
                                    </span>
                                  )}
                                  {rule.ruleTitle}
                                </p>
                                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                  {(rule.similarityScore * 100).toFixed(0)}%
                                  match
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {rule.ruleText}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Matched Rules Summary */}
                {formatted.applicableRules &&
                  formatted.applicableRules.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Semantic Matching Results
                      </h3>

                      {(() => {
                        const SIMILARITY_THRESHOLD = 0.75;
                        const matchedRules = formatted.applicableRules.filter(
                          (r: Record<string, any>) =>
                            r.similarityScore >= SIMILARITY_THRESHOLD
                        );
                        const totalFine = matchedRules.reduce(
                          (sum: number, rule: Record<string, any>) =>
                            sum + (rule.fineAmountRupees || 0),
                          0
                        );

                        console.log("Matched Rules Debug:", {
                          totalRules: formatted.applicableRules.length,
                          matchedRules: matchedRules.length,
                          threshold: SIMILARITY_THRESHOLD,
                          rules: formatted.applicableRules.map(
                            (r: Record<string, any>) => ({
                              title: r.ruleTitle,
                              similarity: r.similarityScore,
                              fine: r.fineAmountRupees,
                            })
                          ),
                        });

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-lg bg-background p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                  Matched Rules ({">"}75%)
                                </p>
                                <p className="text-3xl font-bold text-foreground">
                                  {matchedRules.length}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  of {formatted.applicableRules.length} total
                                </p>
                              </div>
                              <div className="rounded-lg bg-background p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                  Total Fine Issued
                                </p>
                                <p className="text-3xl font-bold text-destructive">
                                  ₹ {totalFine.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {matchedRules.length > 0
                                    ? `from ${matchedRules.length} rule${
                                        matchedRules.length > 1 ? "s" : ""
                                      }`
                                    : "No matched rules"}
                                </p>
                              </div>
                            </div>

                            {matchedRules.length > 0 && (
                              <div className="space-y-3 pt-4 border-t border-border">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Matched Rules Breakdown
                                </p>
                                <div className="space-y-2">
                                  {matchedRules.map(
                                    (
                                      rule: Record<string, any>,
                                      idx: number
                                    ) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-background"
                                      >
                                        <div>
                                          <p className="font-medium text-foreground text-sm">
                                            {rule.ruleTitle}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {`${(
                                              rule.similarityScore * 100
                                            ).toFixed(0)}% match`}
                                          </p>
                                        </div>
                                        <p className="font-bold text-foreground">
                                          {`₹ ${(
                                            rule.fineAmountRupees || 0
                                          ).toLocaleString()}`}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {matchedRules.length === 0 && (
                              <div className="p-3 rounded-lg bg-background">
                                <p className="text-sm text-muted-foreground">
                                  No rules matched above 75% similarity
                                  threshold.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Top match:{" "}
                                  {formatted.applicableRules[0]?.ruleTitle} (
                                  {(
                                    (formatted.applicableRules[0]
                                      ?.similarityScore || 0) * 100
                                  ).toFixed(0)}
                                  %)
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                {/* Applicable Rules */}
              </div>
            )}

            {/* Validation Messages for Invalid Reports */}
            {formatted.validation && !formatted.validation.isValid && (
              <div className="space-y-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-600 text-sm mb-2">
                      Report Issues
                    </p>
                    <ul className="space-y-1">
                      {formatted.validation.messages &&
                        formatted.validation.messages.map(
                          (msg: string, idx: number) => (
                            <li key={idx} className="text-xs text-amber-600/80">
                              • {msg}
                            </li>
                          )
                        )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Image Evidence */}
            {session.image_data && (
              <div className="space-y-3 pt-6 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Evidence
                </p>
                <div className="max-w-sm">
                  <ImagePreview imageData={session.image_data} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {session.error && (
          <div className="space-y-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-600">Analysis Failed</p>
                <p className="text-sm text-red-600/80 mt-1">{session.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
