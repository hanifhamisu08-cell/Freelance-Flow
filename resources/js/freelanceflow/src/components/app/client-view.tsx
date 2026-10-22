"use client";

import { useEffect, useState } from "react";
import { api, type ClientDetail } from "@/lib/client";
import { useApp } from "@/lib/store";
import {
  Panel,
  SectionLabel,
  StatCard,
  Badge,
  EmptyState,
  Spinner,
  GradientButton,
} from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowLeft,
  Bot,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

export function ClientView() {
  const { selectedClientId, setView, openClient, bump, toast, refreshTick } = useApp();
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!selectedClientId) return;
    setLoading(true);
    api.getClient(selectedClientId).then((r) => {
      if (cancelled) return;
      setData({ client: r.client, privacy: r.privacy, events: r.events, metrics: r.metrics, requests: r.requests, insights: r.insights, actions: r.actions, reports: r.reports });
    }).catch((e) => toast((e as Error).message, "destructive")).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClientId, refreshTick, toast]);

  if (loading || !data) {
    return <Panel className="flex items-center gap-2 py-8 text-muted-foreground"><Spinner /> Loading…</Panel>;
  }

  const { client, metrics, events, insights } = data;
  const chartData = metrics.hourly.map((h) => ({ ts: new Date(h.ts).toLocaleTimeString([], { hour: "2-digit" }), count: h.count }));

  const generateInsight = async () => {
    setGenerating(true);
    try {
      const r = await api.generateInsight(client.id);
      if (r.degraded) toast("Autopilot paused — retrying.", "destructive");
      else toast("Qwen generated a fresh insight.");
      bump();
    } catch (e) { toast((e as Error).message, "destructive"); } finally { setGenerating(false); }
  };

  const snippet = `<?php
$FREEDASH_SLUG = "${client.dashboardSlug}";
$FREEDASH_URL  = "https://your-app.onrender.com";
$ch = curl_init($FREEDASH_URL . "/api/track");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT_MS => 800,
  CURLOPT_HTTPHEADER => ["Content-Type: application/json", "X-FreeDash-Slug: " . $FREEDASH_SLUG],
  CURLOPT_POSTFIELDS => json_encode([
    "slug" => $FREEDASH_SLUG,
    "path" => $_SERVER["REQUEST_URI"] ?? "/",
    "referrer" => $_SERVER["HTTP_REFERER"] ?? null,
    "event_type" => "page_view",
  ]),
]);
curl_exec($ch); curl_close($ch);
?>`;

  const copySnippet = () => { navigator.clipboard.writeText(snippet); toast("Tracker snippet copied."); };

  const simulateTraffic = async () => {
    try {
      const paths = ["/", "/work", "/work/case-study", "/about", "/contact", "/pricing"];
      await Promise.all(paths.map((p) => api.track(client.dashboardSlug, p).catch(() => null)));
      toast("Simulated 6 page views.");
      bump();
    } catch (e) { toast((e as Error).message, "destructive"); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 anim-rise">
        <button onClick={() => setView("dashboard")} className="group flex w-fit items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /> Back
        </button>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{client.name}</h1>
              {metrics.total > 0 ? <Badge tone="teal"><span className="h-1 w-1 rounded-full bg-teal telemetry-dot" />live</Badge> : <Badge tone="muted">no data</Badge>}
            </div>
            <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">{client.projectTitle || "Project dashboard"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={simulateTraffic} className="btn-ghost-glow border-hairline bg-panel h-8 text-xs">
              <Activity className="h-3 w-3 text-teal" /> Simulate
            </Button>
            <Button variant="outline" size="sm" onClick={() => openClient(client.id, client.dashboardSlug, "client-public")} className="border-hairline bg-panel h-8 text-xs">
              <ExternalLink className="h-3 w-3" /> Client view
            </Button>
            <Button variant="outline" size="sm" onClick={() => openClient(client.id, client.dashboardSlug, "client-settings")} className="border-hairline bg-panel h-8 text-xs">Privacy</Button>
            <Button variant="outline" size="sm" onClick={() => openClient(client.id, client.dashboardSlug, "client-requests")} className="border-hairline bg-panel h-8 text-xs">Requests</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
        <StatCard label="Total events" value={metrics.total.toLocaleString()} icon={<Activity className="h-3.5 w-3.5" />} accent="teal" />
        <StatCard label="Last 24h" value={metrics.last24h} />
        <StatCard label="Last 7d" value={metrics.last7d} />
        <StatCard label="Last seen" value={metrics.lastEvent ? new Date(metrics.lastEvent).toLocaleDateString() : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Activity · 24h</SectionLabel>
            {metrics.total > 0 && <Badge tone="teal"><span className="h-1 w-1 rounded-full bg-teal telemetry-dot" />live</Badge>}
          </div>
          <div className="h-48 w-full">
            {metrics.total === 0 ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">Waiting for data…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="ev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--teal)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ts" tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={{ stroke: "var(--hairline)" }} interval={3} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--teal)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11, boxShadow: "0 6px 20px -6px var(--icon-glow-color)" }} labelStyle={{ color: "var(--muted-foreground)" }} itemStyle={{ color: "var(--teal)" }} />
                  <Area type="monotone" dataKey="count" stroke="var(--teal)" strokeWidth={2} fill="url(#ev)" dot={false} activeDot={{ r: 3, fill: "var(--teal)", stroke: "var(--background)", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Top pages</SectionLabel>
            <Globe className="h-3.5 w-3.5 text-muted-foreground icon-interactive" />
          </div>
          {metrics.topPages.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">No page data yet.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {metrics.topPages.map((p, i) => {
                const max = metrics.topPages[0].count || 1;
                return (
                  <li key={p.path} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-mono text-[10px]">{p.path}</span>
                      <span className="font-mono text-[10px] text-teal tabular-nums">{p.count}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-hairline">
                      <div className="h-full rounded-full bg-grad-teal-amber transition-all duration-500" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Drop-in tracker</SectionLabel>
            <Button variant="outline" size="sm" onClick={copySnippet} className="h-6 border-hairline bg-panel px-2 text-[10px] btn-ghost-glow icon-interactive">
              <Copy className="h-2.5 w-2.5" /> Copy
            </Button>
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg bg-background/60 p-2.5 text-[10px] leading-relaxed text-muted-foreground scroll-thin">
            <code>{snippet}</code>
          </pre>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Check className="h-3 w-3 text-teal icon-interactive" />
            <span className="font-mono uppercase tracking-wider">POST /api/track · {client.dashboardSlug}</span>
          </div>
        </Panel>

        <Panel glow="amber">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel accent>Qwen insight</SectionLabel>
            <Button variant="outline" size="sm" onClick={generateInsight} disabled={generating} className="h-6 border-amber/40 bg-amber/5 px-2 text-[10px] text-amber hover:bg-amber/10 icon-interactive">
              {generating ? <Spinner /> : <Sparkles className="h-2.5 w-2.5" />} Synthesize
            </Button>
          </div>
          {insights.length === 0 ? (
            <EmptyState icon={<Sparkles className="h-5 w-5 text-amber" />} title="No insight yet" body="Run the Qwen autopilot to generate insights." />
          ) : (
            <div className="flex flex-col gap-2">
              {insights.slice(0, 2).map((i) => (
                <div key={i.id} className="rounded-lg bg-background/60 p-2.5 transition-colors hover:bg-panel-2">
                  <div className="mb-1 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-medium">
                      <Sparkles className="h-3 w-3 text-amber icon-interactive" /> {i.title}
                    </span>
                    <Badge tone={i.severity === "critical" ? "critical" : i.severity === "warning" ? "amber" : "teal"}>{i.severity}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{i.body}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Recent events</SectionLabel>
            <Badge tone="muted">{events.length}</Badge>
          </div>
          {events.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">No events yet.</div>
          ) : (
            <ul className="max-h-56 overflow-y-auto scroll-thin flex flex-col gap-1">
              {events.slice(0, 30).map((e) => (
                <li key={e.id} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="h-1 w-1 rounded-full bg-teal telemetry-dot" />
                    <span className="truncate font-mono text-[10px]">{e.path}</span>
                  </span>
                  <span className="ml-2 shrink-0 font-mono text-[9px] text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel accent>Autopilot</SectionLabel>
            <Button variant="outline" size="sm" onClick={() => setView("autopilot")} className="h-6 border-hairline bg-panel px-2 text-[10px] icon-interactive">
              <Bot className="h-2.5 w-2.5" /> Queue
            </Button>
          </div>
          {data.actions.length === 0 ? (
            <EmptyState icon={<Bot className="h-5 w-5 text-amber" />} title="Autopilot idle" body="Run the sweep to generate actions." />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {data.actions.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-1.5 rounded-lg bg-background/60 p-2 transition-colors hover:bg-panel-2">
                  <div>
                    <div className="flex items-center gap-1 text-xs font-medium">
                      {a.autoMode ? <Badge tone="teal">auto</Badge> : <Badge tone="amber">review</Badge>}
                      <span className="truncate">{a.title}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{a.detail}</p>
                  </div>
                  <Badge tone={a.status === "sent" ? "teal" : a.status === "approved" ? "teal" : a.status === "rejected" ? "muted" : "amber"}>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}