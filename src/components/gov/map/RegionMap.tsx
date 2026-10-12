import { memo, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { fmtWhen, plural, severityLabel } from "@/lib/format";
import type { Severity, Signal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DOTS, MAP_H, MAP_W, OUTLINE, PLACES, type Place } from "./tverGeo";

const sevColor: Record<Severity, string> = {
  critical: "hsl(var(--critical))",
  high: "hsl(var(--warning))",
  medium: "hsl(var(--primary))",
};
const sevInk: Record<Severity, string> = {
  critical: "text-critical-ink",
  high: "text-warning-ink",
  medium: "text-tint",
};
const sevRank: Record<Severity, number> = { critical: 3, high: 2, medium: 1 };
/** Как далеко «растекается» сигнал по точкам карты, в единицах карты. */
const reach: Record<Severity, number> = { critical: 74, high: 54, medium: 44 };

export interface MapSpot {
  key: string;
  place: Place;
  severity: Severity;
  signals: Signal[];
}

const bySeverity = (a: Signal, b: Signal) =>
  sevRank[b.severity] - sevRank[a.severity] || b.detected_at.localeCompare(a.detected_at);

/** Сигналы по округам: где горит и насколько остро. Сигналы без известного округа на карту не попадают. */
export function spotsFromSignals(signals: Signal[]): MapSpot[] {
  const groups = new Map<string, Signal[]>();
  for (const s of signals) {
    const name = s.municipality?.name;
    if (!name || !PLACES[name]) continue;
    groups.set(name, [...(groups.get(name) ?? []), s]);
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort(bySeverity);
      return { key, place: PLACES[key], severity: sorted[0].severity, signals: sorted };
    })
    .sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
}

interface RegionMapProps {
  title: string;
  signals: Signal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  /** Виджет поверх карты в свободном северо-западном углу (на узкой карте — под ней). */
  renderOverlay?: (placement: "over" | "below") => ReactNode;
  className?: string;
}

/**
 * «Пульс области»: точки области окрашиваются вокруг округов с открытыми сигналами.
 * Нажатие на округ показывает его главный сигнал внизу карты, повторное — открывает сигнал.
 */
export function RegionMap({ title, signals, selectedId, onSelect, onOpen, renderOverlay, className }: RegionMapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spots = useMemo(() => spotsFromSignals(signals), [signals]);
  const counts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0 };
    for (const s of signals) c[s.severity] += 1;
    return c;
  }, [signals]);

  // Широкая карта: виджет ложится на пустой северо-запад, для него слева добавляем поле.
  const wide = width >= 560 && Boolean(renderOverlay);
  const padL = wide ? 46 : 0;
  const vbW = MAP_W + padL;
  const scale = width > 0 ? width / vbW : 1;
  const px = (v: number) => v / scale;
  // Свободный угол карты — до x ≈ 205 при y < 200 (в единицах карты).
  const overlayWidth = Math.min(256, Math.round((padL + 204) * scale) - 8);

  const dots = useMemo(() => paintDots(spots), [spots]);
  const selected = signals.find((s) => s.id === selectedId) ?? null;
  const selectedKey = selected?.municipality?.name ?? null;
  const minRank = width >= 640 ? 3 : width >= 460 ? 2 : 1;
  const labels = useMemo(
    () => placeLabels(spots, scale, minRank, padL, width < 460),
    [spots, scale, minRank, padL, width],
  );

  const activate = (spot: MapSpot) => {
    const top = spot.signals[0];
    if (spot.key === selectedKey && selected) onOpen(selected.id);
    else onSelect(top.id);
  };
  const onKey = (e: KeyboardEvent, spot: MapSpot) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(spot);
    }
  };

  return (
    <section className={cn("glass relative overflow-hidden rounded-panel", className)} aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 pb-1 pt-4 md:px-6 md:pt-5">
        <h2 className="text-title3">{title}</h2>
        <ul
          className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-ink-2"
          aria-label="Открытые сигналы"
        >
          {(["critical", "high", "medium"] as const).map((sev) =>
            counts[sev] ? (
              <li key={sev} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: sevColor[sev] }} aria-hidden />
                {severityLabel[sev]}
                <span className="font-semibold tabular-nums text-foreground">{counts[sev]}</span>
              </li>
            ) : null,
          )}
          {!signals.length && <li>Открытых сигналов нет</li>}
        </ul>
      </header>

      <div ref={boxRef} className="relative mx-3 md:mx-4">
        {width > 0 && (
          <svg
            viewBox={`${-padL} 0 ${vbW} ${MAP_H}`}
            width={width}
            height={(MAP_H * width) / vbW}
            className="block"
            role="img"
            aria-label={`Карта: ${spots.map((s) => s.place.label).join(", ") || "сигналов нет"}`}
          >
            <path d={OUTLINE} style={{ fill: "var(--map-land)", stroke: "var(--map-edge)" }} strokeWidth={px(1.1)} />

            <DotsLayer dots={dots} />

            {/* Города без сигналов — для ориентира. */}
            {labels.towns.map((l) => (
              <g key={l.key} aria-hidden>
                <circle cx={PLACES[l.key].x} cy={PLACES[l.key].y} r={px(2.4)} style={{ fill: "hsl(var(--ink-3))" }} />
                {l.text && <MapText label={l} />}
              </g>
            ))}

            {spots.map((spot) => {
              const c = sevColor[spot.severity];
              const isSel = spot.key === selectedKey;
              const n = spot.signals.length;
              return (
                <g
                  key={spot.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${spot.place.label}: ${severityLabel[spot.severity].toLowerCase()}, ${n} ${plural(n, "сигнал", "сигнала", "сигналов")}${isSel ? ". Нажмите ещё раз, чтобы открыть" : ""}`}
                  aria-pressed={isSel}
                  className="cursor-pointer outline-none [&:focus-visible_.focus-ring]:opacity-100"
                  onClick={() => activate(spot)}
                  onKeyDown={(e) => onKey(e, spot)}
                >
                  {spot.severity === "critical" && (
                    <circle
                      cx={spot.place.x}
                      cy={spot.place.y}
                      r={px(12)}
                      className="animate-map-ping"
                      style={{ fill: c, transformBox: "fill-box", transformOrigin: "center" }}
                    />
                  )}
                  <circle cx={spot.place.x} cy={spot.place.y} r={px(22)} style={{ fill: c }} fillOpacity={0.1} />
                  <circle cx={spot.place.x} cy={spot.place.y} r={px(13)} style={{ fill: c }} fillOpacity={0.18} />
                  <circle
                    className="focus-ring opacity-0"
                    cx={spot.place.x}
                    cy={spot.place.y}
                    r={px(16)}
                    style={{ fill: "none", stroke: "hsl(var(--primary))" }}
                    strokeWidth={px(2)}
                  />
                  {isSel && (
                    <circle
                      cx={spot.place.x}
                      cy={spot.place.y}
                      r={px(12)}
                      style={{ fill: "none", stroke: c }}
                      strokeWidth={px(2.2)}
                    />
                  )}
                  <circle
                    cx={spot.place.x}
                    cy={spot.place.y}
                    r={px(isSel ? 7.5 : 6.5)}
                    style={{ fill: c, stroke: "var(--map-ring)" }}
                    strokeWidth={px(2.5)}
                  />
                  {n > 1 && (
                    <text
                      x={spot.place.x}
                      y={spot.place.y + px(3.6)}
                      textAnchor="middle"
                      fontSize={px(9.5)}
                      fontWeight={800}
                      style={{ fill: "#fff" }}
                    >
                      {n}
                    </text>
                  )}
                  {labels.spots[spot.key] && <MapText label={labels.spots[spot.key]!} />}
                  <circle cx={spot.place.x} cy={spot.place.y} r={px(22)} fill="transparent" />
                </g>
              );
            })}
          </svg>
        )}
        {!width && <div style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }} aria-hidden />}

        {renderOverlay && wide && (
          <div className="absolute left-2 top-1" style={{ width: overlayWidth }}>
            {renderOverlay("over")}
          </div>
        )}
      </div>

      {renderOverlay && !wide && width > 0 && <div className="px-3 pt-2 md:px-4">{renderOverlay("below")}</div>}

      <div className="p-3 md:px-4 md:pb-4">
        {selected ? (
          <button
            type="button"
            onClick={() => onOpen(selected.id)}
            className="tap-row flex w-full items-center gap-3 rounded-[20px] border border-[var(--inner-edge)] bg-[var(--inner)] px-4 py-3 text-left"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: sevColor[selected.severity] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-baseline gap-2 text-footnote">
                <span className={cn("shrink-0 font-semibold", sevInk[selected.severity])}>
                  {severityLabel[selected.severity]}
                </span>
                <span className="truncate text-ink-2">
                  {[selected.municipality?.name, fmtWhen(selected.detected_at)].filter(Boolean).join(", ")}
                </span>
              </span>
              <span className="mt-0.5 line-clamp-2 text-headline">{selected.title}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" aria-hidden />
          </button>
        ) : (
          <p className="px-2 py-2 text-subhead text-ink-2">Нажмите на округ, чтобы увидеть сигнал.</p>
        )}
      </div>
    </section>
  );
}

interface PlacedLabel {
  key: string;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "end" | "middle";
  size: number;
  weight: number;
  tone: string;
}

function MapText({ label }: { label: PlacedLabel }) {
  return (
    <text
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      fontSize={label.size}
      fontWeight={label.weight}
      style={{ fill: label.tone, stroke: "var(--map-halo)", paintOrder: "stroke" }}
      strokeWidth={label.size * 0.28}
      strokeLinejoin="round"
    >
      {label.text}
    </text>
  );
}

type Box = [number, number, number, number];
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/**
 * Подписи без наложений: сначала округа с сигналами (острые — первыми), потом города для ориентира.
 * Каждой подписи пробуем свою сторону, затем остальные; не влезла — не подписываем.
 */
function placeLabels(spots: MapSpot[], scale: number, minRank: number, padL: number, compact: boolean) {
  const u = (v: number) => v / scale;
  const placed: Box[] = [];
  // Сами точки округов — тоже препятствия для подписей.
  const markers: { key: string; box: Box }[] = spots.map((s) => ({
    key: s.key,
    box: [s.place.x - u(9), s.place.y - u(9), s.place.x + u(9), s.place.y + u(9)],
  }));

  const tryPlace = (key: string, place: Place, size: number, gap: number, weight: number, tone: string) => {
    const est = place.label.length * size * (weight >= 700 ? 0.62 : 0.56);
    const order = [place.side, "r", "l", "b"].filter((v, i, a) => a.indexOf(v) === i) as Place["side"][];
    for (const side of order) {
      const base = side === "b" ? place.y + gap + size * 0.9 : place.y + size * 0.35;
      const x = side === "r" ? place.x + gap : side === "l" ? place.x - gap : place.x;
      const x1 = side === "r" ? x : side === "l" ? x - est : x - est / 2;
      const box: Box = [x1 - u(2), base - size * 0.82, x1 + est + u(2), base + size * 0.24];
      const inside = box[0] >= -padL + 2 && box[2] <= MAP_W - 2 && box[1] >= 2 && box[3] <= MAP_H - 2;
      if (!inside) continue;
      if (placed.some((b) => overlaps(b, box))) continue;
      if (markers.some((m) => m.key !== key && overlaps(m.box, box))) continue;
      placed.push(box);
      const anchor = side === "r" ? "start" : side === "l" ? "end" : "middle";
      return { key, text: place.label, x, y: base, anchor, size, weight, tone } as PlacedLabel;
    }
    return null;
  };

  const spotLabels: Record<string, PlacedLabel | null> = {};
  for (const s of [...spots].sort((a, b) => sevRank[b.severity] - sevRank[a.severity])) {
    spotLabels[s.key] = tryPlace(s.key, s.place, u(compact ? 12 : 13.5), u(12), 700, "hsl(var(--foreground))");
  }

  const spotKeys = new Set(spots.map((s) => s.key));
  const towns: PlacedLabel[] = [];
  for (const [key, p] of Object.entries(PLACES).sort((a, b) => a[1].rank - b[1].rank)) {
    if (p.rank === 0 || p.rank > minRank || spotKeys.has(key)) continue;
    const l = tryPlace(key, p, u(compact ? 10.5 : 11), u(7), 500, "hsl(var(--ink-3))");
    towns.push(l ?? { key, text: "", x: p.x, y: p.y, anchor: "start", size: 0, weight: 500, tone: "" });
  }
  return { spots: spotLabels, towns };
}

/** Сетка точек: около 1700 кружков, перерисовываются только при смене сигналов. */
const DotsLayer = memo(function DotsLayer({ dots }: { dots: Dot[] }) {
  return (
    <g aria-hidden>
      {dots.map((d, i) =>
        d.color ? (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            className="animate-dot-bloom"
            style={{
              fill: d.color,
              transformBox: "fill-box",
              transformOrigin: "center",
              animationDelay: `${d.delay ?? 0}ms`,
            }}
            fillOpacity={d.opacity}
          />
        ) : (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} style={{ fill: "var(--map-dot)" }} />
        ),
      )}
    </g>
  );
});

interface Dot {
  x: number;
  y: number;
  r: number;
  color?: string;
  opacity?: number;
  delay?: number;
}

/** Точки сетки: рядом с сигналом — цвета сигнала и крупнее, чем ближе к центру округа. */
function paintDots(spots: MapSpot[]): Dot[] {
  const out: Dot[] = [];
  for (let i = 0; i < DOTS.length; i += 2) {
    const x = DOTS[i];
    const y = DOTS[i + 1];
    let best: MapSpot | null = null;
    let bestT = 0;
    for (const s of spots) {
      const t = 1 - Math.hypot(s.place.x - x, s.place.y - y) / reach[s.severity];
      if (t > bestT) {
        bestT = t;
        best = s;
      }
    }
    if (best) {
      out.push({
        x,
        y,
        r: +(1.6 + 1.7 * bestT).toFixed(2),
        color: sevColor[best.severity],
        opacity: +(0.25 + 0.65 * bestT).toFixed(2),
        // Сначала загораются точки у центра округа, затем волна расходится.
        delay: Math.round(120 + (1 - bestT) * 620),
      });
    } else {
      out.push({ x, y, r: 1.6 });
    }
  }
  return out;
}
