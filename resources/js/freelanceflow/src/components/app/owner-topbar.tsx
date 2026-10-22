"use client";

import { useApp, type View } from "@/lib/store";
import { api } from "@/lib/client";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  PieChart,
  Shield,
  Bug,
  Activity,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { BrandedLogo } from "@/components/app/branded-logo";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type OwnerView = Extract<
  View,
  | "owner"
  | "owner-finance"
  | "owner-invoices"
  | "owner-budget"
  | "owner-security"
  | "owner-bugs"
  | "owner-uptime"
  | "owner-requests"
>;

const NAV: { view: OwnerView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: "owner", label: "Overview", icon: LayoutDashboard },
  { view: "owner-finance", label: "Finance", icon: DollarSign },
  { view: "owner-invoices", label: "Invoices", icon: FileText },
  { view: "owner-budget", label: "Budget", icon: PieChart },
  { view: "owner-security", label: "Security", icon: Shield },
  { view: "owner-bugs", label: "Bugs", icon: Bug },
  { view: "owner-uptime", label: "Uptime", icon: Activity },
  { view: "owner-requests", label: "Requests", icon: MessageSquare },
];

export function OwnerTopBar() {
  const { user, view, setView, toast } = useApp();
  const { theme, setTheme } = useTheme();
  const [score, setScore] = useState<{ grade: string; color: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/owner/stats")
      .then((r) => r.json())
      .then((d) => setScore(d.securityScore ?? null))
      .catch(() => {});
  }, []);

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      const result = await api.logout();
      const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
      if (csrfMeta) csrfMeta.content = result.csrfToken;
      useApp.getState().setUser(null);
      setMenuOpen(false);
    } catch (err) {
      toast((err as Error).message, "destructive");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-panel">
      {/* Main bar */}
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BrandedLogo variant="full" height={28} />
          {score && (
            <span
              className="ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: score.color + "22", color: score.color }}
            >
              {score.grade}
            </span>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 rounded-full bg-panel-2 p-0.5">
          {NAV.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? "bg-teal text-black shadow-[0_0_12px_-3px_var(--icon-glow-color)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-7 w-7 place-items-center rounded-lg bg-panel-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-panel-2 px-2.5 py-1">
            <div className="flex h-5 w-5 place-items-center rounded-full bg-teal/15 text-[9px] font-bold text-teal">
              {initials}
            </div>
            <span className="text-[11px] font-medium">{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
            title="Log out and switch role"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden grid h-7 w-7 place-items-center rounded-lg bg-panel-2 text-muted-foreground"
          >
            <span className="text-sm">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-hairline bg-panel px-4 py-3 space-y-1">
          {NAV.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  setMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-teal/10 text-teal" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Switch Role
          </button>
        </nav>
      )}
    </header>
  );
}
