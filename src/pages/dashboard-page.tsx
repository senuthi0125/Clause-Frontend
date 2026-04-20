import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types/api";

type StatusItem = { status: string; count: number };
type ExpiringItem = {
  id: string;
  title: string;
  contract_type: string;
  end_date: string;
  days_remaining: number;
};
type ActivityItem = {
  id: string;
  title: string;
  status: string;
  workflow_stage: string;
  updated_at: string;
};

function label(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysLabel(days: number) {
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(Math.round((value / total) * 100), value > 0 ? 3 : 0);
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  draft: "bg-slate-400",
  expired: "bg-rose-500",
  terminated: "bg-amber-500",
  renewed: "bg-blue-500",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [types, setTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, t, st, ex, ac] = await Promise.all([
          api.getDashboardStats(),
          api.getContractsByType(),
          api.getContractsByStatus(),
          api.getExpiringSoon(),
          api.getRecentActivity(),
        ]);
        setStats(s);
        setTypes(t);
        setStatuses(st);
        setExpiring(ex);
        setActivity(ac);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const contractGroups = useMemo(
    () => types.map((i) => ({ name: label(i.type), count: i.count })),
    [types]
  );

  const total = stats?.total_contracts ?? 0;
  const active = stats?.active_contracts ?? 0;
  const pending = stats?.pending_approvals ?? 0;
  const highRisk = stats?.risk_summary.high ?? 0;
  const mediumRisk = stats?.risk_summary.medium ?? 0;
  const lowRisk = stats?.risk_summary.low ?? 0;
  const totalRisk = highRisk + mediumRisk + lowRisk;

  const kpis = [
    {
      label: "Total contracts",
      value: total,
      icon: FileText,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-50",
      sub: `${active} active`,
    },
    {
      label: "Active",
      value: active,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      sub: total ? `${Math.round((active / total) * 100)}% of total` : "—",
    },
    {
      label: "Pending approvals",
      value: pending,
      icon: Clock3,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      sub: "awaiting action",
    },
    {
      label: "High risk",
      value: highRisk,
      icon: AlertTriangle,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      sub: totalRisk ? `${Math.round((highRisk / totalRisk) * 100)}% of analysed` : "not yet analysed",
    },
  ];

  const radius = 70;
  const circ = 2 * Math.PI * radius;
  let cumOffset = 0;
  const riskSegments = totalRisk
    ? [
        { key: "low", count: lowRisk, color: "#6366f1" },
        { key: "medium", count: mediumRisk, color: "#f59e0b" },
        { key: "high", count: highRisk, color: "#f43f5e" },
      ]
    : [];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your contract portfolio at a glance."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                  <Icon className={`h-4.5 w-4.5 ${kpi.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                    {loading ? "—" : kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Middle row: status breakdown + risk ring */}
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          {/* Status breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[15px] font-semibold text-slate-900">Status breakdown</h2>
            <p className="mt-0.5 text-xs text-slate-400">Distribution across all your contracts</p>

            {loading ? (
              <p className="mt-6 text-sm text-slate-400">Loading…</p>
            ) : statuses.length === 0 ? (
              <p className="mt-6 text-sm text-slate-400">No contracts yet.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {statuses.map((item) => {
                  const barPct = pct(item.count, total);
                  const dot = STATUS_COLORS[item.status.toLowerCase()] ?? "bg-slate-400";
                  return (
                    <div key={item.status}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                          <span className="text-sm font-medium text-slate-700">
                            {label(item.status)}
                          </span>
                        </div>
                        <span className="text-xs tabular-nums text-slate-500">
                          {item.count} · {barPct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${dot}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Risk ring */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-1.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Risk profile</h2>
                <p className="mt-0.5 text-xs text-slate-400">Based on AI analysis results</p>
              </div>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-slate-400">Loading…</p>
            ) : (
              <div className="mt-4 flex flex-col items-center">
                {totalRisk === 0 ? (
                  <p className="py-6 text-sm text-slate-400">No contracts analysed yet.</p>
                ) : (
                  <>
                    <div className="relative flex h-[180px] w-[180px] items-center justify-center">
                      <svg viewBox="0 0 200 200" className="-rotate-90 h-[180px] w-[180px]">
                        <circle cx="100" cy="100" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="20" />
                        {riskSegments.map((seg) => {
                          const dash = (seg.count / totalRisk) * circ;
                          const gap = 6;
                          const dashArray = `${Math.max(dash - gap, 0)} ${circ}`;
                          const offset = -cumOffset;
                          cumOffset += dash;
                          return (
                            <circle
                              key={seg.key}
                              cx="100" cy="100" r={radius}
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="20"
                              strokeLinecap="round"
                              strokeDasharray={dashArray}
                              strokeDashoffset={offset}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-3xl font-semibold tabular-nums text-slate-900">{totalRisk}</p>
                        <p className="text-xs text-slate-400">analysed</p>
                      </div>
                    </div>

                    <div className="mt-3 w-full space-y-2">
                      {[
                        { key: "low", label: "Low", count: lowRisk, color: "bg-indigo-500" },
                        { key: "medium", label: "Medium", count: mediumRisk, color: "bg-amber-400" },
                        { key: "high", label: "High", count: highRisk, color: "bg-rose-500" },
                      ].map((r) => (
                        <div key={r.key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${r.color}`} />
                            <span className="text-[13px] text-slate-600">{r.label} risk</span>
                          </div>
                          <span className="text-[13px] font-medium tabular-nums text-slate-800">
                            {r.count} <span className="text-slate-400 font-normal">({pct(r.count, totalRisk)}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: expiring + activity */}
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          {/* Expiring contracts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[15px] font-semibold text-slate-900">Expiring within 30 days</h2>
            <p className="mt-0.5 text-xs text-slate-400">Contracts that need attention soon</p>

            <div className="mt-4 space-y-2">
              {loading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : expiring.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  No contracts expiring in the next 30 days.
                </div>
              ) : (
                expiring.map((item) => (
                  <Link
                    key={item.id}
                    to={`/contracts/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {label(item.contract_type)} · ends {shortDate(item.end_date)}
                      </p>
                    </div>
                    <Badge
                      className={`shrink-0 rounded-full px-2.5 text-xs ${
                        item.days_remaining <= 7
                          ? "bg-rose-100 text-rose-700"
                          : item.days_remaining <= 14
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {daysLabel(item.days_remaining)} left
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Recent activity</h2>
                <p className="mt-0.5 text-xs text-slate-400">Latest contract updates</p>
              </div>
              <TrendingUp className="h-4 w-4 text-slate-300" />
            </div>

            <div className="mt-4 space-y-2">
              {loading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="text-sm text-slate-400">No recent activity.</p>
              ) : (
                activity.map((item) => (
                  <Link
                    key={item.id}
                    to={`/contracts/${item.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                          {label(item.status)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {label(item.workflow_stage)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-600">
                      <span>{shortDate(item.updated_at)}</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
