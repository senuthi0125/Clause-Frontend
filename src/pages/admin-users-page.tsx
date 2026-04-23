import { useEffect, useMemo, useState } from "react";
import { Search, UserX, UserCheck, User } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppCard } from "@/components/ui/app-card";
import { AppBadge } from "@/components/ui/app-badge";
import { AppInput } from "@/components/ui/app-input";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Contract, UserRole } from "@/types/api";

type UserRow = {
  id: string;
  clerk_id?: string;
  email?: string;
  full_name?: string;
  image_url?: string;
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

function roleBadgeVariant(
  role?: string | null
): "rose" | "amber" | "slate" | "blue" {
  switch ((role || "").toLowerCase()) {
    case "admin":
      return "rose";
    case "manager":
      return "amber";
    case "viewer":
      return "slate";
    default:
      return "blue";
  }
}

function statusBadgeVariant(
  status?: string | null
): "emerald" | "slate" {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "emerald";
    case "inactive":
    case "deactivated":
      return "slate";
    default:
      return "slate";
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
      setError(err instanceof Error ? err.message : "Failed to load users.");
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
      setError(err instanceof Error ? err.message : "Failed to change role.");
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

  const activate = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      await api.activateUser(userId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate user.");
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
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <AppCard tone="soft">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <AppInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role"
              className="h-11 pl-11"
            />
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredUsers.length} total users
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading users...
          </p>
        ) : filteredUsers.length === 0 ? (
          <AppEmptyState title="No users found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-white/10">
                  <th
                    colSpan={2}
                    className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    User
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Role
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Joined
                  </th>
                  <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const initials = (user.full_name || user.email || "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("");

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-violet-50/40 dark:border-white/6 dark:hover:bg-violet-500/5"
                    >
                      <td className="py-4 pr-4" colSpan={2}>
                        <div className="flex items-center gap-3">
                          {user.image_url ? (
                            <img
                              src={user.image_url}
                              alt={user.full_name || "avatar"}
                              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-white/10"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 ring-2 ring-slate-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-white/10">
                              {initials || <User className="h-4 w-4" />}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                              {user.full_name || (
                                <span className="font-normal italic text-slate-400">
                                  No name
                                </span>
                              )}
                            </p>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                              {user.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <AppBadge
                          variant={roleBadgeVariant(user.role)}
                          className="capitalize"
                        >
                          {user.role || "user"}
                        </AppBadge>
                      </td>

                      <td className="py-4 pr-4">
                        <AppBadge variant={statusBadgeVariant(user.status)}>
                          {formatLabel(user.status) || "Unknown"}
                        </AppBadge>
                      </td>

                      <td className="py-4 pr-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role || "user"}
                            onChange={(e) =>
                              changeRole(user.id, e.target.value as UserRole)
                            }
                            disabled={busyUserId === user.id}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <option value="user">User</option>
                            <option value="viewer">Viewer</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>

                          {(user.status || "active").toLowerCase() ===
                          "inactive" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activate(user.id)}
                              disabled={busyUserId === user.id}
                              className="rounded-xl border-green-200 text-green-700 hover:bg-green-50 dark:border-green-500/20 dark:text-green-300 dark:hover:bg-green-500/10"
                            >
                              <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                              Activate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deactivate(user.id)}
                              disabled={busyUserId === user.id}
                              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                            >
                              <UserX className="mr-1.5 h-3.5 w-3.5" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AppCard>
    </AppShell>
  );
}