import { useState, useEffect } from "react";
import { AdminLayout } from "../components/layout";
import { Button } from "~/components/ui/button";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface Escalation {
  id: string;
  violation_id: string;
  vehicle_number: string;
  description: string;
  severity: string;
  escalation_reason: string;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
}

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "urgent" | "high" | "normal" | "low"
  >("all");
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    loadEscalations();
  }, [filter]);

  const loadEscalations = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? `?priority=${filter}` : "";
      const response = await fetch(`/api/v1/admin/escalations${params}`);
      if (!response.ok) throw new Error("Failed to load escalations");
      const data = await response.json();
      setEscalations(data);
    } catch (error) {
      console.error("Error loading escalations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (escalationId: string) => {
    setResolving(escalationId);
    try {
      const response = await fetch(
        `/api/v1/admin/escalations/${escalationId}/resolve`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to resolve");
      setEscalations(escalations.filter((e) => e.id !== escalationId));
    } catch (error) {
      console.error("Error resolving escalation:", error);
    } finally {
      setResolving(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 border-red-500/50 text-red-600";
      case "high":
        return "bg-orange-500/10 border-orange-500/50 text-orange-600";
      case "normal":
        return "bg-blue-500/10 border-blue-500/50 text-blue-600";
      case "low":
        return "bg-green-500/10 border-green-500/50 text-green-600";
      default:
        return "bg-gray-500/10 border-gray-500/50 text-gray-600";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Escalations</h1>
            <p className="text-muted-foreground mt-1">
              {escalations.length} escalated cases
            </p>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "urgent", "high", "normal", "low"] as const).map(
            (priority) => (
              <Button
                key={priority}
                onClick={() => setFilter(priority)}
                variant={filter === priority ? "default" : "outline"}
                className="capitalize"
              >
                {priority === "all" ? "All" : priority}
              </Button>
            )
          )}
        </div>

        {/* Escalations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading escalations...</p>
          </div>
        ) : escalations.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <p className="text-lg font-semibold text-foreground">
              No Escalations
            </p>
            <p className="text-muted-foreground">All cases are handled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {escalations.map((escalation) => (
              <div
                key={escalation.id}
                className={`border rounded-lg p-4 space-y-3 ${getPriorityColor(
                  escalation.priority
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <p className="font-semibold">
                        {escalation.vehicle_number || "Unknown Vehicle"}
                      </p>
                      <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-black/10">
                        {escalation.priority}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{escalation.description}</p>
                    <div className="mt-3 pt-3 border-t border-current/20">
                      <p className="text-xs font-semibold">
                        Escalation Reason:
                      </p>
                      <p className="text-xs mt-1">
                        {escalation.escalation_reason}
                      </p>
                    </div>
                    <p className="text-xs mt-2 opacity-75">
                      {new Date(escalation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleResolve(escalation.id)}
                    disabled={resolving === escalation.id}
                    variant="default"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
