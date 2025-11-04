import { cn } from "~/lib/utils";

interface ViolationDetails {
  title: string;
  description: string;
  types: string[];
  confidence: number;
  vehicle_number?: string;
}

interface ValidationData {
  isValid: boolean;
  messages: string[];
}

interface Rule {
  section: string;
  ruleTitle: string;
  ruleText: string;
  similarityScore: number;
  fineAmountRupees?: number;
}

interface FormattedAnalysis {
  violation?: ViolationDetails;
  validation?: ValidationData;
  applicableRules?: Rule[];
}

interface ResultsDisplayProps {
  analysis: FormattedAnalysis;
}

export function ResultsDisplay({ analysis }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Violation Details Card */}
      {analysis.violation && (
        <div className="rounded-lg border border-border bg-linear-to-br from-background to-muted/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/40">
            <h2 className="text-lg font-semibold text-foreground">
              Violation Detected
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {analysis.violation.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.violation.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Confidence
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {((analysis.violation.confidence || 0) * 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">%</span>
                </div>
                <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${(analysis.violation.confidence || 0) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {analysis.violation.vehicle_number && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Vehicle Number
                  </p>
                  <p className="text-xl font-bold text-foreground font-mono">
                    {analysis.violation.vehicle_number}
                  </p>
                </div>
              )}
            </div>

            {analysis.violation.types &&
              analysis.violation.types.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Violation Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.violation.types.map((type, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Validation Card */}
      {analysis.validation && (
        <div
          className={cn(
            "rounded-lg border overflow-hidden",
            analysis.validation.isValid
              ? "border-green-500/20 bg-green-500/5"
              : "border-red-500/20 bg-red-500/5"
          )}
        >
          <div
            className={cn(
              "px-6 py-4 border-b",
              analysis.validation.isValid
                ? "border-green-500/20 bg-green-500/10"
                : "border-red-500/20 bg-red-500/10"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  analysis.validation.isValid ? "bg-green-500" : "bg-red-500"
                )}
              />
              <h2
                className={cn(
                  "font-semibold",
                  analysis.validation.isValid
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {analysis.validation.isValid ? "Valid" : "Invalid"}
              </h2>
            </div>
          </div>

          {analysis.validation.messages &&
            analysis.validation.messages.length > 0 && (
              <div className="p-6">
                <ul className="space-y-2">
                  {analysis.validation.messages.map((msg, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span className="text-foreground/80">{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {/* Matched Rules Summary Card */}
      {analysis.applicableRules && analysis.applicableRules.length > 0 && (
        <div className="rounded-lg border border-border bg-linear-to-br from-background to-muted/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/40">
            <h2 className="text-lg font-semibold text-foreground">
              Semantic Matching Results
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {(() => {
              const SIMILARITY_THRESHOLD = 0.75;
              const matchedRules = analysis.applicableRules.filter(
                (r) => r.similarityScore >= SIMILARITY_THRESHOLD
              );
              const totalFine = matchedRules.reduce(
                (sum, rule) => sum + (rule.fineAmountRupees || 0),
                0
              );

              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Matched Rules ({">"}75%)
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {matchedRules.length}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Total Fine Issued
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        ₹ {totalFine.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {matchedRules.length > 0 && (
                    <div className="rounded-lg border border-border/50 bg-background p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Matched Rules Breakdown
                      </p>
                      <div className="space-y-2">
                        {matchedRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {rule.ruleTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(rule.similarityScore * 100).toFixed(0)}% match
                              </p>
                            </div>
                            <p className="font-semibold text-foreground">
                              ₹ {(rule.fineAmountRupees || 0).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Applicable Rules Card */}
      {analysis.applicableRules && analysis.applicableRules.length > 0 && (
        <div className="rounded-lg border border-border bg-linear-to-br from-background to-muted/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/40">
            <h2 className="text-lg font-semibold text-foreground">
              Applicable Rules
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {analysis.applicableRules.map((rule, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/50 bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {rule.section}
                    </p>
                    <p className="text-sm text-foreground/80 font-medium mt-1">
                      {rule.ruleTitle}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-background px-2.5 py-1">
                      <span className="text-2xl font-bold text-foreground">
                        {(rule.similarityScore * 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    {rule.fineAmountRupees && (
                      <p className="text-sm font-semibold text-foreground">
                        ₹ {rule.fineAmountRupees.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {rule.ruleText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
