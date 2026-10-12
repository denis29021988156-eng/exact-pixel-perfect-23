import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { fmtDay, fmtDayShort, fmtNum, trustEventLabel } from "@/lib/format";
import type { TrustPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trustEventColor } from "./tones";

interface Props {
  points: TrustPoint[];
  height?: number;
  /** Мини-график без осей и подсказок. */
  compact?: boolean;
  className?: string;
  ariaLabel?: string;
}

/** График индекса доверия с отметками событий. Касание или курсор показывает значение дня. */
export function TrustChart({ points, height = 220, compact = false, className, ariaLabel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  // Ширину берём у контейнера; сам график не влияет на раскладку (позиционирован абсолютно).
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(120, Math.round(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = compact ? { l: 3, r: 8, t: 8, b: 8 } : { l: 36, r: 14, t: 14, b: 28 };
  const innerW = Math.max(10, width - pad.l - pad.r);
  const innerH = Math.max(10, height - pad.t - pad.b);

  const geo = useMemo(() => {
    const n = points.length;
    if (!n) return null;
    const vals = points.map((p) => Number(p.value));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const min = compact ? lo - 0.3 : Math.floor(lo - 0.4);
    const max = compact ? hi + 0.3 : Math.ceil(hi + 0.4);
    const span = Math.max(0.5, max - min);
    const x = (i: number) => pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = (v: number) => pad.t + ((max - v) / span) * innerH;
    const xy = vals.map((v, i) => [x(i), y(v)] as const);
    const line = xy.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
    const area = `${line} L${xy[n - 1][0].toFixed(1)} ${pad.t + innerH} L${xy[0][0].toFixed(1)} ${pad.t + innerH} Z`;
    const ticks = compact ? [] : [max, (max + min) / 2, min];
    return { n, min, max, x, y, xy, line, area, ticks };
  }, [points, compact, innerW, innerH, pad.l, pad.t]);

  if (!geo) {
    return (
      <div className={cn("flex items-center justify-center text-footnote text-ink-3", className)} style={{ height }}>
        Нет данных
      </div>
    );
  }

  const pickIndex = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = clientX - rect.left - pad.l;
    const i = Math.round((rel / innerW) * (geo.n - 1));
    setActive(Math.min(geo.n - 1, Math.max(0, i)));
  };

  const onPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (compact) return;
    pickIndex(e.clientX);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (compact) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const cur = active ?? geo.n - 1;
      setActive(Math.min(geo.n - 1, Math.max(0, cur + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  const last = points[points.length - 1];
  const a = active !== null ? points[active] : null;
  const ax = active !== null ? geo.xy[active][0] : 0;
  const ay = active !== null ? geo.xy[active][1] : 0;
  const tipLeft = Math.min(Math.max(ax, 80), width - 80);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative w-full min-w-0 select-none overflow-visible outline-none",
        !compact && "touch-pan-y",
        className,
      )}
      style={{ height }}
      tabIndex={compact ? -1 : 0}
      onKeyDown={onKey}
      role="img"
      aria-label={
        ariaLabel ??
        `Индекс доверия: ${fmtNum(Number(last.value))} на ${fmtDay(last.day)}. ` +
          `Событий на графике: ${points.filter((p) => p.event_label).length}.`
      }
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="absolute left-0 top-0 block overflow-visible"
          onPointerDown={onPointer}
          onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons ? onPointer(e) : undefined)}
          onPointerLeave={(e) => (e.pointerType === "mouse" ? setActive(null) : undefined)}
        >
          <defs>
            <linearGradient id={`area${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "hsl(var(--primary))", stopOpacity: compact ? 0.18 : 0.22 }} />
              <stop offset="1" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {geo.ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={pad.l + innerW}
                y1={geo.y(t)}
                y2={geo.y(t)}
                style={{ stroke: "hsl(var(--border))" }}
                strokeDasharray="2 4"
              />
              <text x={pad.l - 8} y={geo.y(t) + 4} textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                {fmtNum(t, Number.isInteger(t) ? 0 : 1)}
              </text>
            </g>
          ))}

          {!compact && (
            <g className="fill-ink-3 text-[11px]">
              <text x={pad.l} y={height - 8} textAnchor="start">
                {fmtDayShort(points[0].day)}
              </text>
              {geo.n > 20 && (
                <text x={geo.x(Math.floor((geo.n - 1) / 2))} y={height - 8} textAnchor="middle">
                  {fmtDayShort(points[Math.floor((geo.n - 1) / 2)].day)}
                </text>
              )}
              <text x={pad.l + innerW} y={height - 8} textAnchor="end">
                сегодня
              </text>
            </g>
          )}

          <path d={geo.area} fill={`url(#area${gid})`} />
          <path
            d={geo.line}
            fill="none"
            style={{ stroke: "hsl(var(--primary))" }}
            strokeWidth={compact ? 2.25 : 2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) =>
            p.event_kind ? (
              <circle
                key={p.day}
                cx={geo.xy[i][0]}
                cy={geo.xy[i][1]}
                r={compact ? 3.25 : 4.75}
                style={{ fill: trustEventColor[p.event_kind], stroke: "hsl(var(--card))" }}
                strokeWidth={compact ? 1.5 : 2}
              />
            ) : null,
          )}

          <circle
            cx={geo.xy[geo.n - 1][0]}
            cy={geo.xy[geo.n - 1][1]}
            r={compact ? 4 : 5.5}
            style={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--card))" }}
            strokeWidth="2"
          />

          {a && (
            <g pointerEvents="none">
              <line
                x1={ax}
                x2={ax}
                y1={pad.t}
                y2={pad.t + innerH}
                style={{ stroke: "hsl(var(--ink-3))" }}
                strokeWidth="1"
              />
              <circle
                cx={ax}
                cy={ay}
                r="6"
                style={{ fill: "hsl(var(--card))", stroke: "hsl(var(--primary))" }}
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>
      )}

      {a && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-max max-w-[220px] -translate-x-1/2 rounded-[10px] bg-elevated px-2.5 py-1.5 text-center shadow-float ring-1 ring-black/5 dark:ring-white/10"
          style={{ left: tipLeft }}
          role="status"
        >
          <div className="text-[12px] text-ink-2">{fmtDay(a.day)}</div>
          <div className="text-[15px] font-semibold tabular-nums">{fmtNum(Number(a.value))}</div>
          {a.event_label && a.event_kind && (
            <div
              className="mt-0.5 text-[12px] font-medium leading-tight"
              style={{ color: trustEventColor[a.event_kind] }}
            >
              {trustEventLabel[a.event_kind]}: {a.event_label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
