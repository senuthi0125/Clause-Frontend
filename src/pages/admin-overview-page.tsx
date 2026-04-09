import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type {
  AdminRecentUser,
  AdminStats,
  AdminUserActivity,
  ApprovalStat,
  ContractsByStage,
  ValueByType,
} from "@/types/api";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatCurrency(value: number) {
  if (!value) return "$0";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

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

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [stages, setStages] = useState<ContractsByStage[]>([]);
  const [valueByType, setValueByType] = useState<ValueByType[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStat[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminRecentUser[]>([]);
  const [activity, setActivity] = useState<AdminUserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, st, vbt, ap, ru, ac] = await Promise.all([
        api.getAdminStats(),
        api.getAdminContractsByStage(),
        api.getAdminValueByType(),
        api.getAdminApprovalStats(),
        api.getAdminRecentUsers(),
        api.getAdminUserActivity(),
      ]);
      setStats(s);
      setStages(st);
      setValueByType(vbt);
      setApprovalStats(ap);
      setRecentUsers(ru);
      setActivity(ac);
    } catch (err) {
      console.error("Admin overview load failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load admin overview data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats?.users.total ?? 0,
      icon: Users,
      helper: `${stats?.users.active ?? 0} active`,
    },
    {
      title: "Total Contracts",
      value: stats?.contracts.total ?? 0,
      icon: FileText,
      helper: `${stats?.contracts.created_this_month ?? 0} created in last 30 days`,
    },
    {
      title: "Pending Approvals",
      value: stats?.approvals.pending ?? 0,
      icon: CheckCircle2,
      helper: `${stats?.approvals.total ?? 0} total`,
    },
    {
      title: "High Risk Contracts",
      value: stats?.risk.high ?? 0,
      icon: AlertTriangle,
      helper: `${stats?.risk.medium ?? 0} medium · ${stats?.risk.low ?? 0} low`,
    },
  ];

  const totalStageCount = stages.reduce((acc, s) => acc + s.count, 0);
  const totalApprovalCount = approvalStats.reduce(
    (acc, a) => acc + a.count,
    0
  );

  return (
    <AppShell
      title="Admin Overview"
      subtitle="System-wide statistics, value, risk and activity (admin/manager only)."
      actions={
        <Button variant="outline" onClick={loadData}>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="border border-slate-200 bg-white shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{card.title}</p>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                      {loading ? "..." : card.value}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-2.5 text-white shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="border border-slate-200 bg-white shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Contract value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-slate-600">Total value</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(stats?.contract_values.total_value ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-slate-600">Average</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(stats?.contract_values.avg_value ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-slate-600">Largest</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(stats?.contract_values.max_value ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Contracts by workflow stage</CardTitle>
          </CardHeader>
          <CardContent>
            {stages.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No stage data found.</p>
            ) : (
              <div className="space-y-3">
                {stages.map((s) => (
                  <div key={s.stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {formatLabel(s.stage)}
                      </span>
                      <span className="font-medium text-slate-900">
                        {s.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{
                          width: `${
                            totalStageCount
                              ? Math.max(
                                  (s.count / totalStageCount) * 100,
                                  6
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Value by contract type</CardTitle>
          </CardHeader>
          <CardContent>
            {valueByType.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No value data found.</p>
            ) : (
              <div className="space-y-2">
                {valueByType.map((v) => (
                  <div
                    key={v.type ?? "unknown"}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatLabel(v.type ?? "unknown")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {v.count} contract{v.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(v.total_value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Approvals breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {approvalStats.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No approvals yet.</p>
            ) : (
              <div className="space-y-3">
                {approvalStats.map((a) => (
                  <div key={a.status ?? "unknown"}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {formatLabel(a.status ?? "unknown")}
                      </span>
                      <span className="font-medium text-slate-900">
                        {a.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{
                          width: `${
                            totalApprovalCount
                              ? Math.max(
                                  (a.count / totalApprovalCount) * 100,
                                  6
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Recent users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {u.full_name || u.email || "Unnamed user"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {u.email ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-slate-900 text-white">
                        {formatLabel(u.role ?? "user")}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatDate(u.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent system activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatLabel(a.action)} ·{" "}
                          {formatLabel(a.resource_type)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {a.user_email ?? "system"}
                          {a.details ? ` — ${a.details}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(a.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
