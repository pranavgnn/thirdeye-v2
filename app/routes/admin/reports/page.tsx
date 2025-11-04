import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Filter, X, Search } from "lucide-react";

interface Report {
  id: string;
  vehicle_number: string;
  description: string;
  severity: string;
  violation_type: string;
  ai_assessment_score: number;
  status: string;
  created_at: string;
}

interface Filters {
  timeRange: "today" | "week" | "month" | "all";
  confidenceMin: number;
  confidenceMax: number;
  hasVehicle: "all" | "yes" | "no";
  hasViolation: "all" | "yes" | "no";
  violationType: string;
}

const getSeverityBadgeVariant = (severity: string) => {
  switch (severity) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "default";
    default:
      return "outline";
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "escalated":
      return "secondary";
    default:
      return "outline";
  }
};

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    limit: 20,
  });
  const [filters, setFilters] = useState<Filters>({
    timeRange: "all",
    confidenceMin: 0,
    confidenceMax: 100,
    hasVehicle: "all",
    hasViolation: "all",
    violationType: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setPage(1);
    loadReports(1);
  }, [filters]);

  const loadReports = async (pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        timeRange: filters.timeRange,
        confidenceMin: filters.confidenceMin.toString(),
        confidenceMax: filters.confidenceMax.toString(),
        hasVehicle: filters.hasVehicle,
        hasViolation: filters.hasViolation,
        violationType: filters.violationType,
      });

      const response = await fetch(`/api/v1/admin/reports?${params}`);
      if (!response.ok) throw new Error("Failed to load reports");

      const data = await response.json();
      setReports(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, limit: 20 });
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      timeRange: "all",
      confidenceMin: 0,
      confidenceMax: 100,
      hasVehicle: "all",
      hasViolation: "all",
      violationType: "",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Reports</h1>
            <p className="text-muted-foreground mt-1">
              {pagination.total > 0
                ? `${(page - 1) * pagination.limit + 1}-${Math.min(
                    page * pagination.limit,
                    pagination.total
                  )} of ${pagination.total} reports`
                : "No reports found"}
            </p>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filters Card */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Time Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Range</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        timeRange: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                {/* Confidence Min */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Min Confidence: {filters.confidenceMin}%
                  </label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.confidenceMin}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        confidenceMin: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Confidence Max */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Confidence: {filters.confidenceMax}%
                  </label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.confidenceMax}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        confidenceMax: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Vehicle */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Vehicle Detected
                  </label>
                  <select
                    value={filters.hasVehicle}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        hasVehicle: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Violation Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Violation Type</label>
                  <select
                    value={filters.violationType}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        violationType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="speeding">Speeding</option>
                    <option value="rash_driving">Rash Driving</option>
                    <option value="wrong_parking">Wrong Parking</option>
                    <option value="red_light">Red Light</option>
                    <option value="helmet_violation">Helmet Violation</option>
                    <option value="seatbelt_violation">
                      Seatbelt Violation
                    </option>
                    <option value="phone_usage">Phone Usage</option>
                    <option value="no_license_plate">No License Plate</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={resetFilters} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Violation Reports</CardTitle>
            <CardDescription>
              View and manage all reported traffic violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground">No reports found</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Violation</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow
                          key={report.id}
                          className="hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(`/report/details/${report.id}`)
                          }
                        >
                          <TableCell className="font-semibold">
                            {report.vehicle_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {report.violation_type.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getSeverityBadgeVariant(report.severity)}
                            >
                              {report.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-semibold">
                              {(report.ai_assessment_score * 100).toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(report.status)}
                            >
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/report/details/${report.id}`);
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => page > 1 && loadReports(page - 1)}
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
                              onClick={() => loadReports(pageNum)}
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
                              page < pagination.pages && loadReports(page + 1)
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
