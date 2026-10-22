"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Clock,
  Send,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

interface InvoiceData {
  totalInvoiced: number;
  paid: number;
  outstanding: number;
  invoices: Invoice[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TEAL = "#14b8a6";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#22c55e";
const GRAY = "#6b7280";
const BLUE = "#3b82f6";

const STATUS_ORDER: Record<Invoice["status"], number> = {
  overdue: 0,
  sent: 1,
  draft: 2,
  paid: 3,
};

const STATUS_CONFIG: Record<
  Invoice["status"],
  { color: string; icon: typeof Clock; label: string }
> = {
  overdue: { color: RED, icon: AlertTriangle, label: "Overdue" },
  sent: { color: BLUE, icon: Send, label: "Sent" },
  draft: { color: GRAY, icon: FileEdit, label: "Draft" },
  paid: { color: GREEN, icon: CheckCircle2, label: "Paid" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntilDue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OwnerInvoices() {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/owner/invoices")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load invoices");
        return r.json();
      })
      .then((d: InvoiceData) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.invoices].sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    );
  }, [data]);

  const outstandingHasValue = data ? data.outstanding > 0 : false;

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border-0 bg-panel rounded-xl"
            >
              <CardContent className="p-5 flex flex-col gap-3">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-44 mb-5 rounded-md" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 bg-panel rounded-xl">
        <CardContent className="p-10 text-center text-muted-foreground">
          <p className="text-sm">Unable to load invoices. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="flex flex-col gap-6">
      {/* ===== 1. Summary Cards ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Invoiced */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Invoiced
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${TEAL}15`, color: TEAL }}
              >
                <FileText className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: TEAL }}>
              {formatCurrency(data.totalInvoiced)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {data.invoices.length} invoice{data.invoices.length !== 1 ? "s" : ""} total
            </p>
          </CardContent>
        </Card>

        {/* Paid */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Paid
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${GREEN}15`, color: GREEN }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: GREEN }}>
              {formatCurrency(data.paid)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {data.totalInvoiced > 0
                ? `${Math.round((data.paid / data.totalInvoiced) * 100)}% collected`
                : "No invoices yet"}
            </p>
          </CardContent>
        </Card>

        {/* Outstanding */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Outstanding
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{
                  backgroundColor: outstandingHasValue
                    ? `${outstandingHasValue ? RED : AMBER}15`
                    : `${GREEN}15`,
                  color: outstandingHasValue ? (outstandingHasValue ? RED : AMBER) : GREEN,
                }}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <p
              className="text-2xl font-semibold tabular-nums"
              style={{
                color: outstandingHasValue ? (outstandingHasValue ? RED : AMBER) : GREEN,
              }}
            >
              {formatCurrency(data.outstanding)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {outstandingHasValue
                ? "Requires follow-up"
                : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== 2. Invoice List ===== */}
      <Card className="border-0 bg-panel rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">All Invoices</h2>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {sorted.length} invoice{sorted.length !== 1 ? "s" : ""}
            </span>
          </div>

          {sorted.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No invoices found.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[560px] overflow-y-auto scroll-thin">
              {sorted.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status];
                const StatusIcon = cfg.icon;
                const days = daysUntilDue(inv.dueDate);
                const isOverdue = inv.status === "overdue";

                return (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-2.5 rounded-lg bg-background/50 p-4 hover:bg-background/80 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    {/* Left: client + due info */}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {inv.clientName}
                        </span>
                        <Badge
                          className="text-[10px] font-medium rounded-md border-0 px-2 py-0.5 shrink-0"
                          style={{
                            backgroundColor: `${cfg.color}18`,
                            color: cfg.color,
                          }}
                        >
                          <StatusIcon className="h-3 w-3 mr-0.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {formatDate(inv.dueDate)}
                        </span>
                        {isOverdue && days < 0 && (
                          <span
                            className="font-medium"
                            style={{ color: RED }}
                          >
                            {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} overdue
                          </span>
                        )}
                        {!isOverdue && inv.status === "sent" && days >= 0 && days <= 7 && (
                          <span
                            className="font-medium"
                            style={{ color: AMBER }}
                          >
                            Due in {days} day{days !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: amount + view button */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <span className="text-base font-semibold tabular-nums">
                        {formatCurrency(inv.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}