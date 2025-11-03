import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { LogOut, AlertTriangle, Check, Clock } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
}

interface EscalatedViolation {
  id: string;
  vehicleNumber: string;
  description: string;
  severity: string;
  aiAssessmentScore: number;
  createdAt: string;
  escalationReason: string;
}

interface DashboardStats {
  totalEscalated: number;
  highPriority: number;
  pendingReview: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [escalatedViolations, setEscalatedViolations] = useState<
    EscalatedViolation[]
  >([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEscalated: 0,
    highPriority: 0,
    pendingReview: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const adminResponse = await fetch("/api/v1/admin/me");
        if (!adminResponse.ok) {
          navigate("/admin/login");
          return;
        }

        const adminData = await adminResponse.json();
        setAdmin(adminData.admin);

        const violationsResponse = await fetch("/api/v1/violations/escalated");
        if (violationsResponse.ok) {
          const violationsData = await violationsResponse.json();
          setEscalatedViolations(violationsData.violations || []);

          const stats: DashboardStats = {
            totalEscalated: violationsData.violations?.length || 0,
            highPriority:
              violationsData.violations?.filter(
                (v: EscalatedViolation) => v.severity === "high"
              ).length || 0,
            pendingReview:
              violationsData.violations?.filter(
                (v: EscalatedViolation) => v.severity === "medium"
              ).length || 0,
          };
          setStats(stats);
        }

        setError(null);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-foreground/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded text-destructive">
            {error}
          </div>
          <Button onClick={() => navigate("/admin/login")} className="mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ThirdEye Admin
            </h1>
            <p className="text-sm text-foreground/60">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {admin?.fullName}
              </p>
              <p className="text-xs text-foreground/60">{admin?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60 mb-1">
                  Total Escalated
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalEscalated}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60 mb-1">High Priority</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.highPriority}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60 mb-1">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.pendingReview}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Escalated Violations Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground">
              Escalated Violations
            </h2>
          </div>

          {escalatedViolations.length === 0 ? (
            <div className="p-8 text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-foreground/60">
                No escalated violations at this time
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground/80">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground/80">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground/80">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground/80">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground/80">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground/80">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {escalatedViolations.map((violation) => (
                    <tr
                      key={violation.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-foreground">
                        {violation.vehicleNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/80">
                        {violation.description}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            violation.aiAssessmentScore > 0.7
                              ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : "bg-red-500/20 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {(violation.aiAssessmentScore * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            violation.severity === "high"
                              ? "bg-red-500/20 text-red-700 dark:text-red-400"
                              : violation.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                              : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {violation.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/70 max-w-xs truncate">
                        {violation.escalationReason}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/60">
                        {new Date(violation.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
