import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types/api";

function formatTypeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [types, setTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [statuses, setStatuses] = useState<
    Array<{ status: string; count: number }>
  >([]);
  const [expiring, setExpiring] = useState<
    Array<{
      id: string;
      title: string;
      contract_type: string;
      end_date: string;
      days_remaining: number;
    }>
  >([]);
  const [activity, setActivity] = useState<
    Array<{
      id: string;
      title: string;
      status: string;
      workflow_stage: string;
      updated_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsData, typeData, statusData, expiringData, activityData] =
        await Promise.all([
          api.getDashboardStats(),
          api.getContractsByType(),
          api.getContractsByStatus(),
          api.getExpiringSoon(),
          api.getRecentActivity(),
        ]);

      setStats(statsData);
      setTypes(typeData);
      setStatuses(statusData);
      setExpiring(expiringData);
      setActivity(activityData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contractGroups = useMemo(
    () =>
      types.map((item) => ({
        name: formatTypeLabel(item.type),
        count: item.count,
      })),
    [types]
  );

  const cards = [
    {
      title: "Total Contracts",
      value: stats?.total_contracts ?? 0,
      icon: FileText,
      helper: "All contracts in repository",
    },
    {
      title: "Active Contracts",
      value: stats?.active_contracts ?? 0,
      icon: CheckCircle2,
      helper: "Currently in force",
    },
    {
      title: "Pending Approvals",
      value: stats?.pending_approvals ?? 0,
      icon: Clock3,
      helper: "Waiting for stakeholder action",
    },
    {
      title: "High Risk Items",
      value: stats?.risk_summary.high ?? 0,
      icon: AlertTriangle,
      helper: "Needs closer legal review",
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Live overview of contracts, risk, and activity from your backend."
      contractGroups={contractGroups}
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

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Contracts by status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statuses.length === 0 && !loading ? (
                <p className="text-sm text-slate-500">No status data found.</p>
              ) : null}

              {statuses.map((item) => (
                <div key={item.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {formatTypeLabel(item.status)}
                    </span>
                    <span className="font-medium text-slate-900">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                      style={{
                        width: `${
                          stats?.total_contracts
                            ? Math.max(
                                (item.count / stats.total_contracts) * 100,
                                8
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Risk summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                ["Low", stats?.risk_summary.low ?? 0, "bg-green-100 text-green-700"],
                [
                  "Medium",
                  stats?.risk_summary.medium ?? 0,
                  "bg-amber-100 text-amber-700",
                ],
                ["High", stats?.risk_summary.high ?? 0, "bg-red-100 text-red-700"],
              ].map(([label, count, cls]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <span>{label}</span>
                  <Badge className={String(cls)}>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Expiring soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiring.length === 0 && !loading ? (
                <p className="text-sm text-slate-500">
                  No active contracts are expiring soon.
                </p>
              ) : null}

              {expiring.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatTypeLabel(item.contract_type)} · ends{" "}
                        {formatDate(item.end_date)}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">
                      {item.days_remaining} days
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.length === 0 && !loading ? (
                <p className="text-sm text-slate-500">No recent activity found.</p>
              ) : null}

              {activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatTypeLabel(item.status)} ·{" "}
                        {formatTypeLabel(item.workflow_stage)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(item.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}