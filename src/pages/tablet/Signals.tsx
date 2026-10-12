import { useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { BellOff, Radar } from "lucide-react";
import { SignalDetail } from "@/components/gov/SignalDetail";
import { SignalRow } from "@/components/gov/SignalRow";
import { PageHeader } from "@/components/ios/List";
import { Segmented } from "@/components/ios/Segmented";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useWide } from "@/hooks/useMediaQuery";
import { useSheets } from "@/hooks/useSheetParam";
import { useSignals } from "@/lib/queries";
import type { Signal } from "@/lib/types";

type Filter = "open" | "assigned" | "closed";

const inFilter = (s: Signal, f: Filter) =>
  f === "open"
    ? s.status === "new" || s.status === "watch"
    : f === "assigned"
      ? s.status === "assigned"
      : s.status === "resolved" || s.status === "dismissed";

export default function Signals() {
  const q = useSignals();
  const wide = useWide();
  const sheets = useSheets();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const filter = (params.get("filter") as Filter) || "open";
  // На широком экране выбранный сигнал показан справа (?sel=…), на узком — открывается листом.
  const selectedId = params.get("sel");

  const items = useMemo(() => (q.data?.items ?? []).filter((s) => inFilter(s, filter)), [q.data, filter]);
  const counts = useMemo(() => {
    const all = q.data?.items ?? [];
    return {
      open: all.filter((s) => inFilter(s, "open")).length,
      assigned: all.filter((s) => inFilter(s, "assigned")).length,
      closed: all.filter((s) => inFilter(s, "closed")).length,
    };
  }, [q.data]);

  const selected = wide ? (q.data?.items.find((s) => s.id === selectedId) ?? null) : null;

  const setSel = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("sel", id);
    else next.delete("sel");
    setParams(next, { replace: true, state: location.state });
  };

  // На широком экране сразу показываем первый сигнал из списка.
  useEffect(() => {
    if (!wide || !q.data) return;
    const stillVisible = selectedId && items.some((s) => s.id === selectedId);
    if (!stillVisible && items[0]) setSel(items[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, q.data, filter, items.length]);

  const setFilter = (f: Filter) => {
    const next = new URLSearchParams(params);
    next.set("filter", f);
    next.delete("sel");
    setParams(next, { replace: true });
  };

  const select = (id: string) => (wide ? setSel(id) : sheets.open("signal", id));

  return (
    <div>
      <PageHeader title="Сигналы" subtitle="ЕДДС, ЦУР, соцсети, СМИ и контроль поручений" />
      <Segmented
        value={filter}
        onChange={setFilter}
        ariaLabel="Какие сигналы показать"
        className="mb-4"
        options={[
          { value: "open", label: "Ждут решения", count: counts.open },
          { value: "assigned", label: "Поручено", count: counts.assigned },
          { value: "closed", label: "Закрыто", count: counts.closed },
        ]}
      />

      {q.error && !q.data ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton rows={6} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-5">
            {items.length ? (
              <div className="surface rows overflow-hidden">
                {items.map((s) => (
                  <SignalRow
                    key={s.id}
                    signal={s}
                    onClick={() => select(s.id)}
                    selected={wide && s.id === selectedId}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={filter === "open" ? <Radar className="h-9 w-9" /> : <BellOff className="h-9 w-9" />}
                title={
                  filter === "open"
                    ? "Новых сигналов нет"
                    : filter === "assigned"
                      ? "Поручений по сигналам нет"
                      : "Закрытых сигналов нет"
                }
                text={filter === "open" ? "ИИ продолжает следить за источниками." : undefined}
              />
            )}
          </div>

          {wide && (
            <div className="min-w-0 lg:col-span-7">
              <div className="glass flat-surfaces sticky top-[64px] max-h-[calc(100dvh-64px-var(--tabbar-space))] overflow-y-auto overscroll-contain rounded-card p-5 md:p-6">
                {selected ? (
                  <SignalDetail signal={selected} onOpenInstruction={(id) => sheets.open("instruction", id)} />
                ) : (
                  <p className="py-16 text-center text-subhead text-ink-2">Выберите сигнал слева</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
