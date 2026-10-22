"use client";

import { useEffect, useState } from "react";
import { api, type Report, type ClientListItem } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, Badge, EmptyState, Spinner } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, FileText, PenLine, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { BrandedLogo } from "@/components/app/branded-logo";

export function ReportsView() {
  const { bump, toast, refreshTick } = useApp();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [period, setPeriod] = useState("Weekly");
  const [drafting, setDrafting] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, c] = await Promise.all([api.listReports(), api.listClients()]);
        if (cancelled) return;
        setReports(r.reports);
        setClients(c.clients);
        if (!clientId && c.clients[0]) setClientId(c.clients[0].id);
      } catch (e) { toast((e as Error).message, "destructive"); }
    })();
    return () => { cancelled = true; };
  }, [refreshTick, toast, clientId]);

  const draft = async () => {
    if (!clientId) return;
    setDrafting(true);
    try {
      const r = await api.draftReport(clientId, period);
      if (!r.report) { toast(r.message ?? "Report drafting paused.", "destructive"); }
      else { toast("Qwen drafted a report."); setSelected(r.report); bump(); }
    } catch (e) { toast((e as Error).message, "destructive"); } finally { setDrafting(false); }
  };

  if (selected) {
    return <ReportEditor report={selected} onBack={() => { setSelected(null); bump(); }} />;
  }

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "client";

  return (
    <div className="flex flex-col gap-4">
      <div className="anim-rise">
        <SectionLabel accent>Stage 2 · Qwen autopilot</SectionLabel>
        <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          <span className="text-grad-teal-amber">Reports</span>
        </h1>
        <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">Qwen drafts Markdown status reports from telemetry.</p>
      </div>

      <Panel glow="amber">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber/10 text-amber icon-interactive icon-shimmer icon-pulse">
            <Sparkles className="h-4 w-4" />
          </span>
          <SectionLabel accent>Draft a report</SectionLabel>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Client</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="border-hairline input-surface h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent className="border-hairline bg-panel">
                {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="border-hairline input-surface h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="border-hairline bg-panel">
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={draft} disabled={drafting || !clientId} className="w-full h-8 bg-amber text-[var(--background)] hover:bg-amber/90 shine text-xs">
              {drafting ? <Spinner /> : <PenLine className="h-3 w-3" />} Draft with Qwen
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>All reports</SectionLabel>
          <Badge tone="muted">{reports?.length ?? 0}</Badge>
        </div>
        {reports === null ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground"><Spinner /> Loading…</div>
        ) : reports.length === 0 ? (
          <EmptyState icon={<FileText className="h-5 w-5" />} title="No reports yet" body="Draft your first report above." logo={<BrandedLogo variant="icon" size={32} className="mb-3 opacity-30" />} />
        ) : (
          <ul className="flex flex-col gap-1.5 stagger">
            {reports.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelected(r)} className="group flex w-full items-start justify-between gap-2 rounded-lg bg-background/60 p-2.5 text-left transition-all hover:bg-panel-2 icon-interactive">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber/10 text-amber icon-interactive icon-shimmer">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-semibold">{r.title}</h3>
                        <Badge tone={r.status === "draft" ? "amber" : "teal"}>{r.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{clientName(r.clientId)} · {r.period}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground group-hover:text-amber">edit →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function ReportEditor({ report, onBack }: { report: Report; onBack: () => void }) {
  const { bump, toast } = useApp();
  const [body, setBody] = useState(report.bodyMd);
  const [status, setStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const save = async (newStatus?: string) => {
    setSaving(true);
    try {
      const r = await api.updateReport(report.id, { bodyMd: body, status: newStatus ?? status });
      setStatus(r.report.status);
      if (newStatus) toast(newStatus === "sent" ? "Report sent." : newStatus === "approved" ? "Approved." : "Saved.");
      bump();
    } catch (e) { toast((e as Error).message, "destructive"); } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="anim-rise">
        <button onClick={onBack} className="group flex w-fit items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /> Back to reports
        </button>
        <div className="mt-1.5 flex items-center gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{report.title}</h1>
          <Badge tone={status === "draft" ? "amber" : "teal"}>{status}</Badge>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{report.period} · {new Date(report.updatedAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel>
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>{editing ? "Edit" : "Preview"}</SectionLabel>
            <Button variant="outline" size="sm" onClick={() => setEditing((e) => !e)} className="h-6 border-hairline bg-panel px-2 text-[10px] icon-interactive">
              <PenLine className="h-2.5 w-2.5" /> {editing ? "Preview" : "Edit"}
            </Button>
          </div>
          {editing ? (
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[360px] input-surface font-mono text-[11px]" />
          ) : (
            <div className="prose-invert min-h-[360px] max-w-none text-xs leading-relaxed text-muted-foreground [&_h1]:font-display [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:font-display [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:my-0.5 [&_ul]:my-1.5 [&_strong]:text-foreground">
              <ReactMarkdown>{body}</ReactMarkdown>
            </div>
          )}
        </Panel>

        <Panel glow="amber">
          <SectionLabel accent>Approve &amp; send</SectionLabel>
          <p className="mt-1 text-[11px] text-muted-foreground">Nothing reaches a client until you click send.</p>
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="rounded-lg bg-background/60 p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Status</span>
                <Badge tone={status === "draft" ? "amber" : "teal"}>{status}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button onClick={() => save("approved")} disabled={saving || status !== "draft"} className="h-8 bg-teal text-[var(--background)] hover:bg-teal/90 shine text-xs">
                <Check className="h-3.5 w-3.5" /> {saving ? <Spinner /> : "Approve"}
              </Button>
              <Button onClick={() => save("sent")} disabled={saving || status === "draft"} className={cn("h-8 text-[var(--background)] shine text-xs", status === "sent" ? "bg-teal" : "bg-amber hover:bg-amber/90")}>
                <Send className="h-3.5 w-3.5" /> {status === "sent" ? "Already sent" : "Approve & send"}
              </Button>
              <Button onClick={() => save()} variant="outline" className="border-hairline bg-panel text-xs h-8">Save draft</Button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}