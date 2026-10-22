"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bug,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */

interface BugEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  clientName: string;
  detectedAt: string;
}

interface BugData {
  scores: { clientId: string; clientName: string; grade: string; score: number; color: string }[];
  events: BugEvent[];
}

/* ---------- helpers ---------- */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function severityColor(s: string) {
  switch (s) {
    case "critical":
      return "bg-red-500/15 text-red-600 border-red-500/25";
    case "high":
      return "bg-orange-500/15 text-orange-600 border-orange-500/25";
    case "medium":
      return "bg-amber-500/15 text-amber-600 border-amber-500/25";
    default:
      return "bg-gray-500/15 text-gray-500 border-gray-500/25";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "open":
      return <CircleDot className="size-4 text-red-500" />;
    case "investigating":
      return <Loader2 className="size-4 text-amber-500 animate-spin" />;
    case "fixed":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "verified":
      return <CheckCircle2 className="size-4 text-teal-500" />;
    default:
      return <CircleDot className="size-4 text-gray-400" />;
  }
}

/* ---------- stat card ---------- */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", bgColor)}>
          <Icon className={cn("size-5", color)} />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------- bug row ---------- */

function BugRow({ bug }: { bug: BugEvent }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-panel p-3 transition-colors hover:bg-panel/80">
      <div className="mt-0.5 shrink-0">{statusIcon(bug.status)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium leading-tight">{bug.title}</p>
          <Badge variant="outline" className={cn("text-[10px] capitalize", severityColor(bug.severity))}>
            {bug.severity}
          </Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {bug.description}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/70">{bug.clientName}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {relativeTime(bug.detectedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- bug section ---------- */

function BugSection({
  title,
  icon: Icon,
  iconColor,
  bugs,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bugs: BugEvent[];
}) {
  if (bugs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", iconColor)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary" className="h-5 text-[10px] tabular-nums">
          {bugs.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        {bugs.map((bug) => (
          <BugRow key={bug.id} bug={bug} />
        ))}
      </div>
    </div>
  );
}

/* ---------- loading skeleton ---------- */

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- main component ---------- */

export function OwnerBugs() {
  const [data, setData] = useState<BugData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/owner/security?type=bug")
      .then((r) => r.json())
      .then((json: BugData) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState />;

  const bugs = data?.events ?? [];

  const openBugs = bugs.filter((b) => b.status === "open");
  const investigatingBugs = bugs.filter((b) => b.status === "investigating");
  const fixedBugs = bugs.filter((b) => b.status === "fixed" || b.status === "verified");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <Bug className="mb-1 mr-2 inline-block size-6 text-teal-500" />
          Bug Tracker
        </h2>
        <p className="text-sm text-muted-foreground">
          Track and manage bugs reported across all client projects.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={AlertCircle}
          label="Open Bugs"
          value={openBugs.length}
          color="text-red-500"
          bgColor="bg-red-500/10"
        />
        <StatCard
          icon={Search}
          label="Investigating"
          value={investigatingBugs.length}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={CheckCircle2}
          label="Fixed This Month"
          value={fixedBugs.length}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
      </div>

      {/* Bug list grouped by status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Bugs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {bugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Bug className="size-10 text-teal-500/40" />
              <p className="text-sm">No bugs have been reported.</p>
            </div>
          ) : (
            <>
              <BugSection
                title="Open"
                icon={AlertCircle}
                iconColor="text-red-500"
                bugs={openBugs}
              />
              <BugSection
                title="In Progress"
                icon={Search}
                iconColor="text-amber-500"
                bugs={investigatingBugs}
              />
              <BugSection
                title="Resolved"
                icon={CheckCircle2}
                iconColor="text-green-500"
                bugs={fixedBugs}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}