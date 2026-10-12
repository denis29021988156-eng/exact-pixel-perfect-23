import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ChannelIcon } from "@/components/gov/meta";
import { MunicipalitySelect } from "@/components/gov/Pickers";
import { Badge, type Tone } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { DateInput, FieldRow, FieldStack, FormGroup, SelectInput, TextArea, TextInput } from "@/components/ios/Form";
import { PageHeader } from "@/components/ios/List";
import { Sheet } from "@/components/ios/Sheet";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useDirectory } from "@/lib/directory";
import { addDays, agendaStatusLabel, capitalize, channelLabel, fmtDay, fmtWeekdayShort, mskToday } from "@/lib/format";
import { useDeleteAgenda, useSaveAgenda, useTeamAgenda, type AgendaInput, type AgendaRecord } from "@/lib/team";
import type { AgendaChannel, AgendaStatus } from "@/lib/types";

const statusTone: Record<AgendaStatus, Tone> = {
  proposed: "tint",
  approved: "good",
  returned: "warning",
  done: "gray",
};
const CHANNELS: AgendaChannel[] = ["media", "pr", "gr", "event"];

/** Повестка: команда предлагает, губернатор согласует на планшете. */
export default function TeamAgenda() {
  const q = useTeamAgenda();
  const dir = useDirectory();
  const [editing, setEditing] = useState<AgendaRecord | "new" | null>(null);
  const today = mskToday();
  const munName = (id: string | null) => (id ? dir.data?.municipalities.find((m) => m.id === id)?.name : null);

  return (
    <div>
      <PageHeader
        title="Повестка"
        subtitle="СМИ, PR, GR и мероприятия: предложения на согласование"
        right={
          <Button size="sm" variant="tinted" icon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>
            Предложить
          </Button>
        }
      />
      {q.error && !q.data ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton rows={6} />
      ) : q.data.length ? (
        <div className="surface rows overflow-hidden">
          {q.data.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setEditing(a)}
              className="tap-row flex w-full items-start gap-3 px-4 py-3 text-left"
            >
              <ChannelIcon channel={a.channel} />
              <span className="min-w-0 flex-1">
                <span className="block text-footnote text-ink-2">
                  {capitalize(fmtWeekdayShort(a.day))}, {fmtDay(a.day, today)} · {channelLabel[a.channel]}
                  {munName(a.municipality_id) ? ` · ${munName(a.municipality_id)}` : ""}
                </span>
                <span className="block text-[16px] font-semibold leading-[21px]">{a.title}</span>
                {a.status === "returned" && a.decision_note && (
                  <span className="mt-0.5 block text-subhead text-warning-ink">«{a.decision_note}»</span>
                )}
              </span>
              <Badge tone={statusTone[a.status]}>{agendaStatusLabel[a.status]}</Badge>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Повестка пуста"
          text="Предложите первый пункт — он появится у губернатора на согласовании."
        />
      )}

      <AgendaForm record={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function empty(): AgendaInput {
  return {
    day: addDays(mskToday(), 2),
    channel: "media",
    title: "",
    description: "",
    municipality_id: null,
    expected_effect: "",
    status: "proposed",
  };
}

function AgendaForm({ record, onClose }: { record: AgendaRecord | "new" | null; onClose: () => void }) {
  const save = useSaveAgenda();
  const del = useDeleteAgenda();
  const [v, setV] = useState<AgendaInput>(empty);
  const rec = record && record !== "new" ? record : null;

  useEffect(() => {
    if (record === "new") setV(empty());
    else if (record) {
      const { id: _id, decision_note: _n, ...rest } = record;
      setV(rest);
    }
  }, [record]);

  const set = <K extends keyof AgendaInput>(k: K, val: AgendaInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const submit = () => {
    if (!v.title.trim() || !v.day) return;
    save.mutate(
      {
        id: rec?.id,
        values: {
          ...v,
          title: v.title.trim(),
          description: v.description?.trim() || null,
          expected_effect: v.expected_effect?.trim() || null,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      open={record !== null}
      onOpenChange={(o) => !o && onClose()}
      title={rec ? "Пункт повестки" : "Новый пункт"}
      footer={
        <div className="flex gap-2">
          {rec && (
            <Button
              variant="destructive-tinted"
              icon={<Trash2 className="h-4 w-4" />}
              loading={del.isPending}
              onClick={() => {
                if (window.confirm("Удалить пункт повестки?")) del.mutate(rec.id, { onSuccess: onClose });
              }}
            >
              Удалить
            </Button>
          )}
          <Button
            className="flex-1"
            size="lg"
            loading={save.isPending}
            disabled={!v.title.trim() || !v.day}
            onClick={submit}
          >
            Сохранить
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <FormGroup>
          <FieldStack label="Что" htmlFor="af-title">
            <TextInput
              id="af-title"
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Например: выезд в Удомлю"
            />
          </FieldStack>
          <FieldStack label="Подробности" htmlFor="af-desc">
            <TextArea
              id="af-desc"
              rows={2}
              value={v.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </FieldStack>
          <FieldStack label="Зачем — ожидаемый эффект" htmlFor="af-eff">
            <TextArea
              id="af-eff"
              rows={2}
              value={v.expected_effect ?? ""}
              onChange={(e) => set("expected_effect", e.target.value)}
            />
          </FieldStack>
        </FormGroup>
        <FormGroup>
          <FieldRow label="День" htmlFor="af-day">
            <DateInput id="af-day" value={v.day} onChange={(e) => set("day", e.target.value)} />
          </FieldRow>
          <FieldRow label="Канал" htmlFor="af-ch">
            <SelectInput id="af-ch" value={v.channel} onChange={(e) => set("channel", e.target.value as AgendaChannel)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {channelLabel[c]}
                </option>
              ))}
            </SelectInput>
          </FieldRow>
          <FieldRow label="Где" htmlFor="af-mun">
            <MunicipalitySelect
              id="af-mun"
              value={v.municipality_id ?? ""}
              onChange={(x) => set("municipality_id", x || null)}
            />
          </FieldRow>
          <FieldRow label="Статус" htmlFor="af-st">
            <SelectInput id="af-st" value={v.status} onChange={(e) => set("status", e.target.value as AgendaStatus)}>
              {(["proposed", "approved", "returned", "done"] as AgendaStatus[]).map((s) => (
                <option key={s} value={s}>
                  {agendaStatusLabel[s]}
                </option>
              ))}
            </SelectInput>
          </FieldRow>
        </FormGroup>
      </div>
    </Sheet>
  );
}
