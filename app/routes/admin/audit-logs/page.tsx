import { useState, useEffect } from "react";
import { AdminLayout } from "../components/layout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { ChevronDown, Search } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any> | null;
  status: string;
  created_at: string;
}

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case "submission_created":
      return "default";
    case "ai_assessment_started":
      return "secondary";
    case "ai_assessment_completed":
      return "default";
    case "admin_login":
      return "secondary";
    case "admin_logout":
      return "outline";
    case "violation_reviewed":
      return "secondary";
    case "violation_approved":
      return "default";
    case "violation_rejected":
      return "destructive";
    case "violation_escalated":
      return "secondary";
    case "fine_issued":
      return "default";
    default:
      return "outline";
  }
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    limit: 20,
  });

  useEffect(() => {
    loadLogs();
  }, [page, filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(filter && { search: filter }),
      });

      const response = await fetch(`/api/v1/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error("Failed to load audit logs");
      const data = await response.json();
      setLogs(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, limit: 20 });
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total > 0
              ? `${(page - 1) * pagination.limit + 1}-${Math.min(
                  page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} logs`
              : "No audit logs found"}
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search logs (action, type, entity)..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={() => setFilter("")} variant="outline">
            Clear
          </Button>
        </div>

        {/* Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity Log</CardTitle>
            <CardDescription>
              Complete audit trail of all system actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground">No audit logs found</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-border rounded-lg"
                    >
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === log.id ? null : log.id)
                        }
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedId === log.id ? "rotate-180" : ""
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={getActionBadgeVariant(log.action)}
                              className="font-mono text-xs"
                            >
                              {log.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.entity_type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            log.status === "success" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      </button>

                      {expandedId === log.id && (
                        <div className="border-t border-border px-4 py-3 bg-muted/30">
                          <div className="space-y-2 text-sm">
                            {log.user_id && (
                              <div>
                                <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">
                                  User ID
                                </p>
                                <p className="font-mono text-xs text-foreground break-all">
                                  {log.user_id}
                                </p>
                              </div>
                            )}
                            {log.entity_id && (
                              <div>
                                <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">
                                  Entity ID
                                </p>
                                <p className="font-mono text-xs text-foreground break-all">
                                  {log.entity_id}
                                </p>
                              </div>
                            )}
                            {log.changes && (
                              <div>
                                <p className="font-semibold text-muted-foreground text-xs uppercase mb-1">
                                  Changes
                                </p>
                                <pre className="font-mono text-xs text-foreground bg-background p-2 rounded overflow-auto max-h-48">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              page > 1 &&
                              window.location.hash &&
                              window.scrollTo(0, 0)
                            }
                            className={
                              page <= 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: pagination.pages },
                          (_, i) => i + 1
                        ).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={pageNum === page}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              page < pagination.pages && setPage(page + 1)
                            }
                            className={
                              page >= pagination.pages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
