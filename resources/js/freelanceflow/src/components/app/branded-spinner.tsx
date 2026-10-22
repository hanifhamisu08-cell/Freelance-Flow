"use client";

import { cn } from "@/lib/utils";
import { BrandedLogo } from "@/components/app/branded-logo";

interface BrandedSpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function BrandedSpinner({
  size = 40,
  label,
  className,
}: BrandedSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <BrandedLogo variant="icon-pulse" size={size} />
      {label && (
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}