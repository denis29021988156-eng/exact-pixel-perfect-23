import { ChevronRight } from "lucide-react";
import { capitalize, fmtNum, fmtRelDay, mskToday } from "@/lib/format";
import type { TrustSummary } from "@/lib/types";
import { Delta } from "./TrustSheet";
import { TrustChart } from "./TrustChart";
import { trustEventColor } from "./tones";

/** Индекс доверия: значение, изменение и мини-график за 30 дней с событиями. */
export function TrustCard({ trust, onOpen }: { trust: TrustSummary | null; onOpen: () => void }) {
  const today = mskToday();
  if (!trust) {
    return (
      <section className="surface p-5" aria-label="Индекс доверия">
        <p className="text-footnote font-semibold uppercase tracking-wide text-ink-2">Индекс доверия</p>
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
        <span className="text-footnote font-semibold uppercase tracking-wide text-ink-2">Индекс доверия</span>
        <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden />
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="text-[44px] font-bold leading-none tracking-tight tabular-nums">
          {fmtNum(Number(trust.value))}
        </span>
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
