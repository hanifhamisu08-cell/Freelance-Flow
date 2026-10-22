"use client";

import { useEffect, useState } from "react";
import { api, type AutopilotAction } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, StatCard, Badge, EmptyState, Spinner } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Bot, Check, FileText, Mail, RefreshCw, Send, ThumbsDown, AlertTriangle, CalendarClock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandedLogo } from "@/components/app/branded-logo";

const TYPE_ICON: Record<string, React.ReactNode> = {
  draft_report: <FileText className="h-3.5 w-3.5" />,
  send_request: <Mail className="h-3.5 w-3.5" />,
  flag_anomaly: <AlertTriangle className="h-3.5 w-3.5" />,
  schedule_nudge: <CalendarClock className="h-3.5 w-3.5" />,
};

export function AutopilotView() {
  const { bump, toast, refreshTick } = useApp();
  const [actions, setActions] = useState<AutopilotAction[] | null>(null);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "auto_done" | "sent">("all");

  useEffect(() => {
    let cancelled = false;
    api.listAutopilot().then((r) => { if (!cancelled) setActions(r.actions); }).catch((e) => toast((e as Error).message, "destructive"));
    return () => { cancelled = true; };
  }, [refreshTick, toast]);

  const runSweep = async () => {
    setRunning(true);
    try {
      const r = await api.runAutopilot();
      if (r.degraded) toast("Some calls paused — retrying.", "destructive");
      else toast(`Autopilot proposed ${r.created.length} action(s).`);
      bump();
    } catch (e) { toast((e as Error).message, "destructive"); } finally { setRunning(false); }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await api.updateAction(id, status);
      bump();
      toast(status === "approved" ? "Approved." : status === "sent" ? "Sent." : "Rejected.");
    } catch (e) { toast((e as Error).message, "destructive"); }
  };

  const filtered = actions?.filter((a) => (filter === "all" ? true : a.status === filter)) ?? [];
  const pending = actions?.filter((a) => a.status === "pending").length ?? 0;
  const autoDone = actions?.filter((a) => a.status === "auto_done").length ?? 0;
  const sent = actions?.filter((a) => a.status === "sent").length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between anim-rise">
        <div>
          <SectionLabel accent>Stage 2 · Qwen autopilot</SectionLabel>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Autopilot <span className="text-grad-teal-amber">queue</span>
          </h1>
          <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">Qwen proposes actions from telemetry.</p>
        </div>
        <Button onClick={runSweep} disabled={running} className="h-8 bg-amber text-[var(--background)] hover:bg-amber/90 shine text-xs">
          {running ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />} Run sweep
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
        <StatCard label="Awaiting review" value={pending} icon={<Bot className="h-3.5 w-3.5" />} accent={pending > 0 ? "amber" : "default"} />
        <StatCard label="Auto-handled" value={autoDone} icon={<Check className="h-3.5 w-3.5" />} accent="teal" />
        <StatCard label="Sent" value={sent} icon={<Send className="h-3.5 w-3.5" />} accent="teal" />
        <StatCard label="Total" value={actions?.length ?? 0} icon={<FileText className="h-3.5 w-3.5" />} />
      </div>

      <div className="flex items-center gap-0.5 rounded-lg bg-panel p-0.5 w-fit">
        {(["all", "pending", "auto_done", "sent"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-2.5 py-1 text-[9px] uppercase tracking-wider transition-all", filter === f ? "bg-background text-amber shadow-[0_0_0_1px_rgba(242,169,59,0.3),0_0_14px_-4px_rgba(242,169,59,0.5)]" : "text-muted-foreground hover:text-foreground")}>
            {f === "auto_done" ? "auto-handled" : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Bot className="h-6 w-6 text-amber" />} title="Queue is empty" body="Run the autopilot sweep to generate actions." logo={<BrandedLogo variant="icon" size={32} className="mb-3 opacity-30" />} />
      ) : (
        <div className="flex flex-col gap-2 stagger">
          {filtered.map((a) => (
            <Panel key={a.id} hover className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-2.5">
                <span className={cn("relative grid h-9 w-9 shrink-0 place-items-center rounded-lg icon-interactive icon-shimmer icon-pulse", a.autoMode ? "bg-teal/10 text-teal" : "bg-amber/10 text-amber")}>
                  {TYPE_ICON[a.type] ?? <Bot className="h-3.5 w-3.5" />}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <Badge tone={a.autoMode ? "teal" : "amber"}>{a.autoMode ? "auto" : "needs approval"}</Badge>
                    <Badge tone="muted">{a.type.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-0.5 max-w-2xl text-[11px] text-muted-foreground">{a.detail}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span>{a.clientName ?? "client"}</span><span>·</span>
                    <span>{new Date(a.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {a.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "rejected")} className="h-7 border-hairline bg-panel px-2 text-[10px] hover:border-critical/40 hover:text-critical icon-interactive">
                      <ThumbsDown className="h-3 w-3" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => setStatus(a.id, "approved")} className="h-7 bg-teal px-2.5 text-[10px] text-[var(--background)] hover:bg-teal/90 shine">
                      <Check className="h-3 w-3" /> Approve
                    </Button>
                  </>
                )}
                {a.status === "approved" && (
                  <Button size="sm" onClick={() => setStatus(a.id, "sent")} className="h-7 bg-amber px-2.5 text-[10px] text-[var(--background)] hover:bg-amber/90 shine">
                    <Send className="h-3 w-3" /> Approve &amp; send
                  </Button>
                )}
                {a.status === "auto_done" && <Badge tone="teal"><Zap className="h-2 w-2" /> auto</Badge>}
                {a.status === "sent" && <Badge tone="teal">sent</Badge>}
                {a.status === "rejected" && <Badge tone="muted">rejected</Badge>}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}