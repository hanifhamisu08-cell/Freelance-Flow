"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ArrowDownRight,
  Clock,
  Gauge,
  Server,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */

interface HourlyStatus {
  day: number;
  hour: number;
  status: "up" | "degraded" | "down";
}

interface UptimeClient {
  clientId: string;
  clientName: string;
  uptimePercent: number;
  avgResponseMs: number;
  lastIncident: string | null;
  hourly: HourlyStatus[];
}

interface UptimeData {
  clients: UptimeClient[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i % 3 === 0 ? `${i}` : ""
);

/* ---------- helpers ---------- */

function uptimeColor(pct: number) {
  if (pct >= 99) return "text-green-500";
  if (pct >= 95) return "text-amber-500";
  return "text-red-500";
}

function uptimeBgColor(pct: number) {
  if (pct >= 99) return "bg-green-500/10";
  if (pct >= 95) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function statusCellColor(status: string): string {
  switch (status) {
    case "up":
      return "#22c55e";
    case "degraded":
      return "#f59e0b";
    case "down":
      return "#ef4444";
    default:
      return "#22c55e";
  }
}

/* ---------- hourly grid ---------- */

function HourlyGrid({ hourly }: { hourly: HourlyStatus[] }) {
  // Build a 7x24 lookup
  const grid = new Map<string, HourlyStatus>();
  for (const h of hourly) {
    grid.set(`${h.day}-${h.hour}`, h);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Hour labels */}
        <div className="mb-1 flex gap-0.5 pl-10">
          {HOUR_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[9px] text-muted-foreground/70"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAY_LABELS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-0.5">
            <div className="w-10 shrink-0 text-right text-[10px] font-medium text-muted-foreground pr-2">
              {day}
            </div>
            {Array.from({ length: 24 }, (_, hourIdx) => {
              const cell = grid.get(`${dayIdx}-${hourIdx}`);
              const bg = cell ? statusCellColor(cell.status) : "#22c55e";
              return (
                <div
                  key={hourIdx}
                  className="flex-1 rounded-[2px] transition-colors"
                  style={{
                    backgroundColor: bg,
                    opacity: 0.75,
                    height: "14px",
                  }}
                  title={`${day} ${hourIdx}:00 — ${cell?.status ?? "up"}`}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-2 flex items-center gap-4 pl-10 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ backgroundColor: "#22c55e", opacity: 0.75 }}
            />
            Up
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ backgroundColor: "#f59e0b", opacity: 0.75 }}
            />
            Degraded
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-2.5 rounded-[2px]"
              style={{ backgroundColor: "#ef4444", opacity: 0.75 }}
            />
            Down
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- client section ---------- */

function ClientSection({ client }: { client: UptimeClient }) {
  return (
    <Card className="p-0">
      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 border-b border-border/60 p-4 sm:grid-cols-3 sm:px-6">
        {/* Uptime % */}
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", uptimeBgColor(client.uptimePercent))}>
            <Server className={cn("size-5", uptimeColor(client.uptimePercent))} />
          </div>
          <div>
            <p className={cn("text-2xl font-bold leading-none tabular-nums", uptimeColor(client.uptimePercent))}>
              {client.uptimePercent.toFixed(2)}%
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>

        {/* Avg response time */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
            <Gauge className="size-5 text-teal-500" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none tabular-nums">
              {client.avgResponseMs}
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">ms</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Avg Response</p>
          </div>
        </div>

        {/* Last incident */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <ArrowDownRight className="size-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            {client.lastIncident ? (
              <>
                <p className="truncate text-sm font-medium leading-tight">
                  {client.lastIncident}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Last Incident</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium leading-tight text-green-600">
                  No incidents
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">All clear</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hourly grid */}
      <div className="p-4 sm:px-6 sm:py-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{client.clientName}</h3>
          <Badge
            variant="outline"
            className={cn(
              "ml-auto text-[10px]",
              client.uptimePercent >= 99
                ? "border-green-500/25 text-green-600"
                : client.uptimePercent >= 95
                  ? "border-amber-500/25 text-amber-600"
                  : "border-red-500/25 text-red-600"
            )}
          >
            7-day overview
          </Badge>
        </div>
        <HourlyGrid hourly={client.hourly} />
      </div>
    </Card>
  );
}

/* ---------- loading skeleton ---------- */

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-0">
          <div className="grid grid-cols-1 gap-4 border-b border-border/60 p-4 sm:grid-cols-3 sm:px-6">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- main component ---------- */

export function OwnerUptime() {
  const [data, setData] = useState<UptimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/owner/uptime")
      .then((r) => r.json())
      .then((json: UptimeData) => {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <Activity className="mb-1 mr-2 inline-block size-6 text-teal-500" />
          Uptime Monitoring
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-time availability and response time tracking for all clients.
        </p>
      </div>

      {/* Client sections */}
      {data && data.clients.length > 0 ? (
        <div className="flex flex-col gap-6">
          {data.clients.map((client) => (
            <ClientSection key={client.clientId} client={client} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-2 py-16">
          <Activity className="size-10 text-teal-500/40" />
          <p className="text-sm text-muted-foreground">No uptime data available.</p>
        </Card>
      )}
    </div>
  );
}