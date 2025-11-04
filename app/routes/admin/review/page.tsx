import { useState, useEffect } from "react";
import { AdminLayout } from "../components/layout";
import { Button } from "~/components/ui/button";
import { Check, X, AlertTriangle } from "lucide-react";

interface PendingReport {
  id: string;
  vehicle_number: string;
  description: string;
  severity: string;
  violation_type: string;
  ai_assessment_score: number;
  recommended_fine_amount: number;
  created_at: string;
}

export default function AdminReviewPage() {
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadPendingReports();
  }, []);

  const loadPendingReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/admin/reports/pending");
      if (!response.ok) throw new Error("Failed to load reports");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (currentIndex >= reports.length) return;

    const report = reports[currentIndex];
    setApproving(true);

    try {
      const response = await fetch(
        `/api/v1/admin/reports/${report.id}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to approve");

      const newReports = reports.filter((_, idx) => idx !== currentIndex);
      setReports(newReports);
      if (currentIndex >= newReports.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error("Error approving report:", error);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (currentIndex >= reports.length) return;

    const report = reports[currentIndex];
    setApproving(true);

    try {
      const response = await fetch(
        `/api/v1/admin/reports/${report.id}/reject`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to reject");

      const newReports = reports.filter((_, idx) => idx !== currentIndex);
      setReports(newReports);
      if (currentIndex >= newReports.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
    } finally {
      setApproving(false);
    }
  };

  const handleEscalate = async () => {
    if (currentIndex >= reports.length) return;

    const report = reports[currentIndex];
    setApproving(true);

    try {
      const response = await fetch(
        `/api/v1/admin/reports/${report.id}/escalate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escalationReason: "Flagged for further review by admin",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to escalate");

      const newReports = reports.filter((_, idx) => idx !== currentIndex);
      setReports(newReports);
      if (currentIndex >= newReports.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error("Error escalating report:", error);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading reports...</p>
        </div>
      </AdminLayout>
    );
  }

  if (reports.length === 0) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-foreground">
            No Reports to Review
          </p>
          <p className="text-muted-foreground mt-2">
            All pending reports have been processed
          </p>
        </div>
      </AdminLayout>
    );
  }

  const currentReport = reports[currentIndex];
  const progress = ((currentIndex + 1) / reports.length) * 100;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Reports</h1>
          <p className="text-muted-foreground mt-1">
            Report {currentIndex + 1} of {reports.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Report Card */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Vehicle Number
              </p>
              <span className="text-lg font-bold text-foreground">
                {currentReport?.vehicle_number || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Violation Type
              </p>
              <span className="capitalize text-foreground">
                {currentReport?.violation_type?.replace(/_/g, " ") || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Severity
              </p>
              <span
                className={`capitalize font-semibold text-${
                  currentReport?.severity === "high"
                    ? "red"
                    : currentReport?.severity === "medium"
                    ? "amber"
                    : "green"
                }-600`}
              >
                {currentReport?.severity || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                AI Confidence
              </p>
              <span className="font-semibold text-foreground">
                {currentReport?.ai_assessment_score
                  ? (currentReport.ai_assessment_score * 100).toFixed(0)
                  : "N/A"}
                %
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Recommended Fine
              </p>
              <span className="font-semibold text-foreground">
                ₹ {currentReport?.recommended_fine_amount || "N/A"}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">
              Description
            </p>
            <p className="text-foreground leading-relaxed">
              {currentReport?.description || "No description"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center pt-4">
          <Button
            onClick={handleReject}
            disabled={approving}
            variant="outline"
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Reject
          </Button>

          <Button
            onClick={handleEscalate}
            disabled={approving}
            variant="outline"
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Escalate
          </Button>

          <Button
            onClick={handleApprove}
            disabled={approving}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            Approve
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
