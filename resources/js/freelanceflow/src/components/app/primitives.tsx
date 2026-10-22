"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

/**
 * Panel — layered surface with hairline border.
 */
export function Panel({
  children,
  className,
  glow,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: "teal" | "amber" | "violet" | "none";
  hover?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative rounded-lg p-4 card-surface overflow-hidden",
        glow === "teal" && "bg-radial-teal",
        glow === "amber" && "bg-radial-amber",
        glow === "violet" && "bg-radial-violet",
        hover && "card-surface-hover cursor-pointer",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function SectionLabel({
  children,
  className,
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]",
        accent ? "text-amber" : "text-muted-foreground",
        className,
      )}
    >
      {accent && (
        <span className="h-1 w-1 rounded-full bg-amber telemetry-dot-amber" />
      )}
      {children}
    </div>
  );
}

/**
 * IconWrapper — gives icons interactive hover glow, shimmer, and a pulse on mount.
 */
export function IconWrapper({
  children,
  className,
  accent = "teal",
}: {
  children: ReactNode;
  className?: string;
  accent?: "teal" | "amber" | "critical" | "violet" | "default";
}) {
  const chip =
    accent === "teal"
      ? "bg-teal/10 text-teal"
      : accent === "amber"
      ? "bg-amber/10 text-amber"
      : accent === "critical"
      ? "bg-critical/10 text-critical"
      : accent === "violet"
      ? "bg-violet/10 text-violet"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "grid place-items-center rounded-lg icon-interactive icon-shimmer icon-pulse",
        chip,
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * StatCard — compact with gradient accent bar, icon chip, and hover lift.
 */
export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "teal" | "amber" | "critical" | "violet" | "default";
  icon?: ReactNode;
}) {
  const accentBar =
    accent === "teal"
      ? "from-teal to-teal-soft"
      : accent === "amber"
      ? "from-amber to-amber-soft"
      : accent === "critical"
      ? "from-critical to-[#ff7a6e]"
      : accent === "violet"
      ? "from-violet to-[#c4b5fd]"
      : "from-muted-foreground/40 to-muted-foreground/20";

  return (
    <Panel hover className="group relative flex flex-col gap-2 overflow-hidden">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b",
          accentBar,
        )}
      />
      <div className="flex items-start justify-between">
        <SectionLabel>{label}</SectionLabel>
        {icon && (
          <IconWrapper accent={accent} className="h-7 w-7">
            <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
          </IconWrapper>
        )}
      </div>
      <div
        className={cn(
          "font-display text-2xl font-semibold tabular-nums leading-none",
          accent === "teal" && "text-teal",
          accent === "amber" && "text-amber",
          accent === "critical" && "text-critical",
          accent === "violet" && "text-violet",
          (!accent || accent === "default") && "text-foreground",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Panel>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "teal" | "amber" | "critical" | "violet" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "border-hairline text-foreground bg-muted",
    teal: "border-teal/40 text-teal bg-teal/10",
    amber: "border-amber/40 text-amber bg-amber/10",
    critical: "border-critical/40 text-critical bg-critical/10",
    violet: "border-violet/40 text-violet bg-violet/10",
    muted: "border-hairline text-muted-foreground bg-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  logo,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  logo?: ReactNode;
}) {
  return (
    <Panel
      glow="teal"
      className="flex flex-col items-center justify-center gap-3 py-10 text-center anim-rise"
    >
      {logo}
      {icon && (
        <IconWrapper accent="teal" className="h-12 w-12 rounded-xl">
          <span className="[&_svg]:h-6 [&_svg]:w-6">{icon}</span>
        </IconWrapper>
      )}
      <div className="font-display text-base font-medium">{title}</div>
      {body && <p className="max-w-sm text-xs text-muted-foreground">{body}</p>}
      {action}
    </Panel>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-teal",
        className,
      )}
    />
  );
}

export { BrandedSpinner } from "@/components/app/branded-spinner";

/**
 * GradientButton — teal→amber gradient with glow + lift on hover.
 */
export function GradientButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg btn-gradient px-3.5 py-1.5 text-sm shine",
        className,
      )}
    >
      {children}
    </button>
  );
}