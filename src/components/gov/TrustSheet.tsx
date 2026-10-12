import { useMemo, useState } from "react";
import { Segmented } from "@/components/ios/Segmented";
import { Sheet } from "@/components/ios/Sheet";
import { ErrorState, Skeleton } from "@/components/ios/States";
import { fmtDay, fmtDelta, fmtNum, mskToday, trustComponentLabel, trustEventLabel } from "@/lib/format";
import { useAgenda } from "@/lib/queries";
import type { TrustComponents } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eventImpact, trustEventColor } from "./tones";
import { TrustChart } from "./TrustChart";

const WEIGHTS: Record<keyof TrustComponents, number> = {
  media_tone: 35,
  appeals_resolved: 25,
  response_speed: 20,
  survey: 20,
};

export function TrustSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const q = useAgenda();
  const [range, setRange] = useState<"30" | "120">("120");
  const today = mskToday();

  const series = useMemo(() => q.data?.trust ?? [], [q.data]);
  const shown = range === "30" ? series.slice(-30) : series;
  const events = useMemo(
    () =>
      series
        .map((p, i) => ({ p, impact: eventImpact(series, i) }))
        .filter((x) => x.p.event_label && x.p.event_kind)
        .reverse(),
    [series],
  );
  const summary = q.data?.trust_summary;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()} title="Индекс доверия" size="lg">
      {q.error ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <div className="space-y-4 pt-2">
          <Skeleton className="h-16 w-40" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <div className="space-y-5 pt-1">
          {summary && (
            <div className="flex flex-wrap items-end gap-x-5 gap-y-1">
              <div className="text-[48px] font-bold leading-none tracking-tight tabular-nums">
                {fmtNum(Number(summary.value))}
              </div>
              <div className="pb-1 text-subhead">
                <Delta value={summary.delta_day} /> за сутки · <Delta value={summary.delta_week} /> за неделю
              </div>
            </div>
          )}

          <div className="surface p-3 pt-4">
            <div className="mb-2 flex justify-end">
              <Segmented
                value={range}
                onChange={setRange}
                className="md:min-w-0 md:w-[240px]"
                ariaLabel="Период"
                options={[
                  { value: "30", label: "Месяц" },
                  { value: "120", label: "4 месяца" },
                ]}
              />
            </div>
            <TrustChart points={shown} height={240} />
            <Legend />
          </div>

          {summary && (
            <section>
              <h3 className="section-title">Из чего складывается</h3>
              <div className="surface space-y-3 p-4">
                {(Object.keys(WEIGHTS) as (keyof TrustComponents)[]).map((k) => {
                  const v = summary.components[k];
                  return (
                    <div key={k}>
                      <div className="flex items-baseline justify-between gap-3 text-subhead">
                        <span>
                          {trustComponentLabel[k]} <span className="text-ink-3">· {WEIGHTS[k]}%</span>
                        </span>
                        <span className="font-semibold tabular-nums">{fmtNum(v === null ? null : Number(v))}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill">
                        <div
                          className="h-full rounded-full bg-tint"
                          style={{ width: `${Math.max(0, Math.min(100, Number(v ?? 0)))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section>
              <h3 className="section-title">События и их влияние</h3>
              <ul className="surface rows overflow-hidden">
                {events.map(({ p, impact }) => (
                  <li key={p.day} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: trustEventColor[p.event_kind!] }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] leading-[21px]">{p.event_label}</span>
                      <span className="block text-footnote text-ink-2">
                        {trustEventLabel[p.event_kind!]} · {fmtDay(p.day, today)}
                      </span>
                    </span>
                    {impact !== null && (
                      <span
                        className={cn(
                          "shrink-0 text-callout font-semibold tabular-nums",
                          impact > 0 ? "text-good-ink" : impact < 0 ? "text-critical-ink" : "text-ink-2",
                        )}
                        aria-label={`Изменение индекса ${fmtDelta(impact)}`}
                      >
                        {fmtDelta(impact)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="px-4 pt-2 text-footnote text-ink-2">Изменение индекса за три дня после события.</p>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}

export function Delta({ value }: { value: number | null | undefined }) {
  const v = value === null || value === undefined ? null : Number(value);
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        v === null ? "text-ink-2" : v > 0 ? "text-good-ink" : v < 0 ? "text-critical-ink" : "text-ink-2",
      )}
    >
      {fmtDelta(v)}
    </span>
  );
}

export function Legend() {
  const items: { kind: keyof typeof trustEventColor; label: string }[] = [
    { kind: "event", label: "Мероприятие" },
    { kind: "project", label: "Проект" },
    { kind: "media", label: "СМИ" },
    { kind: "pr", label: "PR" },
    { kind: "incident", label: "Происшествие" },
  ];
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-caption text-ink-2">
      {items.map((i) => (
        <span key={i.kind} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: trustEventColor[i.kind] }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  );
}
