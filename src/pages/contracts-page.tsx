import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  Workflow,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, buildContractsQuery } from "@/lib/api";
import type { Contract, ContractsResponse } from "@/types/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(value?: string | null) {
  return (value || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtCurrency(value?: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
  terminated: "bg-amber-50 text-amber-700 border-amber-200",
  renewed: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  draft: "bg-slate-400",
  expired: "bg-rose-500",
  terminated: "bg-amber-500",
  renewed: "bg-blue-500",
};

const RISK_STYLES: Record<string, string> = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function riskLabel(contract: Contract) {
  const score = (contract as Contract & { risk_score?: number | null }).risk_score;
  if (typeof score === "number") return `Risk ${score}`;
  if (contract.risk_level) return fmt(contract.risk_level) + " risk";
  return null;
}

const STATUSES = ["draft", "active", "expired", "terminated", "renewed"] as const;

// ── Add-contract dropdown ─────────────────────────────────────────────────────

function AddContractButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-lg text-[13px]"
      >
        <Plus className="h-3.5 w-3.5" />
        New contract
        <ChevronDown className="h-3 w-3 opacity-70" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <Link
            to="/upload"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            Upload a document
          </Link>
          <Link
            to="/contracts/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Use a template
          </Link>
          <Link
            to="/contracts/create"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5 text-slate-400" />
            Start from scratch
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Per-card actions menu ────────────────────────────────────────────────────

function CardMenu({
  contract,
  isAdminOrManager,
  onDelete,
}: {
  contract: Contract;
  isAdminOrManager: boolean;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const hasItems = contract.workflow_id || isAdminOrManager;
  if (!hasItems) return null;

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {contract.workflow_id && (
            <Link
              to={`/workflows/${contract.workflow_id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
            >
              <Workflow className="h-3.5 w-3.5 text-slate-400" />
              {isAdminOrManager ? "Manage workflow" : "Track progress"}
            </Link>
          )}
          <Link
            to="/conflict-detection"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            Compare clauses
          </Link>
          {isAdminOrManager && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => { setOpen(false); onDelete(contract.id); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Contract card ────────────────────────────────────────────────────────────

function ContractCard({
  contract,
  isAdminOrManager,
  onDelete,
  onClick,
}: {
  contract: Contract;
  isAdminOrManager: boolean;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const status = (contract.status || "draft").toLowerCase();
  const risk = (contract.risk_level || "").toLowerCase();
  const dot = STATUS_DOT[status] ?? "bg-slate-300";
  const statusStyle = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const riskStyle = RISK_STYLES[risk];
  const riskText = riskLabel(contract);
  const currency = fmtCurrency(contract.value);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">
              {contract.title}
            </h3>
            {contract.description && (
              <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
                {contract.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge className={`border text-[11px] font-medium ${statusStyle}`}>
            {fmt(contract.status)}
          </Badge>
          {riskText && riskStyle && (
            <Badge className={`border text-[11px] font-medium ${riskStyle}`}>
              {riskText}
            </Badge>
          )}
          <CardMenu contract={contract} isAdminOrManager={isAdminOrManager} onDelete={onDelete} />
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
        {contract.contract_type && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
            {fmt(contract.contract_type)}
          </span>
        )}
        {currency && <span>{currency}</span>}
        {contract.start_date && (
          <span>
            {fmtDate(contract.start_date)}
            {contract.end_date ? ` → ${fmtDate(contract.end_date)}` : ""}
          </span>
        )}
        {contract.workflow_stage && (
          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-600">
            {fmt(contract.workflow_stage)}
          </span>
        )}
        {contract.current_version && contract.current_version > 1 && (
          <span className="text-slate-400">v{contract.current_version}</span>
        )}
      </div>

      {/* Parties */}
      {contract.parties && contract.parties.length > 0 && (
        <p className="mt-2 text-[12px] text-slate-400">
          {contract.parties.map((p) => p.name).join(" · ")}
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const role = String(
    user?.publicMetadata?.role || user?.unsafeMetadata?.role || ""
  ).trim().toLowerCase();
  const isAdminOrManager = role === "admin" || role === "manager";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<ContractsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (s = search, st = status) => {
    setLoading(true);
    setError(null);
    try {
      const query = buildContractsQuery({ search: s, status: st, per_page: 50 });
      const data = await api.listContracts(query);
      setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      setMeta(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-reload when status filter changes
  useEffect(() => { load(search, status); }, [status]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search, status), 400);
    return () => clearTimeout(t);
  }, [search]);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach((c) => {
      const t = c.contract_type || "other";
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({
      name: fmt(name),
      count,
    }));
  }, [contracts]);

  const deleteContract = async (id: string) => {
    if (!window.confirm("Delete this contract? This cannot be undone.")) return;
    try {
      await api.deleteContract(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  };

  return (
    <AppShell
      title="Contracts"
      subtitle={
        isAdminOrManager
          ? "All contracts across your organisation."
          : "Your contracts — click any card to view details."
      }
      contractGroups={contractGroups}
      actions={<AddContractButton />}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search + filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatus("")}
            className={`rounded-full border px-3 py-1 text-[12.5px] font-medium transition ${
              status === ""
                ? "border-slate-800 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(status === s ? "" : s)}
              className={`rounded-full border px-3 py-1 text-[12.5px] font-medium capitalize transition ${
                status === s
                  ? "border-slate-800 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Contract list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <FileText className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No contracts found</p>
          <p className="text-xs text-slate-400">
            Try adjusting your search or{" "}
            <Link to="/upload" className="text-indigo-500 underline underline-offset-2">
              upload a contract
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              isAdminOrManager={isAdminOrManager}
              onDelete={deleteContract}
              onClick={() => navigate(`/contracts/${contract.id}`)}
            />
          ))}
        </div>
      )}

      {meta && !loading && (
        <p className="mt-4 text-[12.5px] text-slate-400">
          {contracts.length} of {meta.total} contracts
        </p>
      )}
    </AppShell>
  );
}
