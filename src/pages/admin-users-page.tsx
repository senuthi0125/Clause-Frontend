import { useEffect, useMemo, useState } from "react";
import { Search, UserX } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Contract, UserRole } from "@/types/api";

type UserRow = {
  id: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  status?: string;
  company?: string;
  created_at?: string;
};

function formatLabel(value?: string | null) {
  return (value || "-")
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function roleBadgeClass(role?: string | null) {
  switch ((role || "").toLowerCase()) {
    case "admin":
      return "bg-red-100 text-red-700";
    case "manager":
      return "bg-amber-100 text-amber-700";
    case "viewer":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function statusBadgeClass(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
    case "deactivated":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, contractsResponse] = await Promise.all([
        api.listUsers(1, 100),
        api.listContracts("?per_page=200").catch(() => ({ contracts: [] })),
      ]);

      setUsers(Array.isArray(usersResponse?.users) ? usersResponse.users : []);
      setContracts(
        Array.isArray(contractsResponse?.contracts)
          ? contractsResponse.contracts
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load users."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      const type = contract.contract_type || "other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [contracts]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) => {
      const haystack = [
        user.full_name,
        user.email,
        user.role,
        user.company,
        user.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [users, search]);

  const changeRole = async (userId: string, role: UserRole) => {
    setBusyUserId(userId);
    setError(null);

    try {
      await api.changeUserRole(userId, role);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change role."
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const deactivate = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);

    try {
      await api.deactivateUser(userId);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate user."
      );
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <AppShell
      title="User Management"
      subtitle="Modify user roles and deactivate accounts (admin only)."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none"
              />
            </div>

            <p className="text-sm text-slate-500">
              {filteredUsers.length} total users
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>
                    <th className="pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>
                    <th className="pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Joined
                    </th>
                    <th className="pb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="py-5">
                        <div>
                          <p className="font-medium text-slate-950">
                            {user.full_name || "Unnamed user"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {user.company || ""}
                          </p>
                        </div>
                      </td>

                      <td className="py-5 text-slate-700">
                        {user.email || "—"}
                      </td>

                      <td className="py-5">
                        <Badge className={roleBadgeClass(user.role)}>
                          {user.role || "user"}
                        </Badge>
                      </td>

                      <td className="py-5">
                        <Badge className={statusBadgeClass(user.status)}>
                          {user.status || "unknown"}
                        </Badge>
                      </td>

                      <td className="py-5 text-slate-700">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <select
                            value={user.role || "user"}
                            onChange={(e) =>
                              changeRole(user.id, e.target.value as UserRole)
                            }
                            disabled={busyUserId === user.id}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                          >
                            <option value="user">user</option>
                            <option value="viewer">viewer</option>
                            <option value="manager">manager</option>
                            <option value="admin">admin</option>
                          </select>

                          <Button
                            variant="outline"
                            onClick={() => deactivate(user.id)}
                            disabled={busyUserId === user.id}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}