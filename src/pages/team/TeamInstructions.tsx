import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateInstructionSheet } from "@/components/gov/CreateInstructionSheet";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { FieldStack, FormGroup, TextArea } from "@/components/ios/Form";
import { PageHeader } from "@/components/ios/List";
import { Segmented } from "@/components/ios/Segmented";
import { Sheet } from "@/components/ios/Sheet";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useSheets } from "@/hooks/useSheetParam";
import { fmtDay, fmtDue, instructionStatusLabel, mskDay, mskToday } from "@/lib/format";
import { useInstructions, useSetInstructionStatus } from "@/lib/queries";
import type { Instruction, InstructionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Команда ведёт ход поручений и записывает результат. */
export default function TeamInstructions() {
  const q = useInstructions();
  const sheets = useSheets();
  const setStatus = useSetInstructionStatus();
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState<Instruction | null>(null);
  const today = mskToday();

  const { active, done } = useMemo(() => {
    const items = q.data?.items ?? [];
    return {
      active: items
        .filter((i) => i.status === "new" || i.status === "in_progress")
        .sort((a, b) => b.overdue_days - a.overdue_days || a.due_date.localeCompare(b.due_date)),
      done: items.filter((i) => i.status === "done").sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? "")),
    };
  }, [q.data]);

  const change = (i: Instruction, s: InstructionStatus) => {
    if (s === i.status) return;
    if (s === "done") {
      setClosing(i);
      return;
    }
    if (s === "cancelled" && !window.confirm("Отменить поручение? Оно исчезнет из списков губернатора.")) return;
    setStatus.mutate({ id: i.id, status: s });
  };

  return (
    <div>
      <PageHeader
        title="Поручения"
        subtitle="Отмечайте ход и результат — губернатор видит это сразу"
        right={
          <Button size="sm" variant="tinted" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Новое
          </Button>
        }
      />

      {q.error && !q.data ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton rows={6} />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="section-title">В работе {active.length}</h2>
            {active.length ? (
              <div className="surface rows overflow-hidden">
                {active.map((i) => {
                  const due = fmtDue(i.due_date, today);
                  return (
                    <div key={i.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => sheets.open("instruction", i.id)}
                      >
                        <span className="block text-[16px] font-semibold leading-[21px]">{i.title}</span>
                        <span className="mt-0.5 block text-subhead text-ink-2">
                          {i.executor?.short_name} ·{" "}
                          <span className={cn(due.tone === "critical" && "font-semibold text-critical-ink")}>
                            {due.text}
                          </span>
                          {i.reminders > 0 && ` · напоминаний ${i.reminders}`}
                        </span>
                      </button>
                      <Segmented
                        value={i.status}
                        onChange={(s) => change(i, s as InstructionStatus)}
                        className="md:w-auto md:min-w-[330px]"
                        ariaLabel="Статус поручения"
                        options={[
                          { value: "new", label: "Поручено" },
                          { value: "in_progress", label: "В работе" },
                          { value: "done", label: "Выполнено" },
                          { value: "cancelled", label: "Отменить" },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Активных поручений нет" />
            )}
          </section>

          {done.length > 0 && (
            <section>
              <h2 className="section-title">Выполнено за 30 дней {done.length}</h2>
              <div className="surface rows overflow-hidden">
                {done.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => sheets.open("instruction", i.id)}
                    className="tap-row flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] leading-[21px]">{i.title}</span>
                      <span className="mt-0.5 block text-subhead text-ink-2">
                        {i.executor?.short_name} · {i.done_at ? fmtDay(mskDay(i.done_at), today) : ""}
                        {i.effect ? ` · ${i.effect}` : ""}
                      </span>
                    </span>
                    <Badge tone={i.late ? "warning" : "good"}>
                      {i.late ? "С опозданием" : instructionStatusLabel.done}
                    </Badge>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <CreateInstructionSheet open={creating} onClose={() => setCreating(false)} />
      <CloseSheet item={closing} onClose={() => setClosing(null)} />
    </div>
  );
}

/** Закрыть поручение: что получилось и как это сказалось. */
function CloseSheet({ item, onClose }: { item: Instruction | null; onClose: () => void }) {
  const setStatus = useSetInstructionStatus();
  const [effect, setEffect] = useState("");
  const [positive, setPositive] = useState<"yes" | "no">("yes");

  const submit = () => {
    if (!item) return;
    setStatus.mutate(
      { id: item.id, status: "done", effect: effect.trim() || null, effectPositive: positive === "yes" },
      {
        onSuccess: () => {
          setEffect("");
          setPositive("yes");
          onClose();
        },
      },
    );
  };

  return (
    <Sheet
      open={item !== null}
      onOpenChange={(o) => !o && onClose()}
      title="Поручение выполнено"
      footer={
        <Button size="lg" block variant="good" loading={setStatus.isPending} onClick={submit}>
          Отметить выполненным
        </Button>
      }
    >
      {item && (
        <div className="space-y-5 pt-1">
          <p className="text-headline">{item.title}</p>
          <FormGroup
            title="Результат"
            footer="Например: «Обращения по воде −81%, индекс в округе +0,9». Губернатор увидит это в карточке."
          >
            <FieldStack label="Что изменилось" htmlFor="cl-effect">
              <TextArea id="cl-effect" rows={3} value={effect} onChange={(e) => setEffect(e.target.value)} autoFocus />
            </FieldStack>
          </FormGroup>
          <Segmented
            value={positive}
            onChange={setPositive}
            className="md:min-w-0 md:w-full"
            ariaLabel="Итог"
            options={[
              { value: "yes", label: "Помогло" },
              { value: "no", label: "Не помогло" },
            ]}
          />
        </div>
      )}
    </Sheet>
  );
}
