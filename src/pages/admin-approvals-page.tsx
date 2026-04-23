import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Clock3, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AppBadge } from "@/components/ui/app-badge";
import { AppCard } from "@/components/ui/app-card";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { api } from "@/lib/api";
import type { Contract } from "@/types/api";

type ApprovalItem = {
  id: string;
  contractId: string;
  contractTitle: string;
  approver?: string;
  status?: string;
  createdAt?: string;
};

function formatLabel(value?: string | null) {
  return (value || "pending")
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function badgeVariant(
  value?: string | null
): "emerald" | "rose" | "amber" {
  switch ((value || "").toLowerCase()) {
    case "approved":
    case "accepted":
    case "completed":
      return "emerald";
    case "rejected":
    case "declined":
      return "rose";
    case "pending":
    default:
      return "amber";
  }
}

export default function AdminApprovalsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApprovals = async () => {
    setLoading(true);
    setError(null);

    try {
      const contractsRes = await api.listContracts("?per_page=100");
      const contractList = Array.isArray(contractsRes?.contracts)
        ? contractsRes.contracts
        : [];

      setContracts(contractList);

      const approvalResults = await Promise.all(
        contractList.map(async (contract) => {
          try {
            const res = await api.getApprovalsByContract(contract.id);
            const items = Array.isArray((res as any)?.approvals)
              ? (res as any).approvals
              : Array.isArray(res)
              ? res
              : [];

            return items.map((item: any, index: number) => ({
              id: item.id || `${contract.id}-${index}`,
              contractId: contract.id,
              contractTitle: contract.title,
              approver:
                item.approver_name || item.approver || item.name || "Approver",
              status: item.status || "pending",
              createdAt: item.created_at || item.updated_at || "",
            }));
          } catch {
            return [];
          }
        })
      );

      setApprovals(approvalResults.flat());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load approvals."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
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

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    approvals.forEach((item) => {
      const status = (item.status || "").toLowerCase();
      if (
        status === "approved" ||
        status === "accepted" ||
        status === "completed"
      ) {
        approved += 1;
      } else if (status === "rejected" || status === "declined") {
        rejected += 1;
      } else {
        pending += 1;
      }
    });

    return {
      total: approvals.length,
      pending,
      approved,
      rejected,
    };
  }, [approvals]);

  return (
    <AppShell
      title="Admin Approvals"
      subtitle="Review approval activity across all backend contracts."
      contractGroups={contractGroups}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-amber-100 bg-amber-50 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pending
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                  {loading ? "—" : stats.pending}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-amber-600 dark:bg-white/10 dark:text-amber-300">
                <Clock3 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-green-100 bg-green-50 shadow-sm dark:border-green-500/20 dark:bg-green-500/10">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Approved
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                  {loading ? "—" : stats.approved}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-green-600 dark:bg-white/10 dark:text-green-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-violet-100 bg-violet-50 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Approvals
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                  {loading ? "—" : stats.total}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-violet-600 dark:bg-white/10 dark:text-violet-300">
                <CheckCheck className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppCard tone="soft" className="mt-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Approval Records
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Approval status across contracts and approvers.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading approvals...
          </p>
        ) : approvals.length === 0 ? (
          <AppEmptyState title="No approvals found." />
        ) : (
          <div className="space-y-3">
            {approvals.map((item) => (
              <Link
                key={item.id}
                to={`/contracts/${item.contractId}`}
                className="block rounded-2xl border border-violet-100 bg-white/70 p-4 transition hover:bg-violet-50/80 dark:border-violet-500/20 dark:bg-white/5 dark:hover:bg-violet-500/10"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">
                      {item.contractTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Approver: {item.approver || "Unknown"}
                    </p>
                    {item.createdAt ? (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Updated: {new Date(item.createdAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>

                  <AppBadge variant={badgeVariant(item.status)}>
                    {formatLabel(item.status)}
                  </AppBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </AppCard>
    </AppShell>
  );
}