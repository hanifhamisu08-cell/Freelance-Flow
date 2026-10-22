"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Shield,
  Bug,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SecurityScore {
  grade: string;
  score: number;
  color: string;
}

interface RecentAlert {
  id: string;
  title: string;
  severity: string;
  status: string;
  type: string;
  clientName: string;
  detectedAt: string;
}

interface OutstandingInvoice {
  id: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface OwnerStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeBugs: number;
  uptimePercent: number;
  securityScore: SecurityScore;
  totalInvoices: number;
  paidInvoices: number;
  outstandingInvoices: number;
  recentAlerts: RecentAlert[];
  outstandingInvoicesList: OutstandingInvoice[];
  monthlyRevenue: MonthlyRevenue[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60)
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function severityVariant(
  severity: string
): "destructive" | "secondary" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "secondary";
  return "outline";
}

function severityColor(severity: string): string {
  if (severity === "critical") return "#ef4444";
  if (severity === "warning") return "#f59e0b";
  return "#6b7280";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCardShell({
  label,
  children,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card
      className={cn(
        "bg-panel border-hairline overflow-hidden shadow-card transition-all duration-200",
        "hover:border-[var(--hairline-soft,#1f2429)]"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${iconBg}18`, color: iconColor }}
          >
            {icon}
          </span>
        </div>
        <div className="mt-2.5">{children}</div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  icon,
  iconColor,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("bg-panel border-hairline shadow-card", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <span style={iconColor ? { color: iconColor } : undefined}>
            {icon}
          </span>
          <CardTitle className="text-sm font-semibold tracking-tight">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

function AlertRow({ alert }: { alert: RecentAlert }) {
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-hairline last:border-b-0 first:pt-0 last:pb-0">
      {/* Row 1: severity badge + title */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-medium",
            alert.severity === "critical" &&
              "bg-red-500/15 text-red-500",
            alert.severity === "warning" &&
              "bg-amber/15 text-amber",
            alert.severity === "info" &&
              "bg-teal/15 text-teal",
            alert.severity !== "critical" &&
              alert.severity !== "warning" &&
              alert.severity !== "info" &&
              "bg-muted text-muted-foreground"
          )}
        >
          {alert.severity}
        </span>
        <span className="text-sm font-medium truncate">{alert.title}</span>
      </div>
      {/* Row 2: client + status */}
      <div className="flex items-center gap-2 pl-0.5">
        <span className="text-[11px] text-muted-foreground truncate">
          {alert.clientName}
        </span>
        <span className="text-muted-foreground/40 text-[10px]">·</span>
        <Badge variant="outline" className="h-5 text-[10px] px-1.5">
          {alert.status}
        </Badge>
      </div>
      {/* Row 3: time ago */}
      <span className="pl-0.5 text-[10px] text-muted-foreground/70">
        {timeAgo(alert.detectedAt)}
      </span>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: OutstandingInvoice }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-hairline last:border-b-0 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium truncate">
          {invoice.clientName}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              invoice.status === "overdue" ? "destructive" : "outline"
            }
            className="h-5 text-[10px] px-1.5"
          >
            {invoice.status}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Due {invoice.dueDate}
          </span>
        </div>
      </div>
      <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-teal">
        {formatCurrency(invoice.amount)}
      </span>
    </div>
  );
}

function RevenueBarChart({ data }: { data: MonthlyRevenue[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-3 sm:gap-5 h-44 w-full">
      {data.map((item) => {
        const pct = Math.max((item.revenue / maxRevenue) * 100, 4);
        return (
          <div
            key={item.month}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            {/* Amount label */}
            <span className="text-[11px] font-medium tabular-nums text-foreground whitespace-nowrap">
              {formatCurrency(item.revenue)}
            </span>
            {/* Bar */}
            <div className="w-full flex flex-col justify-end" style={{ height: "140px" }}>
              <div
                className="w-full rounded-t-md bg-[#14b8a6] transition-all duration-700 ease-out"
                style={{
                  height: `${pct}%`,
                  minHeight: "6px",
                }}
              />
            </div>
            {/* Month label */}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Greeting skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-56 rounded-md bg-muted animate-pulse" />
        <div className="ml-auto h-6 w-28 rounded-full bg-muted animate-pulse" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-panel border-hairline">
            <CardContent className="p-4">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="mt-3 h-7 w-28 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Columns skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-panel border-hairline">
            <CardContent className="p-4 space-y-4">
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-2 py-2">
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-2/3 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart skeleton */}
      <Card className="bg-panel border-hairline">
        <CardContent className="p-4">
          <div className="h-4 w-32 rounded bg-muted animate-pulse mb-6" />
          <div className="flex items-end gap-5 h-44">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                <div
                  className="w-full rounded-t-md bg-muted animate-pulse"
                  style={{ height: `${40 + i * 20}%` }}
                />
                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function OwnerOverview() {
  const { user, refreshTick } = useApp();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/owner/stats")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: OwnerStats) => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load dashboard data");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  /* Loading state */
  if (loading) return <LoadingSkeleton />;

  /* Error state */
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-medium">
            Could not load dashboard
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error || "Unknown error — please try again."}
          </p>
        </div>
        <button
          onClick={() => useApp.getState().bump()}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-hairline bg-panel px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const gradeColor = GRADE_COLORS[stats.securityScore.grade] || "#84cc16";

  return (
    <div className="flex flex-col gap-6">
      {/* ============================================================ */}
      {/*  Greeting Header                                              */}
      {/* ============================================================ */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between anim-rise">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back,{" "}
            <span className="text-teal">{user?.name || "Owner"}</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Here&apos;s your business overview at a glance.
          </p>
        </div>
        <Badge
          className="self-start sm:self-auto shrink-0 border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6] hover:bg-[#14b8a6]/15"
        >
          <Shield className="mr-1 h-3 w-3" />
          Business Owner
        </Badge>
      </header>

      {/* ============================================================ */}
      {/*  6 Stat Cards                                                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 stagger">
        {/* Total Revenue */}
        <StatCardShell
          label="Total Revenue"
          icon={<DollarSign className="h-3.5 w-3.5" />}
          iconBg="#22c55e"
          iconColor="#22c55e"
        >
          <span className="font-display text-2xl font-semibold tabular-nums text-green-500">
            {formatCurrency(stats.totalRevenue)}
          </span>
        </StatCardShell>

        {/* Total Expenses */}
        <StatCardShell
          label="Total Expenses"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          iconBg="#f59e0b"
          iconColor="#f59e0b"
        >
          <span className="font-display text-2xl font-semibold tabular-nums text-amber">
            {formatCurrency(stats.totalExpenses)}
          </span>
        </StatCardShell>

        {/* Net Profit */}
        <StatCardShell
          label="Net Profit"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          iconBg="#14b8a6"
          iconColor="#14b8a6"
        >
          <span className="font-display text-2xl font-semibold tabular-nums text-teal">
            {formatCurrency(stats.netProfit)}
          </span>
        </StatCardShell>

        {/* Security Score */}
        <StatCardShell
          label="Security Score"
          icon={<Shield className="h-3.5 w-3.5" />}
          iconBg={gradeColor}
          iconColor={gradeColor}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-3xl font-bold tabular-nums leading-none"
              style={{ color: gradeColor }}
            >
              {stats.securityScore.grade}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {stats.securityScore.score}/100
            </span>
          </div>
        </StatCardShell>

        {/* Active Bugs */}
        <StatCardShell
          label="Active Bugs"
          icon={<Bug className="h-3.5 w-3.5" />}
          iconBg={stats.activeBugs > 5 ? "#ef4444" : "#f59e0b"}
          iconColor={stats.activeBugs > 5 ? "#ef4444" : "#f59e0b"}
        >
          <span
            className="font-display text-2xl font-semibold tabular-nums"
            style={{
              color: stats.activeBugs > 5 ? "#ef4444" : "#f59e0b",
            }}
          >
            {stats.activeBugs}
          </span>
        </StatCardShell>

        {/* Uptime */}
        <StatCardShell
          label="Uptime"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          iconBg={stats.uptimePercent > 99 ? "#22c55e" : "#f59e0b"}
          iconColor={stats.uptimePercent > 99 ? "#22c55e" : "#f59e0b"}
        >
          <div className="flex items-baseline gap-1">
            <span
              className="font-display text-2xl font-semibold tabular-nums"
              style={{
                color: stats.uptimePercent > 99 ? "#22c55e" : "#f59e0b",
              }}
            >
              {stats.uptimePercent}%
            </span>
          </div>
        </StatCardShell>
      </div>

      {/* ============================================================ */}
      {/*  Two Columns: Alerts + Invoices                               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Security Alerts */}
        <SectionCard
          title="Recent Security Alerts"
          icon={<AlertTriangle className="h-4 w-4" />}
          iconColor="#f59e0b"
        >
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {stats.recentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Shield className="h-8 w-8 opacity-30" />
                <p className="text-xs">No recent alerts — everything looks good.</p>
              </div>
            ) : (
              stats.recentAlerts.slice(0, 5).map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))
            )}
          </div>
        </SectionCard>

        {/* Outstanding Invoices */}
        <SectionCard
          title="Outstanding Invoices"
          icon={<DollarSign className="h-4 w-4" />}
          iconColor="#14b8a6"
        >
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {stats.outstandingInvoicesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <DollarSign className="h-8 w-8 opacity-30" />
                <p className="text-xs">All invoices are paid — nice work!</p>
              </div>
            ) : (
              stats.outstandingInvoicesList.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* ============================================================ */}
      {/*  Revenue Overview — CSS Bar Chart                             */}
      {/* ============================================================ */}
      <SectionCard
        title="Revenue Overview"
        icon={<TrendingUp className="h-4 w-4" />}
        iconColor="#14b8a6"
        className="overflow-hidden"
      >
        {stats.monthlyRevenue.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            No revenue data available yet.
          </p>
        ) : (
          <RevenueBarChart data={stats.monthlyRevenue} />
        )}
      </SectionCard>
    </div>
  );
}