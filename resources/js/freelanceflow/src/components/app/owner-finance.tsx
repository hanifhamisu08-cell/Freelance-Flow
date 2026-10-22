"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CalendarDays,
  Wallet,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FinanceRecord {
  id: string;
  type: "revenue" | "expense";
  category: string;
  amount: number;
  description: string;
  recordDate: string;
  currency: string;
  clientName: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface FinanceData {
  totalRevenue: number;
  totalExpenses: number;
  records: FinanceRecord[];
  monthly: MonthlyData[];
}

type FilterType = "all" | "revenue" | "expense";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TEAL = "#14b8a6";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#22c55e";

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OwnerFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/owner/finance")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load finance data");
        return r.json();
      })
      .then((d: FinanceData) => {
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

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.records.slice(0, 15);
    return data.records.filter((r) => r.type === filter).slice(0, 15);
  }, [data, filter]);

  const netProfit = data
    ? data.totalRevenue - data.totalExpenses
    : 0;

  const maxMonthly = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      ...data.monthly.map((m) => Math.max(m.revenue, m.expenses)),
      1
    );
  }, [data]);

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Revenue", value: "revenue" },
    { label: "Expenses", value: "expense" },
  ];

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border-0 bg-panel rounded-xl"
            >
              <CardContent className="p-5 flex flex-col gap-3">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Chart skeleton */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-48 mb-6 rounded-md" />
            <div className="flex items-end gap-3 h-48">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex items-end gap-1.5">
                  <Skeleton className="w-full rounded-t-md" style={{ height: "60%" }} />
                  <Skeleton className="w-full rounded-t-md" style={{ height: "40%" }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Table skeleton */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-40 mb-4 rounded-md" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
          <p className="text-sm">Unable to load finance data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="flex flex-col gap-6">
      {/* ===== 1. Summary Cards ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Revenue */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Revenue
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${GREEN}15`, color: GREEN }}
              >
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: GREEN }}>
              {formatCurrency(data.totalRevenue)}
            </p>
            <p className="text-[11px] text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Expenses
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${AMBER}15`, color: AMBER }}
              >
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: AMBER }}>
              {formatCurrency(data.totalExpenses)}
            </p>
            <p className="text-[11px] text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-0 bg-panel rounded-xl">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Net Profit
              </span>
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: `${TEAL}15`, color: TEAL }}
              >
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: TEAL }}>
              {formatCurrency(netProfit)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Revenue minus expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== 2. Filter Buttons ===== */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterButtons.map((fb) => (
          <Button
            key={fb.value}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(fb.value)}
            className={cn(
              "rounded-lg text-xs font-medium h-8 px-3 transition-colors",
              filter === fb.value
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={
              filter === fb.value
                ? { backgroundColor: TEAL }
                : undefined
            }
          >
            {fb.label}
          </Button>
        ))}
      </div>

      {/* ===== 3. Revenue vs Expenses Bar Chart ===== */}
      <Card className="border-0 bg-panel rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Revenue vs Expenses</h2>
            <span className="text-[11px] text-muted-foreground ml-auto">
              Last 6 months
            </span>
          </div>

          {/* Chart bars */}
          <div className="flex items-end gap-2 sm:gap-4" style={{ height: 200 }}>
            {data.monthly.map((m) => {
              const revH = Math.max((m.revenue / maxMonthly) * 100, 2);
              const expH = Math.max((m.expenses / maxMonthly) * 100, 2);
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  {/* Bar group */}
                  <div className="flex items-end gap-1 w-full" style={{ height: 180 }}>
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <span
                        className="text-[9px] font-mono tabular-nums mb-1 opacity-70"
                        style={{ color: TEAL }}
                      >
                        {m.revenue >= 1000
                          ? `${(m.revenue / 1000).toFixed(0)}k`
                          : m.revenue}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${revH}%`,
                          backgroundColor: TEAL,
                          minHeight: 4,
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <span
                        className="text-[9px] font-mono tabular-nums mb-1 opacity-70"
                        style={{ color: AMBER }}
                      >
                        {m.expenses >= 1000
                          ? `${(m.expenses / 1000).toFixed(0)}k`
                          : m.expenses}
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${expH}%`,
                          backgroundColor: AMBER,
                          minHeight: 4,
                        }}
                      />
                    </div>
                  </div>
                  {/* Month label */}
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: "1px solid var(--hairline, #262b30)" }}>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: TEAL }}
              />
              <span className="text-[11px] text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: AMBER }}
              />
              <span className="text-[11px] text-muted-foreground">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 4. Recent Transactions ===== */}
      <Card className="border-0 bg-panel rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Transactions</h2>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No transactions found for this filter.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto scroll-thin">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto_1fr_auto] sm:grid-cols-[120px_auto_100px_1fr_110px_100px] gap-2 sm:gap-3 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Date</span>
                <span className="hidden sm:block">Type</span>
                <span>Category</span>
                <span className="hidden sm:block">Description</span>
                <span className="text-right">Amount</span>
                <span className="hidden sm:block text-right">Client</span>
              </div>

              {filtered.map((rec) => {
                const isRevenue = rec.type === "revenue";
                return (
                  <div
                    key={rec.id}
                    className="grid grid-cols-[1fr_auto_auto_1fr_auto] sm:grid-cols-[120px_auto_100px_1fr_110px_100px] gap-2 sm:gap-3 items-center px-3 py-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    {/* Date */}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(rec.recordDate)}
                    </span>

                    {/* Type badge */}
                    <span className="hidden sm:block">
                      <Badge
                        className={cn(
                          "text-[10px] font-medium rounded-md border-0 px-2 py-0.5",
                          isRevenue
                            ? "text-white"
                            : "text-white"
                        )}
                        style={{
                          backgroundColor: isRevenue ? GREEN : RED,
                        }}
                      >
                        {isRevenue ? "Revenue" : "Expense"}
                      </Badge>
                    </span>

                    {/* Category */}
                    <span className="text-xs font-medium truncate">
                      {rec.category}
                    </span>

                    {/* Description */}
                    <span className="hidden sm:block text-xs text-muted-foreground truncate">
                      {rec.description}
                    </span>

                    {/* Amount */}
                    <span
                      className="text-xs font-semibold tabular-nums text-right"
                      style={{ color: isRevenue ? GREEN : RED }}
                    >
                      {isRevenue ? "+" : "-"}
                      {formatCurrency(rec.amount)}
                    </span>

                    {/* Client */}
                    <span className="hidden sm:block text-xs text-muted-foreground text-right truncate">
                      {rec.clientName || "—"}
                    </span>
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