import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { capitalize, fmtNum, fmtRelDay, mskToday } from "@/lib/format";
import type { TrustPoint, TrustSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Delta } from "./TrustSheet";
import { TrustChart } from "./TrustChart";
import { trustEventColor } from "./tones";

/** Индекс доверия: значение, изменение и мини-график за 30 дней с событиями. */
export function TrustCard({ trust, onOpen }: { trust: TrustSummary | null; onOpen: () => void }) {
  const today = mskToday();
  if (!trust) {
    return (
      <section className="surface p-5" aria-label="Индекс доверия">
        <p className="text-[15px] font-semibold text-ink-2">Индекс доверия</p>
        <p className="mt-2 text-subhead text-ink-2">Данных пока нет.</p>
      </section>
    );
  }
  const series = trust.series ?? [];
  const lastEvent = [...series].reverse().find((p) => p.event_label && p.event_kind);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="surface press block w-full p-5 text-left"
      aria-label={`Индекс доверия ${fmtNum(Number(trust.value))}. Подробнее`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink-2">Индекс доверия</span>
        <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden />
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="num-rounded text-[48px] font-extrabold leading-none">{fmtNum(Number(trust.value))}</span>
        <span className="pb-1 text-subhead leading-[20px]">
          <Delta value={trust.delta_day} /> <span className="text-ink-2">за сутки</span>
          <br />
          <Delta value={trust.delta_week} /> <span className="text-ink-2">за неделю</span>
        </span>
      </div>
      <TrustChart points={series} compact height={84} className="mt-3" ariaLabel="График индекса за 30 дней" />
      {lastEvent && (
        <p className="mt-2 flex items-center gap-2 text-footnote text-ink-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: trustEventColor[lastEvent.event_kind!] }}
            aria-hidden
          />
          <span className="truncate">
            {capitalize(fmtRelDay(lastEvent.day, today))}: {lastEvent.event_label}
          </span>
        </p>
      )}
    </button>
  );
}

/**
 * Индекс доверия «одним взглядом» — виджет на карте области.
 * В углу карты — столбиком, под картой на узком экране — строкой.
 */
export function TrustGlance({
  trust,
  onOpen,
  layout = "stack",
}: {
  trust: TrustSummary | null;
  onOpen: () => void;
  layout?: "stack" | "row";
}) {
  if (!trust) return null;
  const value = fmtNum(Number(trust.value));
  const series = (trust.series ?? []).slice(-30);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "glass press w-full rounded-[24px] p-3.5 text-left",
        layout === "row" ? "flex items-center gap-4 px-4" : "block",
      )}
      aria-label={`Индекс доверия ${value}. Подробнее`}
    >
      <span className="block shrink-0">
        <span className="block text-[13px] font-semibold text-ink-2">Индекс доверия</span>
        <span className="mt-0.5 flex items-end gap-3">
          <span className="num-rounded text-[42px] font-extrabold leading-[44px]">{value}</span>
          <span className="whitespace-nowrap pb-[3px] text-[13px] leading-[17px]">
            <Delta value={trust.delta_day} /> <span className="text-ink-2">за сутки</span>
            <br />
            <Delta value={trust.delta_week} /> <span className="text-ink-2">за неделю</span>
          </span>
        </span>
      </span>
      <Sparkline
        points={series}
        className={cn("block", layout === "row" ? "h-12 min-w-0 flex-1" : "mt-2 h-9 w-full")}
      />
    </button>
  );
}

/** Линия индекса за месяц: заливка, отметки происшествий и проектов, точка «сегодня». */
function Sparkline({ points, className }: { points: TrustPoint[]; className?: string }) {
  const gid = useId().replace(/:/g, "");
  if (points.length < 2) return <span className={className} aria-hidden />;
  const vals = points.map((p) => Number(p.value));
  const min = Math.min(...vals) - 0.3;
  const max = Math.max(...vals) + 0.3;
  const W = 200;
  const H = 40;
  const xy = vals.map(
    (v, i) => [3 + (i / (vals.length - 1)) * (W - 8), 3 + ((max - v) / (max - min)) * (H - 8)] as const,
  );
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  const marks = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.event_kind === "incident" || p.event_kind === "project");
  // Точки — отдельными элементами поверх линии, чтобы не растягивались вместе с графиком.
  const at = (i: number) => ({ left: `${(xy[i][0] / W) * 100}%`, top: `${(xy[i][1] / H) * 100}%` });

  return (
    <span className={cn("relative", className)} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.28 }} />
            <stop offset="1" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={`${d} L${last[0]} ${H} L3 ${H} Z`} style={{ fill: `url(#${gid})` }} />
        <path
          d={d}
          style={{ fill: "none", stroke: "hsl(var(--primary))" }}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {marks.map(({ p, i }) => (
        <span
          key={p.day}
          className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ ...at(i), background: trustEventColor[p.event_kind!] }}
        />
      ))}
      <span
        className="absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--map-ring)] bg-tint"
        style={at(xy.length - 1)}
      />
    </span>
  );
}
