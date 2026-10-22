"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "@/lib/store";
import { Panel, SectionLabel, Spinner, GradientButton } from "@/components/app/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Eye,
  FileText,
  Info,
  LayoutDashboard,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { BrandedLogo } from "@/components/app/branded-logo";

export function AuthView() {
  const { setUser, toast } = useApp();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("founder@freelanceflow.app");
  const [password, setPassword] = useState("prototype123");
  const [name, setName] = useState("Flow Founder");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password, name);
      const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
      if (csrfMeta) csrfMeta.content = r.csrfToken;
      setUser(r.user);
      toast(`Welcome, ${r.user.name}.`);
    } catch (err) {
      toast((err as Error).message, "destructive");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-30" />
      <div className="orb left-[-10%] top-[-10%] h-72 w-72 bg-teal/25" />
      <div
        className="orb right-[-5%] top-[10%] h-64 w-64 bg-amber/20"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="orb bottom-[-10%] left-[30%] h-64 w-64 bg-violet/15"
        style={{ animationDelay: "-8s" }}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 md:px-6 lg:grid-cols-2 lg:py-12">
        {/* Left — pitch */}
        <div className="flex flex-col justify-center anim-rise">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-panel px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Qwen Cloud Hackathon · Autopilot Agent
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
            Live client dashboards
            <br />
            with an{" "}
            <span className="text-grad-teal-amber">AI autopilot</span>{" "}
            on top.
          </h1>

          <p className="mt-4 max-w-lg text-sm text-muted-foreground md:text-base">
            FreelanceFlow is built in two stages.{" "}
            <span className="text-foreground">FreeDash</span> lets a freelancer share a live,
            privacy-controlled project dashboard with each client.{" "}
            <span className="text-amber">Stage 2</span> adds a Qwen-powered autopilot that drafts
            insights, reports and actions — the freelancer just approves.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 stagger">
            <Feature
              icon={<LayoutDashboard className="h-4 w-4" />}
              title="Per-client dashboards"
              body="Unique shareable URL per client. Universal drop-in tracker."
            />
            <Feature
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Privacy controls"
              body="Toggle every field. The client only sees what you allow."
            />
            <Feature
              icon={<Sparkles className="h-4 w-4" />}
              title="Qwen insights"
              body="Plain-language synthesis of raw tracker telemetry."
              accent="amber"
            />
            <Feature
              icon={<Bot className="h-4 w-4" />}
              title="Autopilot queue"
              body="Auto vs needs-approval. One click to approve & send."
              accent="amber"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3" /> Live tracker
            </span>
            <span className="flex items-center gap-1.5 text-teal">
              <Radar className="h-3 w-3" /> Telemetry strip
            </span>
            <span className="flex items-center gap-1.5 text-amber">
              <FileText className="h-3 w-3" /> Report drafting
            </span>
          </div>
        </div>

        {/* Right — auth card */}
        <div className="flex flex-col items-center justify-center">
          <div className="mb-6 flex justify-center">
            <BrandedLogo variant="full" height={64} />
          </div>
          <Panel
            glow="teal"
            className="w-full max-w-sm p-5 anim-pop"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <SectionLabel accent>
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </SectionLabel>
                <h2 className="mt-0.5 font-display text-xl font-semibold">
                  {mode === "login" ? "Sign in" : "Start in 10 seconds"}
                </h2>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-teal/30 bg-teal/10 text-teal icon-interactive icon-shimmer icon-pulse">
                <Lock className="h-4 w-4" />
              </span>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 bg-panel/80">
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="login">Sign in</TabsTrigger>
              </TabsList>

              <TabsContent value="register" className="mt-4">
                <form onSubmit={submit} className="flex flex-col gap-3">
                  <Field label="Your name">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="input-surface h-9 text-sm"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-surface h-9 text-sm"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-surface h-9 text-sm"
                    />
                  </Field>
                  <GradientButton type="submit" disabled={busy} className="mt-1 h-9">
                    {busy ? <Spinner /> : <>Create account <ArrowRight className="h-3.5 w-3.5" /></>}
                  </GradientButton>
                </form>
                <aside className="mt-4 flex gap-3 rounded-xl border border-teal/40 bg-teal/10 px-3.5 py-3 shadow-[0_0_18px_rgba(45,212,191,0.08)]" aria-label="Prototype notice">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-teal/30 bg-teal/15 text-teal">
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-teal">FreelanceFlow preview</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      You’re seeing a prototype of the planned design and key features while the full site is being built.
                    </p>
                  </div>
                </aside>
              </TabsContent>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={submit} className="flex flex-col gap-3">
                  <Field label="Email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-surface h-9 text-sm"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-surface h-9 text-sm"
                    />
                  </Field>
                  <GradientButton type="submit" disabled={busy} className="mt-1 h-9">
                    {busy ? <Spinner /> : <>Sign in <ArrowRight className="h-3.5 w-3.5" /></>}
                  </GradientButton>
                </form>
              </TabsContent>
            </Tabs>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Demo credentials are prefilled. After signing in, hit{" "}
              <span className="font-mono text-teal">Seed demo data</span> to explore.
            </p>

            {/* Quick role switch */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await api.login("founder@freelanceflow.app", "prototype123");
                    const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
                    if (csrfMeta) csrfMeta.content = r.csrfToken;
                    setUser(r.user);
                    toast(`Welcome, ${r.user.name}.`);
                  } catch (err) {
                    toast((err as Error).message || "Unable to sign in to the freelancer account.", "destructive");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-lg bg-panel p-2.5 text-left transition-colors hover:bg-panel-2"
              >
                <div className="text-[10px] font-medium text-teal">Freelancer</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground font-mono truncate">
                  founder@freelanceflow.app
                </div>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await api.login("owner@demo.com", "owner123");
                    const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
                    if (csrfMeta) csrfMeta.content = r.csrfToken;
                    setUser(r.user);
                    toast(`Welcome, ${r.user.name}.`);
                  } catch (err) {
                    toast((err as Error).message || "Unable to sign in to the business owner account.", "destructive");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-lg bg-panel p-2.5 text-left transition-colors hover:bg-panel-2"
              >
                <div className="text-[10px] font-medium text-amber">Business Owner</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground font-mono truncate">
                  owner@demo.com
                </div>
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  accent = "teal",
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: "teal" | "amber";
}) {
  return (
    <div className="group relative flex items-start gap-2.5 overflow-hidden rounded-lg bg-panel p-3 transition-all hover:bg-panel-2">
      <span
        className={
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg icon-interactive icon-shimmer icon-pulse " +
          (accent === "amber"
            ? "bg-amber/10 text-amber"
            : "bg-teal/10 text-teal")
        }
      >
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}
