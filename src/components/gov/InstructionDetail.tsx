import { useEffect, useState } from "react";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FilePlus2,
  MessageSquare,
  Phone,
  Quote,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { DateInput, FieldRow, FieldStack, FormGroup, TextArea } from "@/components/ios/Form";
import { Row, Section } from "@/components/ios/List";
import { addDays, days, fmtDay, fmtDue, fmtWhen, instructionStatusLabel, mskDay, mskToday, plural } from "@/lib/format";
import { useCallReport, usePostpone, useRemind } from "@/lib/queries";
import type { Instruction, InstructionEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const eventIcon: Record<InstructionEvent["kind"], LucideIcon> = {
  created: FilePlus2,
  reminded: BellRing,
  postponed: CalendarClock,
  status: CheckCircle2,
  called: Phone,
  comment: MessageSquare,
};

function StatusBadge({ item, today }: { item: Instruction; today: string }) {
  if (item.status === "done") {
    return (
      <Badge tone={item.late ? "warning" : "good"}>{item.late ? "Выполнено с опозданием" : "Выполнено в срок"}</Badge>
    );
  }
  if (item.status === "cancelled") return <Badge tone="gray">Отменено</Badge>;
  if (item.overdue_days > 0) return <Badge tone="critical">Просрочено на {days(item.overdue_days)}</Badge>;
  const due = fmtDue(item.due_date, today);
  return <Badge tone={due.tone === "warning" ? "warning" : "tint"}>{instructionStatusLabel[item.status]}</Badge>;
}

export function InstructionDetail({ item, onOpenSignal }: { item: Instruction; onOpenSignal: (id: string) => void }) {
  const today = mskToday();
  const remind = useRemind();
  const postpone = usePostpone();
  const call = useCallReport();
  const [postponing, setPostponing] = useState(false);
  const [newDue, setNewDue] = useState(addDays(item.due_date > today ? item.due_date : today, 7));
  const [reason, setReason] = useState("");

  useEffect(() => {
    setPostponing(false);
    setReason("");
    setNewDue(addDays(item.due_date > today ? item.due_date : today, 7));
  }, [item.id, item.due_date, today]);

  const active = item.status === "new" || item.status === "in_progress";
  const due = fmtDue(item.due_date, today);
  // Подробности, которые повторяют заголовок или цитату обещания, не показываем.
  const showDetails =
    Boolean(item.details) &&
    item.details!.trim() !== item.title.trim() &&
    !(item.promise && item.details!.trim().startsWith("Обещание"));

  const doRemind = () =>
    remind.mutate(item.id, {
      onSuccess: () => toast.success(`Напоминание отправлено: ${item.executor?.short_name ?? "исполнителю"}`),
    });

  const doCall = () =>
    call.mutate(item.id, {
      onSuccess: () => toast.success(`${item.executor?.short_name ?? "Исполнитель"}: вызван на доклад`),
    });

  const doPostpone = () =>
    postpone.mutate(
      { id: item.id, due: newDue, note: reason.trim() || null },
      {
        onSuccess: () => {
          setPostponing(false);
          toast.success(`Срок перенесён на ${fmtDay(newDue, today)}`);
        },
      },
    );

  return (
    <article className="space-y-5">
      <header className="pt-1">
        <StatusBadge item={item} today={today} />
        <h2 className="mt-2 text-title2 text-balance">{item.title}</h2>
      </header>

      {active && (
        <section aria-label="Действия" className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <ActionTile icon={BellRing} label="Напомнить" onClick={doRemind} busy={remind.isPending} />
            <ActionTile
              icon={CalendarClock}
              label="Перенести"
              onClick={() => setPostponing((v) => !v)}
              active={postponing}
            />
            <ActionTile icon={Phone} label="На доклад" onClick={doCall} busy={call.isPending} />
          </div>

          {postponing && (
            <div className="space-y-3">
              <FormGroup title="Новый срок">
                <FieldRow label="Срок" htmlFor={`pd-${item.id}`}>
                  <DateInput
                    id={`pd-${item.id}`}
                    value={newDue}
                    min={addDays(today, 1)}
                    onChange={(e) => setNewDue(e.target.value)}
                  />
                </FieldRow>
                <FieldStack label="Причина" htmlFor={`pr-${item.id}`}>
                  <TextArea
                    id={`pr-${item.id}`}
                    value={reason}
                    rows={2}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Например: подрядчик ждёт материалы"
                  />
                </FieldStack>
              </FormGroup>
              <Button block loading={postpone.isPending} onClick={doPostpone} disabled={!newDue}>
                Перенести на {newDue ? fmtDay(newDue, today) : "…"}
              </Button>
            </div>
          )}
        </section>
      )}

      <Section>
        <Row
          title="Исполнитель"
          detail={<span className="text-foreground">{item.executor?.name ?? "—"}</span>}
          chevron={false}
        />
        {item.municipality && <Row title="Где" detail={item.municipality.name} chevron={false} />}
        <Row
          title="Срок"
          detail={
            <span className="text-right">
              <span className="text-foreground">{fmtDay(item.due_date, today)}</span>
              {active && (
                <span
                  className={cn(
                    "block text-footnote",
                    due.tone === "critical"
                      ? "text-critical-ink"
                      : due.tone === "warning"
                        ? "text-warning-ink"
                        : "text-ink-2",
                  )}
                >
                  {due.text}
                </span>
              )}
            </span>
          }
          chevron={false}
        />
        {item.postponed > 0 && (
          <Row
            title="Переносы срока"
            detail={`${item.postponed} ${plural(item.postponed, "раз", "раза", "раз")}`}
            chevron={false}
          />
        )}
        {item.reminders > 0 && <Row title="Напоминания" detail={String(item.reminders)} chevron={false} />}
        <Row title="Поручено" detail={fmtDay(mskDay(item.created_at), today)} chevron={false} />
      </Section>

      {item.signal && (
        <Section title="Основание">
          <Row
            leading={<CircleDot className="h-5 w-5 text-critical" aria-hidden />}
            title={item.signal.title}
            subtitle="Сигнал"
            onClick={() => onOpenSignal(item.signal!.id)}
          />
        </Section>
      )}

      {item.promise && (
        <figure className="surface p-4">
          <Quote className="h-5 w-5 text-ink-3" aria-hidden />
          <blockquote className="mt-1 text-callout font-semibold">«{item.promise.text}»</blockquote>
          <figcaption className="mt-1 text-subhead text-ink-2">
            Обещание · {item.promise.occasion}, {fmtDay(item.promise.said_on, today)}
          </figcaption>
        </figure>
      )}

      {showDetails && <p className="px-1 text-body text-ink-2">{item.details}</p>}

      {item.status === "done" && item.effect && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-card p-4",
            item.effect_positive === false ? "bg-critical/10" : "bg-good/12",
          )}
        >
          {item.effect_positive === false ? (
            <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-critical-ink" aria-hidden />
          ) : (
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-good-ink" aria-hidden />
          )}
          <div>
            <p className="text-footnote text-ink-2">Результат</p>
            <p className="text-callout font-semibold">{item.effect}</p>
          </div>
        </div>
      )}

      {item.events.length > 0 && (
        <section aria-label="История">
          <h3 className="section-title">История</h3>
          <ol className="surface px-4 py-2">
            {[...item.events].reverse().map((ev, i) => {
              const Icon = eventIcon[ev.kind] ?? CircleDot;
              return (
                <li key={`${ev.at}-${i}`} className="flex gap-3 py-2">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-3" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-callout">{ev.note ?? ev.kind}</p>
                    <p className="text-footnote text-ink-2">{fmtWhen(ev.at, today)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </article>
  );
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
  busy,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  busy?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      className={cn(
        "press flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[14px] px-2 text-[14px] font-semibold",
        active ? "bg-tint text-white" : "bg-tint/12 text-tint",
        busy && "opacity-60",
      )}
    >
      <Icon className={cn("h-[22px] w-[22px]", busy && "animate-pulse-soft")} aria-hidden />
      {label}
    </button>
  );
}
