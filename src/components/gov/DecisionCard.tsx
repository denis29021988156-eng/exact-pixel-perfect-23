import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ios/Button";
import { channelLabel, fmtDueShort, fmtRelDay, fmtWeekdayShort, mskToday, severityLabel } from "@/lib/format";
import type { Decision, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAgendaFlow, useAssignFlow } from "./actions";
import { ChannelIcon } from "./meta";

const sevDot: Record<Severity, string> = { critical: "bg-critical", high: "bg-warning", medium: "bg-tint" };
const sevInk: Record<Severity, string> = {
  critical: "text-critical-ink",
  high: "text-warning-ink",
  medium: "text-tint",
};
// Цветное свечение в углу карточки — насколько острый вопрос, видно издалека.
const sevGlow: Record<Severity, string> = {
  critical: "hsl(var(--critical) / 0.24)",
  high: "hsl(var(--warning) / 0.24)",
  medium: "hsl(var(--primary) / 0.18)",
};

/** Вопрос, который ждёт решения: сигнал с готовым поручением или пункт повестки. */
export function DecisionCard({
  d,
  onOpenSignal,
  onOpenAgenda,
}: {
  d: Decision;
  onOpenSignal: (id: string) => void;
  onOpenAgenda: () => void;
}) {
  const today = mskToday();
  const assign = useAssignFlow();
  const agenda = useAgendaFlow();

  if (d.type === "signal") {
    const due = d.due && d.due >= today ? d.due : null;
    return (
      <article className="surface relative flex min-w-0 flex-col overflow-hidden p-5">
        <span
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(closest-side, ${sevGlow[d.severity]}, transparent)` }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 pt-0.5 text-footnote">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", sevDot[d.severity])} aria-hidden />
            <span className={cn("shrink-0 font-semibold", sevInk[d.severity])}>{severityLabel[d.severity]}</span>
            {d.subtitle && <span className="truncate text-ink-2">{d.subtitle}</span>}
          </p>
          <button
            type="button"
            onClick={() => onOpenSignal(d.id)}
            className="press -mr-1 -mt-1 inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[14px] font-semibold text-tint"
          >
            Подробнее
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <h3 className="relative mt-1.5 text-[18px] font-semibold leading-[23px] tracking-[-0.01em]">
          <button type="button" onClick={() => onOpenSignal(d.id)} className="text-left">
            {d.title}
          </button>
        </h3>
        {d.recommendation && (
          <p className="relative mt-2 flex gap-2 text-subhead text-ink-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ai" aria-hidden />
            <span>{d.recommendation}</span>
          </p>
        )}
        <div className="relative mt-auto pt-4">
          {d.executor ? (
            <Button
              block
              className="min-h-[48px] flex-wrap gap-x-2 gap-y-0 py-2"
              loading={assign.pending}
              onClick={() => assign.run({ signalId: d.id })}
            >
              <span>Поручить: {d.executor.short_name}</span>
              <span className="text-[13px] font-medium opacity-80">
                {due ? `срок ${fmtDueShort(due, today)}` : "срок через 3 дня"}
              </span>
            </Button>
          ) : (
            <Button block variant="tinted" onClick={() => onOpenSignal(d.id)}>
              Выбрать исполнителя
            </Button>
          )}
        </div>
      </article>
    );
  }

  const when = fmtRelDay(d.day, today);
  return (
    <article className="surface flex min-w-0 flex-col p-5">
      <div className="flex items-center gap-3">
        <ChannelIcon channel={d.channel} />
        <p className="text-footnote text-ink-2">
          <span className="font-semibold text-foreground">Пункт повестки: {channelLabel[d.channel]}</span>
          <br />
          {when === "сегодня" || when === "завтра" || when === "послезавтра"
            ? when
            : `${fmtWeekdayShort(d.day)}, ${when}`}
          {d.subtitle ? ` · ${d.subtitle}` : ""}
        </p>
      </div>
      <h3 className="mt-3 text-[18px] font-semibold leading-[23px] tracking-[-0.01em]">
        <button type="button" onClick={onOpenAgenda} className="text-left hover:underline">
          {d.title}
        </button>
      </h3>
      {d.expected_effect && <p className="mt-1 text-subhead text-ink-2">Зачем: {d.expected_effect}</p>}
      <div className="mt-auto flex gap-2 pt-4">
        <Button
          className="flex-1"
          loading={agenda.pending && agenda.pendingId === d.id}
          disabled={agenda.pending}
          onClick={() => agenda.run(d.id, "approved")}
        >
          Согласовать
        </Button>
        <Button
          variant="gray"
          className="flex-1"
          disabled={agenda.pending}
          onClick={() => agenda.run(d.id, "returned")}
        >
          Вернуть
        </Button>
      </div>
    </article>
  );
}
