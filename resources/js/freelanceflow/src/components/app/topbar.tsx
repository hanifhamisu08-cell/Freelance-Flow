"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useApp } from "@/lib/store";
import { api, type Stats } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
} from "lucide-react";
import { BrandedLogo } from "@/components/app/branded-logo";

export function TopBar() {
  const { user, view, setView, bump, toast } = useApp();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadStats = async () => {
    try {
      setStats(await api.getStats());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 15000);
    return () => clearInterval(t);
  }, [useApp((s) => s.refreshTick)]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const r = await api.seed();
      toast(`Seeded ${r.seeded} demo clients with live tracker data.`);
      bump();
      loadStats();
    } catch (e) {
      toast((e as Error).message, "destructive");
    } finally {
      setSeeding(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    useApp.getState().setUser(null);
  };

  const navItems: { key: typeof view; label: string; icon: React.ReactNode; stage: 1 | 2 }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-3.5 w-3.5" />, stage: 1 },
    { key: "intelligence", label: "Intelligence", icon: <Sparkles className="h-3.5 w-3.5" />, stage: 2 },
    { key: "autopilot", label: "Autopilot", icon: <Bot className="h-3.5 w-3.5" />, stage: 2 },
    { key: "reports", label: "Reports", icon: <FileText className="h-3.5 w-3.5" />, stage: 2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-panel border-b border-hairline">
      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        <button
          onClick={() => setView("dashboard")}
          className="group flex items-center gap-2"
          aria-label="FreelanceFlow home"
        >
          <BrandedLogo variant="full" height={34} />
        </button>

        <nav className="ml-4 hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all",
                  active
                    ? "bg-panel-2 text-foreground shadow-[0_0_0_1px_var(--icon-glow-color),0_0_14px_-4px_var(--icon-glow-color)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-panel-2/60",
                )}
              >
                <span
                  className={cn(
                    "transition-colors icon-interactive icon-shimmer",
                    active
                      ? "text-teal"
                      : "text-muted-foreground group-hover:text-teal",
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.stage === 2 && (
                  <span
                    className="ml-0.5 h-1 w-1 rounded-full bg-amber telemetry-dot-amber"
                    title="Stage 2"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-muted-foreground transition-all hover:text-teal hover:shadow-[0_0_14px_-4px_var(--icon-glow-color)] icon-interactive icon-shimmer"
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mounted && theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="group hidden items-center gap-1.5 rounded-lg bg-panel-2 px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:text-foreground hover:shadow-[0_0_14px_-4px_var(--icon-glow-color)] sm:flex icon-interactive"
            title="Seed demo clients + tracker data"
          >
            <RefreshCw className={cn("h-3 w-3 transition-transform group-hover:rotate-180", seeding && "animate-spin")} />
            {seeding ? "Seeding…" : "Seed data"}
          </button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-panel-2 px-2 py-1">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-grad-teal-amber font-display text-[9px] font-bold text-[var(--background)]">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <div className="text-[10px] font-medium">{user.name}</div>
                  <div className="text-[8px] text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title="Log out and switch role"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Switch Role</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Telemetry strip */}
      <TelemetryStrip stats={stats} />
    </header>
  );
}

function TelemetryStrip({ stats }: { stats: Stats | null }) {
  const cells: { label: string; value: React.ReactNode; tone: "teal" | "amber" | "critical" | "muted"; dot?: boolean }[] = [
    {
      label: "Autopilot",
      value: stats?.autopilotEngaged ? "Engaged" : "Idle",
      tone: stats?.autopilotEngaged ? "teal" : "muted",
      dot: stats?.autopilotEngaged,
    },
    { label: "Hours saved", value: stats ? `${stats.hoursSaved}h` : "—", tone: "teal" },
    { label: "Auto-handled", value: stats?.autoHandled ?? 0, tone: "teal" },
    { label: "Awaiting", value: stats?.awaitingReview ?? 0, tone: (stats?.awaitingReview ?? 0) > 0 ? "amber" : "muted" },
    { label: "Insights", value: stats?.insightCount ?? 0, tone: "amber" },
    { label: "Reports", value: stats?.reportCount ?? 0, tone: "amber" },
    { label: "Events", value: stats?.eventCount ?? 0, tone: "muted" },
    { label: "Requests", value: stats?.pendingRequests ?? 0, tone: (stats?.pendingRequests ?? 0) > 0 ? "critical" : "muted" },
  ];
  return (
    <div className="flex items-center gap-0 overflow-x-auto border-t border-hairline bg-panel px-4 md:px-6">
      {cells.map((c) => (
        <div
          key={c.label}
          className="group flex items-center gap-1.5 px-3 py-1 transition-colors"
        >
          {c.dot && (
            <span className="h-1 w-1 rounded-full bg-teal telemetry-dot" />
          )}
          <span className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground/80">
            {c.label}
          </span>
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums transition-transform group-hover:scale-105",
              c.tone === "teal" && "text-teal",
              c.tone === "amber" && "text-amber",
              c.tone === "critical" && "text-critical",
              c.tone === "muted" && "text-foreground",
            )}
          >
            {c.value}
          </span>
        </div>
      ))}
      <div className="ml-auto hidden items-center gap-1 px-3 py-1 text-muted-foreground lg:flex">
        <Activity className="h-3 w-3 text-teal icon-interactive" />
        <span className="text-[8px] uppercase tracking-[0.16em]">
          Live · Qwen
        </span>
        <span className="relative ml-0.5 flex h-1 w-1">
          <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-60 animate-ping" />
          <span className="relative inline-flex h-1 w-1 rounded-full bg-teal" />
        </span>
      </div>
    </div>
  );
}