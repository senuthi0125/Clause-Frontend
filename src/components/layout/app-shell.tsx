import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCheck,
  FileText,
  LayoutDashboard,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  ScrollText,
  LockKeyhole,
  Workflow,
  Bell,
  ChevronRight,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

type ContractGroup = { name: string; count: number };

type AppShellProps = {
  title: string;
  subtitle?: string;
  contractGroups?: ContractGroup[];
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavSection = { label: string; items: NavItem[] };

const MAIN_SECTIONS: NavSection[] = [
  {
    label: "",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Contracts",
    items: [
      { label: "All Contracts", href: "/contracts", icon: FileText },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "AI Analysis", href: "/ai-analysis", icon: Sparkles },
      { label: "Conflict Detection", href: "/conflict-detection", icon: Shield },
      { label: "Risk Analysis", href: "/risk-analysis", icon: ShieldAlert },
    ],
  },
  {
    label: "Tools",
    items: [{ label: "Calendar", href: "/calendar", icon: CalendarDays }],
  },
];

const ADMIN_SECTION: NavSection = {
  label: "Administration",
  items: [
    { label: "Overview", href: "/admin", icon: LockKeyhole },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Workflows", href: "/admin/workflows", icon: Workflow },
    { label: "Approvals", href: "/admin/approvals", icon: CheckCheck },
    { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
  ],
};

const MANAGER_SECTION: NavSection = {
  label: "Management",
  items: [
    { label: "Workflows", href: "/admin/workflows", icon: Workflow },
    { label: "Approvals", href: "/admin/approvals", icon: CheckCheck },
  ],
};

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
        isActive
          ? "bg-white/12 text-white"
          : "text-slate-400 hover:bg-white/6 hover:text-slate-200"
      )}
    >
      <Icon
        className={cn(
          "h-[15px] w-[15px] shrink-0 transition-colors",
          isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="truncate">{item.label}</span>
      {isActive && (
        <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-slate-400" />
      )}
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  contractGroups = [],
  actions,
  children,
}: AppShellProps) {
  const location = useLocation();
  const { user } = useUser();
  const [adminMode, setAdminMode] = useState(false);

  const role = String(
    user?.publicMetadata?.role || user?.unsafeMetadata?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isAdminOrManager = isAdmin || isManager;

  useEffect(() => {
    if (!isAdminOrManager) {
      localStorage.removeItem("admin_mode");
      setAdminMode(false);
      return;
    }
    const stored = localStorage.getItem("admin_mode");
    if (stored === "true") setAdminMode(true);
    if (location.pathname.startsWith("/admin")) {
      localStorage.setItem("admin_mode", "true");
      setAdminMode(true);
    }
  }, [isAdminOrManager, location.pathname]);

  const handleAdminClick = () => {
    localStorage.setItem("admin_mode", "true");
    setAdminMode(true);
  };

  const extraSection = adminMode
    ? isAdmin
      ? ADMIN_SECTION
      : MANAGER_SECTION
    : null;

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  const firstName = user?.firstName || user?.username || "there";

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 flex-col bg-[#111827] lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-[11px] font-bold text-white">
            CL
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            clause
          </span>
          <span className="ml-auto rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            beta
          </span>
        </div>

        {/* User pill */}
        <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{ elements: { avatarBox: "h-6 w-6" } }}
          />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium text-slate-200">
              {firstName}
            </p>
            <p className="truncate text-[11px] text-slate-500 capitalize">{role || "user"}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {MAIN_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-5" : ""}>
              {section.label && (
                <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}

          {extraSection && (
            <div className="mt-5 border-t border-white/8 pt-5">
              <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {extraSection.label}
              </p>
              <div className="space-y-0.5">
                {extraSection.items.map((item) => (
                  <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar footer: contract type counts */}
        {contractGroups.length > 0 && (
          <div className="border-t border-white/8 px-4 py-4">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Contract types
            </p>
            <div className="space-y-1.5">
              {contractGroups.slice(0, 5).map((g) => (
                <div key={g.name} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] text-slate-400">{g.name}</span>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    {g.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}

              {isAdminOrManager && (
                <Link
                  to={isAdmin ? "/admin" : "/admin/workflows"}
                  onClick={handleAdminClick}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition",
                    location.pathname.startsWith("/admin")
                      ? "border-slate-800 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <LockKeyhole className="h-3.5 w-3.5" />
                  {isAdmin ? "Admin" : "Manage"}
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
