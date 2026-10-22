"use client";

import { useEffect, useState } from "react";
import { api, type Insight, type ClientListItem } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, StatCard, Badge, EmptyState, Spinner } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Bot, Sparkles, TrendingUp, Zap, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function IntelligenceView() {
  const { selectedClientId, openClient, bump, toast, refreshTick } = useApp();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [filterId, setFilterId] = useState<string>("all");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<{ total: number; critical: number; warnings: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const cl = await api.listClients();
        if (cancelled) return;
        setClients(cl.clients);
        const result = await api.listInsights();
        if (cancelled) return;
        const all = result.insights;
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInsights(all);
        setStats({ total: all.length, critical: all.filter((i) => i.severity === "critical").length, warnings: all.filter((i) => i.severity === "warning").length });
      } catch (e) {
        if (!cancelled) {
          setLoadError(true);
          toast((e as Error).message, "destructive");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshTick, toast]);

  useEffect(() => { if (selectedClientId) setFilterId(selectedClientId); }, [selectedClientId]);

  const clientIdToName = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const filtered = filterId === "all" ? insights : insights.filter((i) => i.clientId === filterId);

  const generateFor = async (id: string) => {
    setGenerating(true);
    try {
      const r = await api.generateInsight(id);
      if (r.degraded) toast("Autopilot paused — retrying.", "destructive");
      else toast("Qwen synthesized a fresh insight.");
      bump();
    } catch (e) { toast((e as Error).message, "destructive"); } finally { setGenerating(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between anim-rise">
        <div>
          <SectionLabel accent>Stage 2 · Qwen autopilot</SectionLabel>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Intelligence <span className="text-grad-teal-amber">Center</span>
          </h1>
          <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">Plain-language synthesis of tracker telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterId} onValueChange={setFilterId}>
            <SelectTrigger className="w-[180px] border-hairline bg-panel input-surface h-8 text-xs"><SelectValue placeholder="All clients" /></SelectTrigger>
            <SelectContent className="border-hairline bg-panel">
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
        <StatCard label="Insights" value={stats?.total ?? "—"} icon={<Sparkles className="h-3.5 w-3.5" />} accent="amber" />
        <StatCard label="Critical" value={stats?.critical ?? 0} icon={<AlertTriangle className="h-3.5 w-3.5" />} accent={stats?.critical ? "critical" : "default"} />
        <StatCard label="Warnings" value={stats?.warnings ?? 0} icon={<AlertTriangle className="h-3.5 w-3.5" />} accent="amber" />
        <StatCard label="Clients" value={clients.length} icon={<TrendingUp className="h-3.5 w-3.5" />} />
      </div>

      <Panel glow="amber">
        <div className="mb-3 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber/10 text-amber icon-interactive icon-shimmer icon-pulse">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <SectionLabel accent>Autopilot synthesis</SectionLabel>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {clients.slice(0, 4).map((c) => (
              <Button key={c.id} variant="outline" size="sm" onClick={() => generateFor(c.id)} disabled={generating} className="h-6 border-amber/40 bg-amber/5 px-2 text-[10px] text-amber transition-all hover:bg-amber/10 hover:shadow-[0_0_14px_-4px_rgba(242,169,59,0.5)] icon-interactive">
                {generating ? <Spinner /> : <Zap className="h-2.5 w-2.5" />} {c.name}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground"><Spinner /> Loading insights…</div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-xs text-muted-foreground">
            <span>Couldn’t load intelligence data. Try again.</span>
            <Button variant="outline" size="sm" onClick={bump} className="h-8 text-xs">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-5 w-5 text-amber" />} title="No insights yet" body="Run synthesis for any client above." />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 stagger">
            {filtered.map((i) => {
              const tone = i.severity === "critical" ? "critical" : i.severity === "warning" ? "amber" : "teal";
              return (
                <div key={i.id} className="group relative overflow-hidden rounded-lg bg-background/60 p-3 transition-all hover:bg-panel-2">
                  <div className="mb-1.5 flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("grid h-7 w-7 place-items-center rounded-lg icon-interactive icon-shimmer", tone === "critical" ? "bg-critical/10 text-critical" : tone === "amber" ? "bg-amber/10 text-amber" : "bg-teal/10 text-teal")}>
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-xs font-semibold">{i.title}</h3>
                    </div>
                    <Badge tone={tone}>{i.severity}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{i.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <button onClick={() => openClient(i.clientId, undefined, "client")} className="text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-amber">
                      {clientIdToName[i.clientId] ?? "client"} →
                    </button>
                    <span className="text-[9px] text-muted-foreground">{new Date(i.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
