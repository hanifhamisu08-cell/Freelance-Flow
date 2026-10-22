"use client";

import { useEffect, useState } from "react";
import { api, type ImprovementRequest } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, Badge, EmptyState, Spinner } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, MessageSquare, X } from "lucide-react";

export function RequestsView() {
  const { selectedClientId, setView, bump, toast, refreshTick } = useApp();
  const [requests, setRequests] = useState<ImprovementRequest[] | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selectedClientId) return;
    let cancelled = false;
    api.listRequests(selectedClientId).then((r) => { if (!cancelled) setRequests(r.requests); }).catch((e) => toast((e as Error).message, "destructive"));
    return () => { cancelled = true; };
  }, [selectedClientId, refreshTick, toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !message.trim()) return;
    setBusy(true);
    try { await api.createRequest(selectedClientId, message); setMessage(""); toast("Request logged."); bump(); } catch (err) { toast((err as Error).message, "destructive"); } finally { setBusy(false); }
  };

  const setStatus = async (rid: string, status: string) => {
    if (!selectedClientId) return;
    try { await api.setRequestStatus(selectedClientId, rid, status); bump(); } catch (e) { toast((e as Error).message, "destructive"); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="anim-rise">
        <button onClick={() => setView("client")} className="group flex w-fit items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /> Back
        </button>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Improvement <span className="text-grad-teal-amber">requests</span>
        </h1>
        <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
          Clients can submit feedback from their dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <SectionLabel>Inbox</SectionLabel>
            <Badge tone="muted">{requests?.filter((r) => r.status === "open").length ?? 0} open</Badge>
          </div>
          {requests === null ? (
            <div className="flex items-center gap-2 py-4 text-muted-foreground"><Spinner /> Loading…</div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No requests yet" body="Client feedback will appear here." />
          ) : (
            <ul className="flex flex-col gap-1.5 stagger">
              {requests.map((r) => (
                <li key={r.id} className="group rounded-lg bg-background/60 p-2.5 transition-all hover:bg-panel-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs">{r.message}</p>
                    <Badge tone={r.status === "open" ? "amber" : "teal"}>{r.status}</Badge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {r.status === "open" ? (
                      <Button variant="outline" size="sm" onClick={() => setStatus(r.id, "resolved")} className="h-6 border-teal/40 bg-teal/5 px-2 text-[10px] text-teal hover:bg-teal/10 icon-interactive">
                        <Check className="h-2.5 w-2.5" /> Resolve
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setStatus(r.id, "open")} className="h-6 border-hairline bg-panel px-2 text-[10px] icon-interactive">
                        <X className="h-2.5 w-2.5" /> Reopen
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel glow="teal">
          <SectionLabel>Log a request</SectionLabel>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Manually capture client feedback.</p>
          <form onSubmit={submit} className="mt-2.5 flex flex-col gap-2.5">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Client asked for a clearer hero CTA." className="input-surface text-xs" rows={4} />
            <Button type="submit" disabled={busy} className="h-8 bg-teal text-[var(--background)] hover:bg-teal/90 shine text-xs">
              {busy ? <Spinner /> : "Log request"}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}