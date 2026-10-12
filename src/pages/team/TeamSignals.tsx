import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { severityBar } from "@/components/gov/tones";
import { ExecutorSelect, MunicipalitySelect } from "@/components/gov/Pickers";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { DateInput, FieldRow, FieldStack, FormGroup, SelectInput, TextArea, TextInput } from "@/components/ios/Form";
import { PageHeader } from "@/components/ios/List";
import { Segmented } from "@/components/ios/Segmented";
import { Sheet } from "@/components/ios/Sheet";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useDirectory } from "@/lib/directory";
import { addDays, fmtWhen, mskToday, severityLabel, signalKindLabel, signalStatusLabel } from "@/lib/format";
import { useDeleteSignal, useSaveSignal, useTeamSignals, type SignalInput, type SignalRecord } from "@/lib/team";
import type { Severity, SignalKind, SignalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "open" | "assigned" | "closed";

const statusTone = { new: "critical", watch: "tint", assigned: "gray", dismissed: "gray", resolved: "good" } as const;

export default function TeamSignals() {
  const q = useTeamSignals();
  const dir = useDirectory();
  const [filter, setFilter] = useState<Filter>("open");
  const [editing, setEditing] = useState<SignalRecord | "new" | null>(null);

  const munName = (id: string | null) => dir.data?.municipalities.find((m) => m.id === id)?.name ?? "Вся область";
  const items = useMemo(
    () =>
      (q.data ?? []).filter((s) =>
        filter === "open"
          ? s.status === "new" || s.status === "watch"
          : filter === "assigned"
            ? s.status === "assigned"
            : s.status === "resolved" || s.status === "dismissed",
      ),
    [q.data, filter],
  );

  return (
    <div>
      <PageHeader
        title="Сигналы"
        subtitle="Что увидит губернатор: факты, разбор ИИ и предложение, кому поручить"
        right={
          <Button size="sm" variant="tinted" icon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>
            Добавить
          </Button>
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        className="mb-4"
        options={[
          { value: "open", label: "Ждут решения" },
          { value: "assigned", label: "Поручено" },
          { value: "closed", label: "Закрыто" },
        ]}
      />
      {q.error && !q.data ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton rows={6} />
      ) : items.length ? (
        <div className="surface rows overflow-hidden">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setEditing(s)}
              className="tap-row flex w-full items-stretch gap-3 px-4 py-3 text-left"
            >
              <span className={cn("w-1 shrink-0 rounded-full", severityBar[s.severity])} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-[21px]">{s.title}</span>
                <span className="mt-0.5 block text-subhead text-ink-2">
                  {munName(s.municipality_id)} · {signalKindLabel[s.kind]} · {fmtWhen(s.detected_at)}
                </span>
              </span>
              <span className="self-center">
                <Badge tone={statusTone[s.status]}>{signalStatusLabel[s.status]}</Badge>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="Здесь пусто" text="Добавьте сигнал — он сразу появится на планшете." />
      )}

      <SignalForm record={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

const KINDS: SignalKind[] = ["incident", "negative", "deadline", "complaints", "media"];

function emptySignal(): SignalInput {
  const today = mskToday();
  return {
    kind: "incident",
    severity: "high",
    title: "",
    summary: "",
    municipality_id: null,
    source: "",
    mentions: null,
    detected_at: new Date().toISOString(),
    ai_cause: "",
    ai_forecast: "",
    ai_recommendation: "",
    suggested_title: "",
    suggested_executor_id: null,
    suggested_due: addDays(today, 2),
    status: "new",
  };
}

function SignalForm({ record, onClose }: { record: SignalRecord | "new" | null; onClose: () => void }) {
  const save = useSaveSignal();
  const del = useDeleteSignal();
  const [v, setV] = useState<SignalInput>(emptySignal);
  const isNew = record === "new";
  const rec = record && record !== "new" ? record : null;

  useEffect(() => {
    if (record === "new") setV(emptySignal());
    else if (record) {
      const { id: _id, instruction_id: _i, status_note: _n, ...rest } = record;
      setV(rest);
    }
  }, [record]);

  const set = <K extends keyof SignalInput>(k: K, val: SignalInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const nul = (s: string | null) => (s && s.trim() ? s.trim() : null);

  const submit = () => {
    if (!v.title.trim()) return;
    save.mutate(
      {
        id: rec?.id,
        values: {
          ...v,
          title: v.title.trim(),
          summary: nul(v.summary),
          source: nul(v.source),
          ai_cause: nul(v.ai_cause),
          ai_forecast: nul(v.ai_forecast),
          ai_recommendation: nul(v.ai_recommendation),
          suggested_title: nul(v.suggested_title),
        },
      },
      { onSuccess: onClose },
    );
  };

  const statusOptions: SignalStatus[] =
    rec?.status === "assigned" ? ["assigned", "resolved"] : ["new", "watch", "dismissed", "resolved"];

  return (
    <Sheet
      open={record !== null}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? "Новый сигнал" : "Сигнал"}
      size="lg"
      footer={
        <div className="flex gap-2">
          {rec && (
            <Button
              variant="destructive-tinted"
              icon={<Trash2 className="h-4 w-4" />}
              loading={del.isPending}
              onClick={() => {
                if (window.confirm("Удалить сигнал? Поручения по нему останутся."))
                  del.mutate(rec.id, { onSuccess: onClose });
              }}
            >
              Удалить
            </Button>
          )}
          <Button className="flex-1" size="lg" loading={save.isPending} disabled={!v.title.trim()} onClick={submit}>
            Сохранить
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <FormGroup title="Что случилось">
          <FieldStack label="Заголовок" htmlFor="sf-title" hint="Место и суть: «Удомля: три дома без отопления»">
            <TextInput id="sf-title" value={v.title} onChange={(e) => set("title", e.target.value)} />
          </FieldStack>
          <FieldStack label="Подробности" htmlFor="sf-summary">
            <TextArea
              id="sf-summary"
              rows={3}
              value={v.summary ?? ""}
              onChange={(e) => set("summary", e.target.value)}
            />
          </FieldStack>
          <FieldRow label="Тип" htmlFor="sf-kind">
            <SelectInput id="sf-kind" value={v.kind} onChange={(e) => set("kind", e.target.value as SignalKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {signalKindLabel[k]}
                </option>
              ))}
            </SelectInput>
          </FieldRow>
          <div className="px-4 py-3">
            <Segmented
              value={v.severity}
              onChange={(s) => set("severity", s as Severity)}
              className="md:min-w-0 md:w-full"
              ariaLabel="Важность"
              options={(["critical", "high", "medium"] as Severity[]).map((s) => ({
                value: s,
                label: severityLabel[s],
              }))}
            />
          </div>
          <FieldRow label="Где" htmlFor="sf-mun">
            <MunicipalitySelect
              id="sf-mun"
              value={v.municipality_id ?? ""}
              onChange={(x) => set("municipality_id", x || null)}
            />
          </FieldRow>
          <FieldRow label="Источник" htmlFor="sf-src">
            <TextInput
              id="sf-src"
              className="text-right text-ink-2"
              value={v.source ?? ""}
              placeholder="ЕДДС, ЦУР, СМИ…"
              onChange={(e) => set("source", e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Упоминаний" htmlFor="sf-men">
            <TextInput
              id="sf-men"
              type="number"
              inputMode="numeric"
              min={0}
              className="text-right text-ink-2"
              value={v.mentions ?? ""}
              onChange={(e) => set("mentions", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
            />
          </FieldRow>
          <FieldRow label="Статус" htmlFor="sf-status">
            <SelectInput
              id="sf-status"
              value={v.status}
              onChange={(e) => set("status", e.target.value as SignalStatus)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {signalStatusLabel[s]}
                </option>
              ))}
            </SelectInput>
          </FieldRow>
        </FormGroup>

        <FormGroup title="Разбор ИИ">
          <FieldStack label="Почему это случилось" htmlFor="sf-cause">
            <TextArea
              id="sf-cause"
              rows={2}
              value={v.ai_cause ?? ""}
              onChange={(e) => set("ai_cause", e.target.value)}
            />
          </FieldStack>
          <FieldStack label="Что будет, если не реагировать" htmlFor="sf-fc">
            <TextArea
              id="sf-fc"
              rows={2}
              value={v.ai_forecast ?? ""}
              onChange={(e) => set("ai_forecast", e.target.value)}
            />
          </FieldStack>
          <FieldStack label="Что советует ИИ" htmlFor="sf-rec">
            <TextArea
              id="sf-rec"
              rows={2}
              value={v.ai_recommendation ?? ""}
              onChange={(e) => set("ai_recommendation", e.target.value)}
            />
          </FieldStack>
        </FormGroup>

        <FormGroup title="Готовое поручение" footer="Губернатор сможет поручить в одно касание.">
          <FieldStack label="Что сделать" htmlFor="sf-st">
            <TextArea
              id="sf-st"
              rows={2}
              value={v.suggested_title ?? ""}
              onChange={(e) => set("suggested_title", e.target.value)}
            />
          </FieldStack>
          <FieldRow label="Исполнитель" htmlFor="sf-ex">
            <ExecutorSelect
              id="sf-ex"
              value={v.suggested_executor_id ?? ""}
              onChange={(x) => set("suggested_executor_id", x || null)}
            />
          </FieldRow>
          <FieldRow label="Срок" htmlFor="sf-due">
            <DateInput
              id="sf-due"
              value={v.suggested_due ?? ""}
              onChange={(e) => set("suggested_due", e.target.value || null)}
            />
          </FieldRow>
        </FormGroup>
      </div>
    </Sheet>
  );
}
