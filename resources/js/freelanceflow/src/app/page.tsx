"use client";

import { useEffect, useState } from "react";
import { toast as sonner } from "sonner";
import { useApp } from "@/lib/store";
import { api } from "@/lib/client";
import { TopBar } from "@/components/app/topbar";
import { AuthView } from "@/components/app/auth-view";
import { DashboardView } from "@/components/app/dashboard-view";
import { ClientView } from "@/components/app/client-view";
import { SettingsView } from "@/components/app/settings-view";
import { RequestsView } from "@/components/app/requests-view";
import { PublicView } from "@/components/app/public-view";
import { IntelligenceView } from "@/components/app/intelligence-view";
import { AutopilotView } from "@/components/app/autopilot-view";
import { ReportsView } from "@/components/app/reports-view";
import { OwnerOverview } from "@/components/app/owner-overview";
import { OwnerFinance } from "@/components/app/owner-finance";
import { OwnerInvoices } from "@/components/app/owner-invoices";
import { OwnerSecurity } from "@/components/app/owner-security";
import { OwnerBugs } from "@/components/app/owner-bugs";
import { OwnerUptime } from "@/components/app/owner-uptime";
import { OwnerBudget } from "@/components/app/owner-budget";
import { OwnerRequests } from "@/components/app/owner-requests";
import { OwnerTopBar } from "@/components/app/owner-topbar";
import { Download } from "lucide-react";
import { BrandedLogo } from "@/components/app/branded-logo";

export default function Home() {
  const { user, setUser, view, setToastFn } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToastFn((msg, variant) => {
      if (variant === "destructive") sonner.error(msg);
      else sonner.success(msg);
    });
  }, [setToastFn]);

  useEffect(() => {
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser]);

  if (loading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 bg-radial-teal" />
        <div className="relative flex flex-col items-center gap-3 anim-fade">
          <BrandedLogo variant="icon-pulse" size={40} />
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            FreelanceFlow
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AuthView />
        <Footer />
      </div>
    );
  }

  const isOwner = user.role === "owner";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isOwner ? <OwnerTopBar /> : <TopBar />}
      <main className="flex-1 px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto w-full max-w-7xl">
          {isOwner ? (
            <>
              {view === "owner" && <OwnerOverview />}
              {view === "owner-finance" && <OwnerFinance />}
              {view === "owner-invoices" && <OwnerInvoices />}
              {view === "owner-budget" && <OwnerBudget />}
              {view === "owner-security" && <OwnerSecurity />}
              {view === "owner-bugs" && <OwnerBugs />}
              {view === "owner-uptime" && <OwnerUptime />}
              {view === "owner-requests" && <OwnerRequests />}
            </>
          ) : (
            <>
              {view === "dashboard" && <DashboardView />}
              {view === "client" && <ClientView />}
              {view === "client-settings" && <SettingsView />}
              {view === "client-requests" && <RequestsView />}
              {view === "client-public" && <PublicView />}
              {view === "intelligence" && <IntelligenceView />}
              {view === "autopilot" && <AutopilotView />}
              {view === "reports" && <ReportsView />}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline bg-panel">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-4 py-3 text-[10px] text-muted-foreground md:flex-row md:items-center md:px-6">
        <div className="flex items-center gap-2">
          <BrandedLogo variant="icon" size={16} />
          <span className="uppercase tracking-[0.16em]">
            FreelanceFlow
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.14em]">
          <span>Stage 1 · Live dashboards</span>
          <span className="text-amber">Stage 2 · Qwen autopilot</span>
          <a
            href="/api/download"
            className="group inline-flex items-center gap-1 rounded-full bg-panel-2 px-2 py-0.5 text-foreground transition-all hover:text-teal hover:shadow-[0_0_14px_-4px_var(--icon-glow-color)] icon-interactive"
            title="Download the full project source as a .zip"
          >
            <Download className="h-2.5 w-2.5 transition-transform group-hover:-translate-y-0.5" /> Download source
          </a>
        </div>
      </div>
    </footer>
  );
}