import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ThemeToggle } from "./ui/theme-toggle";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/v1/admin/me");
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setAdminName(data.admin?.fullName || "Admin");
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.png"
              alt="ThirdEye Logo"
              className="h-8 object-contain"
            />
            <span className="text-xl font-semibold text-foreground">
              ThirdEye
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!loading && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground/70">
                      {adminName}
                    </span>
                    <Link
                      to="/admin/dashboard"
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Link
                    to="/admin/login"
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Admin Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
