import { useState, useEffect } from "react";
import { AdminLayout } from "../components/layout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Trash2, Plus } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/admin/users");
      if (!response.ok) throw new Error("Failed to load users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.password || !formData.fullName) {
      setError("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create user");
      }

      const newUser = await response.json();
      setUsers([...users, newUser]);
      setFormData({ email: "", password: "", fullName: "" });
      setShowForm(false);
      setSuccess("Admin user created successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this admin user?")) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers(users.filter((u) => u.id !== userId));
      setSuccess("Admin user deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Users</h1>
            <p className="text-muted-foreground mt-1">
              {users.length} admin users
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Admin
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="border border-border rounded-lg p-6 bg-muted/50 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Create New Admin User
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={submitting}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">No admin users</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {user.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(user.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
