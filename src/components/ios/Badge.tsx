import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "critical" | "warning" | "good" | "ai" | "tint" | "gray";

const tones: Record<Tone, string> = {
  critical: "bg-critical/12 text-critical-ink",
  warning: "bg-warning/14 text-warning-ink",
  good: "bg-good/14 text-good-ink",
  ai: "bg-ai/12 text-ai-ink",
  tint: "bg-tint/12 text-tint",
  gray: "bg-fill text-ink-2",
};

/** Небольшая капсула со статусом. */
export function Badge({
  tone = "gray",
  children,
  className,
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] text-[12px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const dotTones: Record<Tone, string> = {
  critical: "bg-critical",
  warning: "bg-warning",
  good: "bg-good",
  ai: "bg-ai",
  tint: "bg-tint",
  gray: "bg-ink-3",
};

export function Dot({ tone = "gray", className, pulse }: { tone?: Tone; className?: string; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
        dotTones[tone],
        pulse && "animate-pulse-soft",
        className,
      )}
      aria-hidden
    />
  );
}

/** Числовой значок на вкладке. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-critical px-1 text-[11px] font-semibold leading-none text-white tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
