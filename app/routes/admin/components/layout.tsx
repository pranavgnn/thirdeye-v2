import {
  BarChart3,
  LogOut,
  Menu,
  Eye,
  AlertTriangle,
  Users,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/admin/dashboard",
  },
  {
    label: "All Reports",
    icon: <FileText className="w-5 h-5" />,
    href: "/admin/reports",
  },
  {
    label: "Reports to Review",
    icon: <Eye className="w-5 h-5" />,
    href: "/admin/review",
  },
  {
    label: "Escalations",
    icon: <AlertTriangle className="w-5 h-5" />,
    href: "/admin/escalations",
  },
  {
    label: "Audit Logs",
    icon: <FileText className="w-5 h-5" />,
    href: "/admin/audit-logs",
  },
  {
    label: "Admin Users",
    icon: <Users className="w-5 h-5" />,
    href: "/admin/users",
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("/api/v1/admin/logout", { method: "POST" });
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } border-r border-border bg-background transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-foreground">
              ThirdEye Admin
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-white transform bg-red-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-border p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
