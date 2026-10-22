"use client";

import { useEffect, useState } from "react";
import { api, type Metrics } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, Badge, Spinner } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Activity, Globe, Printer, Send, ShieldCheck } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type PublicData = {
  client: { name: string; projectTitle: string | null; projectSummary: string | null };
  privacy: Record<string, boolean>;
  metrics: Metrics;
  topPages: { path: string; count: number }[];
};

export function PublicView() {
  const { selectedSlug, setView, toast } = useApp();
  const [data, setData] = useState<PublicData | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    api.getPublic(selectedSlug).then((d) => { if (!cancelled) setData(d); }).catch((e) => toast((e as Error).message, "destructive"));
    return () => { cancelled = true; };
  }, [selectedSlug, toast]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug || !message.trim()) return;
    setBusy(true);
    try { await api.submitPublicRequest(selectedSlug, message); setMessage(""); toast("Thanks — request sent."); } catch (err) { toast((err as Error).message, "destructive"); } finally { setBusy(false); }
  };

  if (!data) {
    return <Panel className="flex items-center gap-2 py-8 text-muted-foreground"><Spinner /> Loading…</Panel>;
  }

  const { client, privacy, metrics, topPages } = data;
  const chartData = metrics.hourly.map((h) => ({ ts: new Date(h.ts).toLocaleTimeString([], { hour: "2-digit" }), count: h.count }));

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print anim-rise">
        <button onClick={() => setView("client")} className="group flex w-fit items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /> Back
        </button>
        <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{client.name}</h1>
              <Badge tone="teal">client view</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">What your client sees.</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="border-hairline bg-panel btn-ghost-glow h-8 text-xs icon-interactive">
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </Button>
        </div>
      </div>

      <Panel glow="teal" className="print-card anim-rise">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-teal icon-interactive" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Live dashboard · privacy-controlled</span>
        </div>

        {privacy.project_title !== false && client.projectTitle && (
          <h2 className="mt-1.5 font-display text-xl font-semibold">{client.projectTitle}</h2>
        )}
        {privacy.project_summary !== false && client.projectSummary && (
          <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">{client.projectSummary}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {privacy.event_count !== false && (
            <div className="group relative overflow-hidden rounded-lg bg-background/60 p-2.5 transition-all hover:bg-panel-2">
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Total views</div>
              <div className="font-display text-xl font-semibold text-teal tabular-nums">{metrics.total.toLocaleString()}</div>
            </div>
          )}
          {privacy.last_seen !== false && metrics.lastEvent && (
            <div className="rounded-lg bg-background/60 p-2.5">
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Last activity</div>
              <div className="font-display text-sm font-semibold">{new Date(metrics.lastEvent).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          )}
          <div className="rounded-lg bg-background/60 p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Last 24h</div>
            <div className="font-display text-xl font-semibold tabular-nums">{metrics.last24h}</div>
          </div>
        </div>

        {privacy.activity_chart !== false && metrics.total > 0 && (
          <div className="mt-4">
            <SectionLabel>Activity · 24h</SectionLabel>
            <div className="mt-1.5 h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="pubev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--teal)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ts" tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={{ stroke: "var(--hairline)" }} interval={3} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--teal)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11, boxShadow: "0 6px 20px -6px var(--icon-glow-color)" }} labelStyle={{ color: "var(--muted-foreground)" }} itemStyle={{ color: "var(--teal)" }} />
                  <Area type="monotone" dataKey="count" stroke="var(--teal)" strokeWidth={2} fill="url(#pubev)" dot={false} activeDot={{ r: 3, fill: "var(--teal)", stroke: "var(--background)", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {privacy.top_pages !== false && topPages.length > 0 && (
          <div className="mt-4">
            <SectionLabel>Most viewed pages</SectionLabel>
            <ul className="mt-1.5 flex flex-col gap-1">
              {topPages.map((p, i) => {
                const max = topPages[0].count || 1;
                return (
                  <li key={p.path} className="flex flex-col gap-0.5 py-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="font-mono text-[9px] text-muted-foreground">#{i + 1}</span><span className="font-mono text-[10px]">{p.path}</span></span>
                      <span className="font-mono text-[10px] text-teal tabular-nums">{p.count}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-hairline">
                      <div className="h-full rounded-full bg-grad-teal-amber transition-all duration-500" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Panel>

      {privacy.improvement_form !== false && (
        <Panel className="no-print">
          <SectionLabel>Send a suggestion</SectionLabel>
          <form onSubmit={submitRequest} className="mt-2 flex flex-col gap-2">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your suggestion…" className="input-surface text-xs" rows={2} />
            <Button type="submit" disabled={busy} className="w-fit h-8 bg-teal text-[var(--background)] hover:bg-teal/90 shine text-xs">
              {busy ? <Spinner /> : <><Send className="h-3 w-3" /> Send</>}
            </Button>
          </form>
        </Panel>
      )}

      <div className="no-print flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        <Activity className="h-2.5 w-2.5 text-teal" /> FreeDash · /{selectedSlug}
      </div>
    </div>
  );
}