import { useEffect, useState } from "react";
import { RefreshCw, Search, ShieldOff, UserCog } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AdminUser, UserRole, UsersListResponse } from "@/types/api";

const ROLES: UserRole[] = ["admin", "manager", "user", "viewer"];

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-700";
    case "manager":
      return "bg-amber-100 text-amber-700";
    case "user":
      return "bg-blue-100 text-blue-700";
    case "viewer":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-slate-200 text-slate-700";
    case "suspended":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listUsers(targetPage, perPage);
      setData(result);
    } catch (err) {
      console.error("List users failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRoleChange = async (user: AdminUser, role: UserRole) => {
    if (role === user.role) return;
    if (
      !confirm(
        `Change role for ${user.full_name || user.email} from "${user.role}" to "${role}"?`
      )
    ) {
      return;
    }
    setBusyId(user.id);
    setNotice(null);
    try {
      await api.changeUserRole(user.id, role);
      setNotice(`Updated ${user.email} → ${role}`);
      await loadData(page);
    } catch (err) {
      console.error("Change role failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change role."
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (
      !confirm(
        `Deactivate ${user.full_name || user.email}? They will no longer be able to access the system.`
      )
    ) {
      return;
    }
    setBusyId(user.id);
    setNotice(null);
    try {
      await api.deactivateUser(user.id);
      setNotice(`Deactivated ${user.email}`);
      await loadData(page);
    } catch (err) {
      console.error("Deactivate failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to deactivate user."
      );
    } finally {
      setBusyId(null);
    }
  };

  const filtered = (data?.users ?? []).filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const totalPages = data?.total_pages ?? 1;

  return (
    <AppShell
      title="User Management"
      subtitle="Modify user roles and deactivate accounts (admin only)."
      actions={
        <Button variant="outline" onClick={() => loadData(page)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role"
                className="pl-9"
              />
            </div>
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading users..."
                : `${data?.total ?? 0} total user${(data?.total ?? 0) === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-sm text-slate-500"
                    >
                      No users match your search.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">
                        {u.full_name || "Unnamed user"}
                      </p>
                      {u.organization ? (
                        <p className="text-xs text-slate-500">
                          {u.organization}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge className={roleBadgeClass(u.role)}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={statusBadgeClass(u.status)}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          disabled={busyId === u.id}
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u, e.target.value as UserRole)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            busyId === u.id || u.status !== "active"
                          }
                          onClick={() => handleDeactivate(u)}
                        >
                          {u.status === "active" ? (
                            <>
                              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCog className="mr-1.5 h-3.5 w-3.5" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                Page {data?.page ?? page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
