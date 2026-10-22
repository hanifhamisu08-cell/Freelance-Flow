"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Filter,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */

interface SecurityScore {
  clientId: string;
  clientName: string;
  grade: string;
  score: number;
  color: string;
}

interface SecurityEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  clientName: string;
  detectedAt: string;
}

interface SecurityData {
  scores: SecurityScore[];
  events: SecurityEvent[];
}

type FilterKey = "all" | "open" | "fixed" | "critical";

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

function statusColor(s: string) {
  switch (s) {
    case "open":
      return "bg-red-500/15 text-red-600 border-red-500/25";
    case "investigating":
      return "bg-amber-500/15 text-amber-600 border-amber-500/25";
    case "fixed":
      return "bg-green-500/15 text-green-600 border-green-500/25";
    case "verified":
      return "bg-teal-500/15 text-teal-600 border-teal-500/25";
    default:
      return "bg-gray-500/15 text-gray-500 border-gray-500/25";
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "vulnerability":
      return <ShieldAlert className="size-3.5" />;
    case "attack":
      return <ShieldX className="size-3.5" />;
    case "ssl_expiry":
      return <ShieldAlert className="size-3.5" />;
    case "rate_limit":
      return <AlertTriangle className="size-3.5" />;
    case "malware_scan":
      return <ShieldX className="size-3.5" />;
    case "uptime_change":
      return <Clock className="size-3.5" />;
    default:
      return <ShieldCheck className="size-3.5" />;
  }
}

/* ---------- score ring ---------- */

function ScoreRing({ score, grade, color, name }: SecurityScore) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col items-center gap-3 p-5">
      <div className="relative flex size-24 items-center justify-center sm:size-28">
        <svg
          className="size-full -rotate-90"
          viewBox="0 0 100 100"
          aria-label={`${name} security score ${score}%`}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            className="text-muted/40"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold leading-none sm:text-3xl"
            style={{ color }}
          >
            {grade}
          </span>
          <span className="text-[11px] text-muted-foreground">{score}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground">{name}</p>
    </Card>
  );
}

/* ---------- event row ---------- */

function EventRow({ event }: { event: SecurityEvent }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-panel p-3 transition-colors hover:bg-panel/80 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className={cn("text-[10px] capitalize", severityColor(event.severity))}>
          {event.severity}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 text-[10px] capitalize text-muted-foreground">
          {typeIcon(event.type)}
          {event.type.replace(/_/g, " ")}
        </Badge>
        <Badge variant="outline" className={cn("text-[10px] capitalize", statusColor(event.status))}>
          {event.status}
        </Badge>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium leading-tight">{event.title}</p>
        <p className="truncate text-xs text-muted-foreground">{event.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">{event.clientName}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {relativeTime(event.detectedAt)}
        </span>
      </div>
    </div>
  );
}

/* ---------- loading skeleton ---------- */

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex items-center justify-center p-6">
            <Skeleton className="size-24 rounded-full sm:size-28" />
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- main component ---------- */

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "fixed", label: "Fixed" },
  { key: "critical", label: "Critical Only" },
];

export function OwnerSecurity() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/owner/security")
      .then((r) => r.json())
      .then((json: SecurityData) => {
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

  const filteredEvents = data?.events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "open") return e.status === "open" || e.status === "investigating";
    if (filter === "fixed") return e.status === "fixed" || e.status === "verified";
    if (filter === "critical") return e.severity === "critical";
    return true;
  });

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <Shield className="mb-1 mr-2 inline-block size-6 text-teal-500" />
          Security Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitor security scores and events across all clients.
        </p>
      </div>

      {/* Score rings */}
      {data && data.scores.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.scores.map((s) => (
            <ScoreRing key={s.clientId} {...s} />
          ))}
        </div>
      )}

      {/* Event log */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4 text-muted-foreground" />
            Security Event Log
            {filteredEvents && (
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredEvents.length})
              </span>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  filter === f.key && "bg-teal-600 text-white hover:bg-teal-700"
                )}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents && filteredEvents.length > 0 ? (
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
              {filteredEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <ShieldCheck className="size-10 text-teal-500/40" />
              <p className="text-sm">No events match this filter.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}