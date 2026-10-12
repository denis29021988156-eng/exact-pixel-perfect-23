import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ios/Button";
import { channelLabel, fmtDueShort, fmtRelDay, fmtWeekdayShort, mskToday, severityLabel } from "@/lib/format";
import type { Decision } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAgendaFlow, useAssignFlow } from "./actions";
import { ChannelIcon } from "./meta";
import { severityBar } from "./tones";

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
      <article className="surface relative flex min-w-0 flex-col overflow-hidden p-5 pl-6">
        <span className={cn("absolute inset-y-0 left-0 w-1.5", severityBar[d.severity])} aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-footnote text-ink-2">
            <span
              className={cn(
                "font-semibold",
                d.severity === "critical"
                  ? "text-critical-ink"
                  : d.severity === "high"
                    ? "text-warning-ink"
                    : "text-tint",
              )}
            >
              {severityLabel[d.severity]}
            </span>
            {d.subtitle ? ` · ${d.subtitle}` : ""}
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
        <h3 className="mt-1 text-headline">
          <button type="button" onClick={() => onOpenSignal(d.id)} className="text-left">
            {d.title}
          </button>
        </h3>
        {d.recommendation && (
          <p className="mt-2 flex gap-2 text-subhead text-ink-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ai" aria-hidden />
            <span>{d.recommendation}</span>
          </p>
        )}
        <div className="mt-auto pt-4">
          {d.executor ? (
            <Button
              block
              className="flex-col gap-0 py-1.5"
              loading={assign.pending}
              onClick={() => assign.run({ signalId: d.id })}
            >
              <span>Поручить: {d.executor.short_name}</span>
              <span className="text-[12px] font-medium opacity-85">
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
          <span className="font-semibold text-foreground">Повестка · {channelLabel[d.channel]}</span>
          <br />
          {when === "сегодня" || when === "завтра" || when === "послезавтра"
            ? when
            : `${fmtWeekdayShort(d.day)}, ${when}`}
          {d.subtitle ? ` · ${d.subtitle}` : ""}
        </p>
      </div>
      <h3 className="mt-3 text-headline">
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
