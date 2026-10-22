"use client";

import { useEffect, useState } from "react";
import { api, type ClientListItem } from "@/lib/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Activity,
  ArrowUpRight,
  Bot,
  ExternalLink,
  FileText,
  Plus,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandedLogo } from "@/components/app/branded-logo";

export function DashboardView() {
  const { openClient, bump, toast, refreshTick } = useApp();
  const [clients, setClients] = useState<ClientListItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listClients()
      .then((r) => {
        if (!cancelled) setClients(r.clients);
      })
      .catch((e) => toast((e as Error).message, "destructive"));
    return () => { cancelled = true; };
  }, [refreshTick, toast]);

  const reload = async () => {
    try {
      const r = await api.listClients();
      setClients(r.clients);
    } catch (e) {
      toast((e as Error).message, "destructive");
    }
  };

  const totalEvents = clients?.reduce((a, c) => a + c.eventCount, 0) ?? 0;
  const totalRequests = clients?.reduce((a, c) => a + c.requestCount, 0) ?? 0;
  const totalInsights = clients?.reduce((a, c) => a + c.insightCount, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between anim-rise">
        <div>
          <SectionLabel>Freelancer workspace</SectionLabel>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Client <span className="text-grad-teal-amber">dashboards</span>
          </h1>
          <p className="mt-1 max-w-lg text-xs text-muted-foreground">
            Every client gets a unique, privacy-controlled live URL.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <GradientButton className="h-8 shine">
              <Plus className="h-3.5 w-3.5" /> Add client
            </GradientButton>
          </DialogTrigger>
          <CreateClientDialog
            creating={creating}
            setCreating={setCreating}
            onClose={() => setOpen(false)}
            onCreated={(c) => {
              setOpen(false);
              bump();
              toast(`Created ${c.name}.`);
              openClient(c.id, c.dashboardSlug, "client");
            }}
          />
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
        <StatCard label="Clients" value={clients?.length ?? "—"} icon={<Users className="h-3.5 w-3.5" />} />
        <StatCard label="Events" value={totalEvents.toLocaleString()} icon={<Activity className="h-3.5 w-3.5" />} accent="teal" />
        <StatCard label="Insights" value={totalInsights} icon={<Sparkles className="h-3.5 w-3.5" />} accent="amber" />
        <StatCard label="Requests" value={totalRequests} icon={<FileText className="h-3.5 w-3.5" />} accent={totalRequests > 0 ? "critical" : "default"} />
      </div>

      <Panel glow="violet" className="flex flex-col items-start justify-between gap-2.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet/10 text-violet icon-interactive icon-shimmer icon-pulse">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display text-sm font-semibold">Autopilot is standing by</div>
            <div className="text-[11px] text-muted-foreground">
              Run the Qwen sweep to draft insights, actions and reports.
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => useApp.getState().setView("autopilot")}
          className="btn-ghost-glow text-violet hover:text-violet h-8 text-xs"
        >
          Open autopilot <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </Panel>

      {clients === null ? (
        <Panel className="flex items-center gap-2 py-8 text-muted-foreground">
          <Spinner /> Loading clients…
        </Panel>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No clients yet"
          body="Add your first client or hit Seed demo data to explore."
          logo={<BrandedLogo variant="icon" size={32} className="mb-3 opacity-30" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 stagger">
          {clients.map((c) => (
            <ClientCard key={c.id} c={c} onOpen={() => openClient(c.id, c.dashboardSlug, "client")} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ c, onOpen }: { c: ClientListItem; onOpen: () => void }) {
  const last = c.lastActivity ? timeAgo(c.lastActivity) : "no activity yet";
  return (
    <Panel hover className="group flex cursor-pointer flex-col gap-2.5 shine">
      <button onClick={onOpen} className="flex flex-col gap-2.5 text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-base font-semibold">{c.name}</h3>
              {c.eventCount > 0 && (
                <Badge tone="teal">
                  <span className="h-1 w-1 rounded-full bg-teal telemetry-dot" />
                  live
                </Badge>
              )}
            </div>
            <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              {c.projectTitle || c.contactEmail || `/${c.dashboardSlug}`}
            </div>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-all group-hover:bg-teal/10 group-hover:text-teal icon-interactive icon-shimmer">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/60 p-2">
          <MiniStat label="Events" value={c.eventCount.toLocaleString()} />
          <MiniStat label="Requests" value={c.requestCount} tone={c.requestCount > 0 ? "amber" : "muted"} />
          <MiniStat label="Insights" value={c.insightCount} tone={c.insightCount > 0 ? "amber" : "muted"} />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">{last}</span>
          <span className="flex items-center gap-1 font-mono">
            <ExternalLink className="h-2.5 w-2.5" /> /{c.dashboardSlug.slice(0, 18)}
          </span>
        </div>
      </button>
    </Panel>
  );
}

function MiniStat({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "amber" | "muted" }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("font-display text-base font-semibold tabular-nums", tone === "amber" && "text-amber", tone === "muted" && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

function CreateClientDialog({ creating, setCreating, onClose, onCreated }: {
  creating: boolean;
  setCreating: (b: boolean) => void;
  onClose: () => void;
  onCreated: (c: { id: string; name: string; dashboardSlug: string }) => void;
}) {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const { toast } = useApp();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await api.createClient({ name, contactEmail, projectTitle, projectSummary });
      onCreated({ id: r.client.id, name: r.client.name, dashboardSlug: r.client.dashboardSlug });
    } catch (err) {
      toast((err as Error).message, "destructive");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DialogContent className="border-hairline bg-panel shadow-pop">
      <DialogHeader>
        <DialogTitle className="font-display text-base">Add a new client</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="flex flex-col gap-3 py-2">
        <div className="flex flex-col gap-1">
          <Label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Client name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aria Studio" className="input-surface h-9 text-sm" required />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Contact email</Label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ops@aria.co" className="input-surface h-9 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Project title</Label>
            <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Marketing site relaunch" className="input-surface h-9 text-sm" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Project summary</Label>
          <Textarea value={projectSummary} onChange={(e) => setProjectSummary(e.target.value)} placeholder="What this dashboard tracks." className="input-surface text-sm" rows={2} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
          <GradientButton type="submit" disabled={creating} className="h-8">
            {creating ? <Spinner /> : "Create & open"}
          </GradientButton>
        </div>
      </form>
    </DialogContent>
  );
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export { timeAgo };