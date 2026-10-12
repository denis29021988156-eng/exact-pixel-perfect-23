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
      <article className="surface relative flex min-w-0 flex-col overflow-hidden rounded-[26px] px-[18px] py-3.5">
        <span
          className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rounded-full"
          style={{ background: `radial-gradient(closest-side, ${sevGlow[d.severity]}, transparent)` }}
          aria-hidden
        />
        {/* Карточка говорит, что сделать; нажатие открывает сам сигнал. */}
        <button type="button" onClick={() => onOpenSignal(d.id)} className="relative block w-full text-left">
          <span className={cn("flex min-w-0 items-center gap-1.5 text-[13px] font-bold", sevInk[d.severity])}>
            <span className={cn("h-2 w-2 shrink-0 rounded-full", sevDot[d.severity])} aria-hidden />
            <span className="truncate">
              {severityLabel[d.severity]}
              {d.subtitle ? ` · ${d.subtitle}` : ""}
            </span>
          </span>
          <span className="mt-1 block text-[16.5px] font-[680] leading-[21px] tracking-[-0.01em]">
            {d.suggested_title || d.title}
          </span>
        </button>
        <div className="relative mt-auto pt-2.5">
          {d.executor ? (
            <Button
              block
              className="min-h-[44px] gap-x-1.5 gap-y-0 py-1.5 text-[15.5px] max-sm:flex-col sm:flex-wrap"
              loading={assign.pending}
              onClick={() => assign.run({ signalId: d.id })}
            >
              <span>Поручить: {d.executor.short_name}</span>
              <span className="text-[13px] font-medium opacity-85">
                <span className="max-sm:hidden">· </span>
                {due ? fmtDueShort(due, today) : "через 3 дня"}
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
    <article className="surface flex min-w-0 flex-col rounded-[26px] px-[18px] py-3.5">
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
      <h3 className="mt-2.5 text-[16.5px] font-[680] leading-[21px] tracking-[-0.01em]">
        <button type="button" onClick={onOpenAgenda} className="text-left hover:underline">
          {d.title}
        </button>
      </h3>
      {d.expected_effect && <p className="mt-1 text-subhead text-ink-2">Зачем: {d.expected_effect}</p>}
      <div className="mt-auto flex gap-2 pt-3">
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
