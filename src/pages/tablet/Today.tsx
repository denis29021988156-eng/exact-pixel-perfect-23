import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, ChevronRight, Quote } from "lucide-react";
import { BriefCard } from "@/components/gov/BriefCard";
import { DecisionCard } from "@/components/gov/DecisionCard";
import { SignalRow } from "@/components/gov/SignalRow";
import { TrustCard } from "@/components/gov/TrustCard";
import { PageHeader } from "@/components/ios/List";
import { EmptyState, ErrorState, ScreenSkeleton } from "@/components/ios/States";
import { useSheets } from "@/hooks/useSheetParam";
import { capitalize, fmtLongDate, plural } from "@/lib/format";
import { useToday } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function Today() {
  const q = useToday();
  const sheets = useSheets();
  const navigate = useNavigate();
  const openSignal = (id: string) => sheets.open("signal", id);

  if (q.error && !q.data) {
    return (
      <>
        <PageHeader title="Сегодня" />
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      </>
    );
  }
  if (!q.data) {
    return (
      <>
        <PageHeader title="Сегодня" />
        <ScreenSkeleton />
      </>
    );
  }

  const t = q.data;
  const decisionIds = new Set(t.decisions.filter((d) => d.type === "signal").map((d) => d.id));
  const others = t.top.filter((s) => !decisionIds.has(s.id));
  const c = t.counts;

  return (
    <div>
      <PageHeader title="Сегодня" subtitle={capitalize(fmtLongDate(t.date, t.date))} />

      {/* На телефоне и в портрете сначала сводка и решения, на широком экране — сводка и индекс рядом. */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-6 lg:grid-cols-12">
        <div className="order-1 min-w-0 lg:col-span-7">
          <BriefCard brief={t.brief} onOpenSignal={openSignal} />
        </div>
        <div className="order-3 min-w-0 space-y-4 lg:order-2 lg:col-span-5">
          <TrustCard trust={t.trust} onOpen={() => sheets.open("trust")} />
          <div className="grid grid-cols-3 gap-3">
            <Counter
              value={c.instructions_overdue}
              label="просрочено"
              tone={c.instructions_overdue > 0 ? "critical" : "normal"}
              onClick={() => navigate("/app/instructions")}
            />
            <Counter value={c.instructions_active} label="в работе" onClick={() => navigate("/app/instructions")} />
            <Counter
              value={c.instructions_done_week}
              label="сделано за неделю"
              tone="good"
              onClick={() => navigate("/app/instructions")}
            />
          </div>
          <LinkTile
            icon={<Quote className="h-5 w-5" />}
            iconClass={c.promises_at_risk > 0 ? "bg-warning/14 text-warning-ink" : "bg-good/14 text-good-ink"}
            title="Обещания"
            text={
              c.promises_at_risk > 0
                ? `${c.promises_at_risk} ${plural(c.promises_at_risk, "обещание", "обещания", "обещаний")} под риском или без поручения`
                : "Все обещания в работе"
            }
            onClick={() => navigate("/app/instructions?tab=promises")}
          />
          <LinkTile
            icon={<CalendarDays className="h-5 w-5" />}
            iconClass="bg-tint/12 text-tint"
            title="Повестка"
            text={
              c.agenda_pending > 0
                ? `${c.agenda_pending} ${plural(c.agenda_pending, "пункт ждёт", "пункта ждут", "пунктов ждут")} согласования`
                : "Повестка согласована"
            }
            onClick={() => navigate("/app/agenda")}
          />
        </div>

        <section aria-label="Ждут решения" className="order-2 min-w-0 lg:order-3 lg:col-span-12">
          <div className="flex items-end justify-between px-1 pb-3">
            <h2 className="text-title3">
              Ждут решения{" "}
              {t.decisions.length > 0 && <span className="text-ink-3 tabular-nums">{t.decisions.length}</span>}
            </h2>
          </div>
          {t.decisions.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {t.decisions.map((d) => (
                <DecisionCard
                  key={`${d.type}-${d.id}`}
                  d={d}
                  onOpenSignal={openSignal}
                  onOpenAgenda={() => navigate("/app/agenda")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-9 w-9 text-good" />}
              title="Все решения приняты"
              text="Новые вопросы появятся здесь, как только ИИ их найдёт."
            />
          )}
        </section>

        <section aria-label="Другие сигналы" className="order-4 min-w-0 lg:col-span-12">
          <div className="flex items-end justify-between px-1 pb-3">
            <h2 className="text-title3">Ещё сигналы</h2>
            <button
              type="button"
              className="press text-[15px] font-semibold text-tint"
              onClick={() => navigate("/app/signals")}
            >
              Все
            </button>
          </div>
          {others.length ? (
            <div className="surface rows overflow-hidden">
              {others.map((s) => (
                <SignalRow key={s.id} signal={s} onClick={() => openSignal(s.id)} />
              ))}
            </div>
          ) : (
            <EmptyState title="Других открытых сигналов нет" />
          )}
        </section>
      </div>
    </div>
  );
}

function Counter({
  value,
  label,
  tone = "normal",
  onClick,
}: {
  value: number;
  label: string;
  tone?: "critical" | "good" | "normal";
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="surface press flex flex-col items-start px-3.5 py-3 text-left">
      <span
        className={cn(
          "text-title1 tabular-nums",
          tone === "critical" && value > 0 && "text-critical-ink",
          tone === "good" && value > 0 && "text-good-ink",
        )}
      >
        {value}
      </span>
      <span className="text-footnote leading-tight text-ink-2">{label}</span>
    </button>
  );
}

function LinkTile({
  icon,
  iconClass,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="surface press flex w-full items-center gap-3 p-4 text-left">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]", iconClass)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-headline">{title}</span>
        <span className="block text-subhead text-ink-2">{text}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
    </button>
  );
}
