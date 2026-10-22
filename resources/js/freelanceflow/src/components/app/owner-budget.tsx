"use client";

import { useEffect, useState } from "react";
import { PieChart, AlertTriangle, CheckCircle } from "lucide-react";

type BudgetItem = {
  id: string;
  clientName: string;
  totalBudget: number;
  spent: number;
  currency: string;
  period: string;
  startDate: string;
  remaining: number;
  percentage: number;
};

export function OwnerBudget() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/owner/budget")
      .then((r) => r.json())
      .then((d) => setBudgets(d.budgets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-panel" />
        ))}
      </div>
    );
  }

  // Pie chart data
  const totalBudget = budgets.reduce((s, b) => s + b.totalBudget, 0);
  const segments = budgets.map((b) => ({
    name: b.clientName,
    pct: totalBudget > 0 ? (b.totalBudget / totalBudget) * 100 : 0,
    color: ["#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e"][budgets.indexOf(b) % 5],
  }));

  const conicStops = segments.reduce<{ stops: string[]; cumulativePct: number }>(
    (acc, s) => {
      const start = acc.cumulativePct;
      const end = start + s.pct;
      acc.stops.push(`${s.color} ${start}% ${end}%`);
      return { stops: acc.stops, cumulativePct: end };
    },
    { stops: [], cumulativePct: 0 },
  ).stops;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Budget Tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor spending against allocated budgets</p>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((b) => {
          const pct = Math.min(b.percentage, 100);
          const isWarning = b.percentage > 80 && b.percentage <= 100;
          const isOver = b.percentage > 100;
          const barColor = isOver ? "#ef4444" : isWarning ? "#f59e0b" : "#14b8a6";

          return (
            <div key={b.id} className="rounded-xl bg-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{b.clientName}</h3>
                <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {b.period}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Spent</span>
                  <span>{b.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-panel-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ fontFamily: "Poppins", color: "#f59e0b" }}>
                    {fmt(b.spent)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-teal">
                    {fmt(b.remaining > 0 ? b.remaining : 0)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {fmt(b.totalBudget)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</div>
                </div>
              </div>

              {isWarning && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Approaching budget limit
                </div>
              )}
              {isOver && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Over budget by {fmt(b.spent - b.totalBudget)}!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Budget Allocation Chart */}
      <div className="rounded-xl bg-panel p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-teal" />
          Budget Allocation
        </h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
          <div
            className="h-40 w-40 rounded-full shrink-0"
            style={{
              background: `conic-gradient(${conicStops.join(", ")})`,
            }}
          />
          <div className="space-y-2">
            {segments.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="font-medium">{s.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
