import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { DateInput, FieldRow, FieldStack, FormGroup, TextArea } from "@/components/ios/Form";
import { Row, Section } from "@/components/ios/List";
import {
  addDays,
  fmtDay,
  fmtDue,
  fmtDueShort,
  fmtWhen,
  instructionStatusLabel,
  mskDay,
  mskToday,
  plural,
  signalKindLabel,
} from "@/lib/format";
import { useSignalStatus } from "@/lib/queries";
import type { Signal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAssignFlow } from "./actions";
import { SeverityBadge } from "./meta";
import { ExecutorSelect } from "./Pickers";

const DISMISS_REASONS = ["Не подтвердилось", "Решено без поручения", "Не наш вопрос"];

export function SignalDetail({
  signal,
  onOpenInstruction,
  onDone,
}: {
  signal: Signal;
  onOpenInstruction: (id: string) => void;
  /** Вызывается после поручения (например, чтобы закрыть лист). */
  onDone?: () => void;
}) {
  const today = mskToday();
  const flow = useAssignFlow();
  const status = useSignalStatus();
  const [editing, setEditing] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [title, setTitle] = useState(signal.suggested_title ?? "");
  const [executorId, setExecutorId] = useState(signal.suggested_executor?.id ?? "");
  const [due, setDue] = useState(
    signal.suggested_due && signal.suggested_due >= today ? signal.suggested_due : addDays(today, 3),
  );

  // Другой сигнал — сбрасываем форму.
  useEffect(() => {
    setEditing(false);
    setDismissing(false);
    setTitle(signal.suggested_title ?? "");
    setExecutorId(signal.suggested_executor?.id ?? "");
    setDue(signal.suggested_due && signal.suggested_due >= today ? signal.suggested_due : addDays(today, 3));
  }, [signal.id, signal.suggested_title, signal.suggested_executor?.id, signal.suggested_due, today]);

  const open = signal.status === "new" || signal.status === "watch";
  const ex = signal.suggested_executor;
  const suggestedDue = signal.suggested_due && signal.suggested_due >= today ? signal.suggested_due : null;

  const assignQuick = async () => {
    const instr = await flow.run({ signalId: signal.id });
    if (instr) onDone?.();
  };

  const assignCustom = async () => {
    if (!executorId) {
      toast.error("Выберите исполнителя");
      return;
    }
    const instr = await flow.run({ signalId: signal.id, executorId, due, title: title.trim() || null });
    if (instr) onDone?.();
  };

  const setStatus = (s: "new" | "watch" | "dismissed", note?: string) =>
    status.mutate(
      { signalId: signal.id, status: s, note },
      {
        onSuccess: () => {
          setDismissing(false);
          toast(
            s === "watch"
              ? "Сигнал на наблюдении"
              : s === "dismissed"
                ? "Сигнал снят с контроля"
                : "Сигнал снова ждёт решения",
          );
        },
      },
    );

  return (
    <article className="space-y-5">
      <header className="pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={signal.severity} />
          <span className="text-footnote text-ink-2">{signalKindLabel[signal.kind]}</span>
        </div>
        <h2 className="mt-2 text-title2 text-balance">{signal.title}</h2>
        <p className="mt-1.5 text-subhead text-ink-2">
          {[signal.municipality?.name ?? "Вся область", signal.source, fmtWhen(signal.detected_at, today)]
            .filter(Boolean)
            .join(" · ")}
          {signal.mentions
            ? ` · ${signal.mentions} ${plural(signal.mentions, "упоминание", "упоминания", "упоминаний")}`
            : ""}
        </p>
        {signal.summary && <p className="mt-3 text-body text-pretty">{signal.summary}</p>}
      </header>

      {(signal.ai_cause || signal.ai_forecast || signal.ai_recommendation) && (
        <section className="rounded-card bg-ai/8 p-4 ring-1 ring-ai/15" aria-label="Разбор ИИ">
          <div className="flex items-center gap-1.5 text-footnote font-semibold text-ai-ink">
            <Sparkles className="h-4 w-4" aria-hidden />
            Разбор ИИ
          </div>
          <dl className="mt-2 space-y-3">
            {signal.ai_cause && (
              <div>
                <dt className="text-footnote text-ink-2">Почему это случилось</dt>
                <dd className="mt-0.5 text-callout">{signal.ai_cause}</dd>
              </div>
            )}
            {signal.ai_forecast && (
              <div>
                <dt className="text-footnote text-ink-2">Что будет, если не реагировать</dt>
                <dd className="mt-0.5 text-callout">{signal.ai_forecast}</dd>
              </div>
            )}
            {signal.ai_recommendation && (
              <div>
                <dt className="text-footnote text-ink-2">Что советует ИИ</dt>
                <dd className="mt-0.5 text-callout font-semibold">{signal.ai_recommendation}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {open && (
        <section className="space-y-3" aria-label="Решение">
          {!editing && ex && (
            <Button size="lg" block loading={flow.pending} onClick={assignQuick} className="flex-col gap-0 py-2">
              <span>Поручить: {ex.short_name}</span>
              <span className="text-[13px] font-medium opacity-85">
                {suggestedDue ? `срок ${fmtDueShort(suggestedDue, today)}` : "срок через 3 дня"}
              </span>
            </Button>
          )}

          {(editing || !ex) && (
            <div className="space-y-3">
              <FormGroup title="Поручение">
                <FieldStack label="Что сделать" htmlFor={`t-${signal.id}`}>
                  <TextArea
                    id={`t-${signal.id}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    rows={2}
                    placeholder="Коротко, с результатом"
                  />
                </FieldStack>
                <FieldRow label="Исполнитель" htmlFor={`e-${signal.id}`}>
                  <ExecutorSelect id={`e-${signal.id}`} value={executorId} onChange={setExecutorId} />
                </FieldRow>
                <FieldRow label="Срок" htmlFor={`d-${signal.id}`}>
                  <DateInput id={`d-${signal.id}`} value={due} min={today} onChange={(e) => setDue(e.target.value)} />
                </FieldRow>
              </FormGroup>
              <Button size="lg" block loading={flow.pending} onClick={assignCustom} disabled={!executorId || !due}>
                Поручить
              </Button>
            </div>
          )}

          {ex && (
            <Button
              variant="plain"
              block
              onClick={() => setEditing((v) => !v)}
              icon={editing ? undefined : <Pencil className="h-4 w-4" />}
            >
              {editing ? "Как предлагает ИИ" : "Изменить исполнителя или срок"}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {signal.status === "new" ? (
              <Button
                variant="gray"
                icon={<Eye className="h-4 w-4" />}
                onClick={() => setStatus("watch")}
                disabled={status.isPending}
              >
                Наблюдать
              </Button>
            ) : (
              <Button
                variant="gray"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => setStatus("new")}
                disabled={status.isPending}
              >
                Ждёт решения
              </Button>
            )}
            <Button
              variant="destructive-tinted"
              icon={<EyeOff className="h-4 w-4" />}
              onClick={() => setDismissing((v) => !v)}
              aria-expanded={dismissing}
            >
              Снять
            </Button>
          </div>

          {dismissing && (
            <div className="surface p-4">
              <p className="text-subhead text-ink-2">Почему снимаем с контроля?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DISMISS_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="press rounded-full bg-fill px-3 py-1.5 text-[15px]"
                    onClick={() => setStatus("dismissed", r)}
                    disabled={status.isPending}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {signal.instruction && (
        <Section title="Поручение">
          <Row
            title={signal.instruction.title}
            subtitle={
              <>
                {signal.instruction.executor} ·{" "}
                <span
                  className={cn(
                    signal.instruction.status !== "done" &&
                      fmtDue(signal.instruction.due_date, today).tone === "critical" &&
                      "text-critical-ink",
                  )}
                >
                  {signal.instruction.status === "done" ? "выполнено" : fmtDue(signal.instruction.due_date, today).text}
                </span>
              </>
            }
            detail={
              <Badge tone={signal.instruction.status === "done" ? "good" : "gray"}>
                {instructionStatusLabel[signal.instruction.status]}
              </Badge>
            }
            onClick={() => onOpenInstruction(signal.instruction!.id)}
          />
        </Section>
      )}

      {signal.status === "dismissed" && (
        <div className="surface flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-callout font-semibold">Снят с контроля</p>
            {signal.status_note && <p className="text-subhead text-ink-2">{signal.status_note}</p>}
          </div>
          <Button variant="tinted" size="sm" onClick={() => setStatus("new")} loading={status.isPending}>
            Вернуть
          </Button>
        </div>
      )}

      {signal.status === "resolved" && (
        <p className="text-center text-footnote text-ink-2">Сигнал закрыт {fmtDay(mskDay(signal.updated_at), today)}</p>
      )}
    </article>
  );
}
