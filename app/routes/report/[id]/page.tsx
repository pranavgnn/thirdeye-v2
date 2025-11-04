import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Layout } from "~/components/layout";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

interface ViolationReport {
  id: string;
  vehicle_number: string;
  description: string;
  severity: string;
  violation_type: string;
  ai_assessment_score: number;
  recommended_fine_amount: number;
  status: string;
  created_at: string;
  notes: string;
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ViolationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!id) {
      setError("No report ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/reports/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Report not found");
        } else {
          setError("Failed to load report");
        }
        return;
      }
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError("Failed to load report");
      console.error("Error loading report:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Loading report...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <p className="text-destructive font-semibold">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : report ? (
          <>
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {report.vehicle_number || "Report"}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {new Date(report.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        report.severity === "high"
                          ? "destructive"
                          : report.severity === "medium"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {report.severity} Severity
                    </Badge>
                    <Badge
                      variant={
                        report.status === "approved"
                          ? "default"
                          : report.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                    Violation Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {report.violation_type
                      ? report.violation_type.replace(/_/g, " ")
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                    AI Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-foreground">
                    {(report.ai_assessment_score * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                    Recommended Fine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-foreground">
                    ₹ {report.recommended_fine_amount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                    Report ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-muted-foreground truncate">
                    {report.id}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {report.description}
                </p>
              </CardContent>
            </Card>

            {/* Notes Card */}
            {report.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg text-foreground overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {typeof report.notes === "string"
                        ? report.notes
                        : JSON.stringify(report.notes, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
