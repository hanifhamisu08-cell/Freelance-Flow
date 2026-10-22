"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, Spinner } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

export function SettingsView() {
  const { selectedClientId, setView, bump, toast, refreshTick } = useApp();
  const [fields, setFields] = useState<{ key: string; label: string; visible: boolean }[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedClientId) return;
    let cancelled = false;
    api.getPrivacy(selectedClientId).then((r) => { if (!cancelled) setFields(r.fields); }).catch((e) => toast((e as Error).message, "destructive"));
    return () => { cancelled = true; };
  }, [selectedClientId, refreshTick, toast]);

  const toggle = (key: string, visible: boolean) => {
    setFields((prev) => prev?.map((f) => (f.key === key ? { ...f, visible } : f)) ?? null);
  };

  const save = async () => {
    if (!fields || !selectedClientId) return;
    setSaving(true);
    try {
      const map = Object.fromEntries(fields.map((f) => [f.key, f.visible]));
      await api.updatePrivacy(selectedClientId, map);
      toast("Privacy controls saved.");
      bump();
    } catch (e) { toast((e as Error).message, "destructive"); } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="anim-rise">
        <button onClick={() => setView("client")} className="group flex w-fit items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /> Back
        </button>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Privacy <span className="text-grad-teal-amber">controls</span>
        </h1>
        <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
          Toggle every field on the client-facing dashboard.
        </p>
      </div>

      <Panel glow="teal">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal/10 text-teal icon-interactive icon-shimmer icon-pulse">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <SectionLabel>Per-field visibility</SectionLabel>
        </div>
        {!fields ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground"><Spinner /> Loading…</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {fields.map((f) => (
              <li key={f.key} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={"grid h-8 w-8 place-items-center rounded-lg icon-interactive icon-shimmer " + (f.visible ? "bg-teal/10 text-teal" : "bg-panel text-muted-foreground")}>
                    {f.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <div className="text-xs font-medium">{f.label}</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{f.key}</div>
                  </div>
                </div>
                <Switch checked={f.visible} onCheckedChange={(v) => toggle(f.key, v)} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex justify-end">
          <Button onClick={save} disabled={saving} className="h-8 bg-teal text-[var(--background)] hover:bg-teal/90 shine text-xs">
            {saving ? <Spinner /> : "Save controls"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}