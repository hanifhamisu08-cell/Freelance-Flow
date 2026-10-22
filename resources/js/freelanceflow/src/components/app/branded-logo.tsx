"use client";

import { cn } from "@/lib/utils";

type BrandedLogoVariant = "icon" | "full" | "wordmark" | "icon-pulse";

interface BrandedLogoProps {
  variant?: BrandedLogoVariant;
  size?: number;
  height?: number;
  className?: string;
}

/**
 * BrandedLogo
 *
 * The mark (/logo-icon.png) is a transparent PNG and works on any
 * background/theme as-is. The wordmark + tagline are real text (not
 * baked into a raster) so they never clip, always match the current
 * theme's colors, and scale cleanly to any size.
 */
export function BrandedLogo({
  variant = "full",
  size,
  height,
  className,
}: BrandedLogoProps) {
  if (variant === "icon") {
    const s = size ?? 28;
    return (
      <img
        src="/logo-icon.png"
        alt="FreelanceFlow"
        aria-label="FreelanceFlow"
        draggable={false}
        width={s}
        height={s}
        className={cn("inline-block", className)}
        style={{ width: s, height: s }}
      />
    );
  }

  if (variant === "icon-pulse") {
    const s = size ?? 40;
    return (
      <img
        src="/logo-icon.png"
        alt="FreelanceFlow"
        aria-label="FreelanceFlow"
        draggable={false}
        width={s}
        height={s}
        className={cn("inline-block", className)}
        style={{ width: s, height: s, animation: "brandedPulse 2s ease-in-out infinite" }}
      />
    );
  }

  if (variant === "wordmark") {
    return <Wordmark height={height ?? 20} className={className} />;
  }

  // variant === "full" — icon + wordmark + tagline lockup
  return <FullLogo height={height ?? 36} className={className} />;
}

function Wordmark({ height, className }: { height: number; className?: string }) {
  return (
    <span
      className={cn("font-display font-bold leading-none whitespace-nowrap", className)}
      style={{ fontSize: height }}
    >
      Freelance<span className="text-teal">Flow</span>
    </span>
  );
}

function FullLogo({ height, className }: { height: number; className?: string }) {
  const wordmarkSize = Math.round(height * 0.54);
  const taglineSize = Math.max(7, Math.round(height * 0.22));

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ gap: Math.round(height * 0.22) }}
    >
      <img
        src="/logo-icon.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ height, width: "auto" }}
        className="inline-block shrink-0"
      />
      <span className="flex flex-col leading-none">
        <span
          className="font-display font-bold leading-none whitespace-nowrap"
          style={{ fontSize: wordmarkSize }}
        >
          Freelance<span className="text-teal">Flow</span>
        </span>
        <span
          className="whitespace-nowrap font-mono uppercase text-muted-foreground"
          style={{ fontSize: taglineSize, letterSpacing: "0.16em", marginTop: Math.round(height * 0.08) }}
        >
          Track. Analyze. Automate. <span className="text-teal">Grow.</span>
        </span>
      </span>
    </span>
  );
}
