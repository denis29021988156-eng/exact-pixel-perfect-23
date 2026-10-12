import { useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ClipboardCheck, Plus, Quote } from "lucide-react";
import { ExecutorRow } from "@/components/gov/ExecutorRow";
import { InstructionDetail } from "@/components/gov/InstructionDetail";
import { InstructionRow } from "@/components/gov/InstructionRow";
import { Badge, type Tone } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { PageHeader } from "@/components/ios/List";
import { Segmented } from "@/components/ios/Segmented";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useWide } from "@/hooks/useMediaQuery";
import { useSheets } from "@/hooks/useSheetParam";
import { days, fmtDay, mskToday, promiseStateLabel } from "@/lib/format";
import { useInstructions } from "@/lib/queries";
import type { Instruction, PromiseItem, PromiseState } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "list" | "promises" | "executors";

const stateTone: Record<PromiseState, Tone> = {
  at_risk: "critical",
  no_instruction: "warning",
  in_progress: "tint",
  kept: "good",
};
const stateOrder: Record<PromiseState, number> = { at_risk: 0, no_instruction: 1, in_progress: 2, kept: 3 };

export default function Instructions() {
  const q = useInstructions();
  const wide = useWide();
  const sheets = useSheets();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "list";
  const selectedId = params.get("sel");

  const groups = useMemo(() => {
    const items = q.data?.items ?? [];
    const active = items.filter((i) => i.status === "new" || i.status === "in_progress");
    return {
      overdue: active.filter((i) => i.overdue_days > 0).sort((a, b) => b.overdue_days - a.overdue_days),
      active: active.filter((i) => i.overdue_days === 0).sort((a, b) => a.due_date.localeCompare(b.due_date)),
      done: items.filter((i) => i.status === "done").sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? "")),
    };
  }, [q.data]);
  const ordered = useMemo(() => [...groups.overdue, ...groups.active, ...groups.done], [groups]);

  const promises = useMemo(
    () =>
      [...(q.data?.promises ?? [])].sort(
        (a, b) => stateOrder[a.state] - stateOrder[b.state] || b.said_on.localeCompare(a.said_on),
      ),
    [q.data],
  );
  const executors = useMemo(
    () =>
      [...(q.data?.executors ?? [])].sort(
        (a, b) => b.overdue - a.overdue || (a.on_time_rate ?? 101) - (b.on_time_rate ?? 101) || b.active - a.active,
      ),
    [q.data],
  );

  const setSel = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("sel", id);
    else next.delete("sel");
    setParams(next, { replace: true, state: location.state });
  };

  useEffect(() => {
    if (!wide || !q.data || tab !== "list") return;
    if (!(selectedId && ordered.some((i) => i.id === selectedId)) && ordered[0]) setSel(ordered[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, q.data, tab, ordered.length]);

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    if (t === "list") next.delete("tab");
    else next.set("tab", t);
    next.delete("sel");
    setParams(next, { replace: true });
  };

  const select = (id: string) => (wide ? setSel(id) : sheets.open("instruction", id));
  const selected = wide && tab === "list" ? (ordered.find((i) => i.id === selectedId) ?? null) : null;

  const atRisk = promises.filter((p) => p.state === "at_risk" || p.state === "no_instruction").length;

  return (
    <div>
      <PageHeader
        title="Поручения"
        subtitle="Кто, что и к какому сроку"
        right={
          <Button
            size="sm"
            variant="tinted"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => sheets.open("new")}
            aria-label="Поручить"
            className="max-sm:h-11 max-sm:w-11 max-sm:px-0"
          >
            <span className="hidden sm:inline">Поручить</span>
          </Button>
        }
      />
      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-4"
        ariaLabel="Раздел"
        options={[
          { value: "list", label: "Поручения", count: groups.overdue.length + groups.active.length },
          { value: "promises", label: "Обещания", count: atRisk },
          { value: "executors", label: "Исполнители" },
        ]}
      />

      {q.error && !q.data ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton rows={6} />
      ) : tab === "list" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-5">
            {ordered.length === 0 && (
              <EmptyState
                icon={<ClipboardCheck className="h-9 w-9" />}
                title="Поручений пока нет"
                text="Поручите по сигналу или создайте новое поручение."
              />
            )}
            <Group
              title="Просрочено"
              items={groups.overdue}
              onSelect={select}
              selectedId={selected?.id}
              tone="critical"
            />
            <Group title="В работе" items={groups.active} onSelect={select} selectedId={selected?.id} />
            <Group title="Выполнено за 30 дней" items={groups.done} onSelect={select} selectedId={selected?.id} />
          </div>
          {wide && (
            <div className="min-w-0 lg:col-span-7">
              <div className="glass flat-surfaces sticky top-[64px] max-h-[calc(100dvh-64px-var(--tabbar-space))] overflow-y-auto overscroll-contain rounded-card p-5 md:p-6">
                {selected ? (
                  <InstructionDetail item={selected} onOpenSignal={(id) => sheets.open("signal", id)} />
                ) : (
                  <p className="py-16 text-center text-subhead text-ink-2">Выберите поручение слева</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : tab === "promises" ? (
        <div className="space-y-3">
          {promises.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {promises.map((p) => (
                <PromiseCard
                  key={p.id}
                  p={p}
                  onOpenInstruction={(id) => sheets.open("instruction", id)}
                  onAssign={() => sheets.open("new", `promise:${p.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Quote className="h-9 w-9" />} title="Обещаний пока нет" />
          )}
          <p className="px-4 text-footnote text-ink-2">
            Обещания с прямых линий, выездов и встреч. Каждое должно стать поручением с исполнителем и сроком.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {executors.length ? (
            <div className="surface rows overflow-hidden">
              {executors.map((e) => (
                <ExecutorRow key={e.id} e={e} onClick={() => sheets.open("executor", e.id)} />
              ))}
            </div>
          ) : (
            <EmptyState title="Нет данных по исполнителям" />
          )}
          <p className="px-4 text-footnote text-ink-2">
            «В срок» — доля поручений, выполненных вовремя, среди выполненных и просроченных за 30 дней.
          </p>
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  items,
  onSelect,
  selectedId,
  tone,
}: {
  title: string;
  items: Instruction[];
  onSelect: (id: string) => void;
  selectedId?: string;
  tone?: "critical";
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className={cn("section-title", tone === "critical" && "text-critical-ink")}>
        {title} <span className="tabular-nums">{items.length}</span>
      </h2>
      <div className="surface rows overflow-hidden">
        {items.map((i) => (
          <InstructionRow key={i.id} item={i} onClick={() => onSelect(i.id)} selected={i.id === selectedId} />
        ))}
      </div>
    </section>
  );
}

function PromiseCard({
  p,
  onOpenInstruction,
  onAssign,
}: {
  p: PromiseItem;
  onOpenInstruction: (id: string) => void;
  onAssign: () => void;
}) {
  const today = mskToday();
  return (
    <article className="surface flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-footnote text-ink-2">
          {p.occasion}, {fmtDay(p.said_on, today)}
          {p.municipality ? ` · ${p.municipality.name}` : ""}
        </p>
        <Badge tone={stateTone[p.state]}>{promiseStateLabel[p.state]}</Badge>
      </div>
      <blockquote className="mt-2 text-headline">«{p.text}»</blockquote>
      {p.due_date && <p className="mt-1 text-subhead text-ink-2">Обещанный срок: {fmtDay(p.due_date, today)}</p>}

      <div className="mt-auto pt-3">
        {p.instruction ? (
          <button
            type="button"
            onClick={() => onOpenInstruction(p.instruction!.id)}
            className="tap-row -mx-2 flex w-[calc(100%+16px)] items-start gap-2 rounded-[10px] px-2 py-2 text-left"
          >
            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0 flex-1 text-subhead">
              <span className="block">{p.instruction.title}</span>
              <span className="block text-ink-2">
                {p.instruction.executor}
                {" · "}
                {p.instruction.status === "done" ? (
                  <span className="text-good-ink">{p.instruction.effect ?? "выполнено"}</span>
                ) : p.instruction.overdue_days > 0 ? (
                  <span className="text-critical-ink">просрочено на {days(p.instruction.overdue_days)}</span>
                ) : (
                  `срок ${fmtDay(p.instruction.due_date, today)}`
                )}
              </span>
            </span>
          </button>
        ) : (
          <Button variant="tinted" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAssign}>
            Поручить
          </Button>
        )}
      </div>
    </article>
  );
}
