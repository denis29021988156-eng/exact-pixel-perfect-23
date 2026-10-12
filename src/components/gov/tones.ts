// Цвета и оттенки для статусов, каналов и событий.

import { Handshake, MapPin, Megaphone, Newspaper, type LucideIcon } from "lucide-react";
import type { Tone } from "@/components/ios/Badge";
import type { AgendaChannel, Severity, TrustEventKind, TrustPoint } from "@/lib/types";

export const severityTone: Record<Severity, Tone> = {
  critical: "critical",
  high: "warning",
  medium: "tint",
};

export const severityBar: Record<Severity, string> = {
  critical: "bg-critical",
  high: "bg-warning",
  medium: "bg-tint",
};

export const channelMeta: Record<AgendaChannel, { icon: LucideIcon; tone: Tone; bg: string; fg: string }> = {
  media: { icon: Newspaper, tone: "tint", bg: "bg-tint/12", fg: "text-tint" },
  pr: { icon: Megaphone, tone: "ai", bg: "bg-ai/12", fg: "text-ai-ink" },
  gr: { icon: Handshake, tone: "good", bg: "bg-good/14", fg: "text-good-ink" },
  event: { icon: MapPin, tone: "warning", bg: "bg-warning/14", fg: "text-warning-ink" },
};

/** Цвет отметки события на графике индекса. */
export const trustEventColor: Record<TrustEventKind, string> = {
  incident: "hsl(var(--critical))",
  project: "hsl(var(--good))",
  event: "hsl(var(--warning))",
  media: "hsl(var(--primary))",
  pr: "hsl(var(--ai))",
};

/** Цвет доли поручений в срок. */
export function onTimeTone(rate: number): string {
  if (rate >= 80) return "text-good-ink";
  if (rate >= 50) return "text-warning-ink";
  return "text-critical-ink";
}

/** Как событие сдвинуло индекс: от дня до события до трёх дней после. */
export function eventImpact(series: TrustPoint[], index: number): number | null {
  const before = series[index - 1];
  const after = series[Math.min(series.length - 1, index + 3)];
  if (!before || !after || after.day === before.day) return null;
  return Math.round((Number(after.value) - Number(before.value)) * 10) / 10;
}
