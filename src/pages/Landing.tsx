import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, CalendarDays, ClipboardCheck, Mic, Sparkles, Sun } from "lucide-react";
import { AppMark } from "@/components/gov/AppMark";
import { RegionMap } from "@/components/gov/map/RegionMap";
import { TrustGlance } from "@/components/gov/TrustCard";
import { Button } from "@/components/ios/Button";
import { homeFor, useAuth } from "@/contexts/auth";
import { addDays, mskToday } from "@/lib/format";
import type { Severity, Signal, TrustSummary } from "@/lib/types";

const features = [
  {
    icon: Sun,
    title: "Сегодня",
    text: "Сводка дня от ИИ, индекс доверия и вопросы, которые ждут решения.",
  },
  {
    icon: Bell,
    title: "Сигналы",
    text: "ЕДДС, ЦУР, соцсети и СМИ: что случилось, почему и что будет дальше.",
  },
  {
    icon: ClipboardCheck,
    title: "Поручения",
    text: "Поручить в одно касание, напомнить, перенести срок, увидеть результат.",
  },
  {
    icon: CalendarDays,
    title: "Повестка",
    text: "СМИ, PR, GR и мероприятия на три недели и их влияние на доверие.",
  },
  {
    icon: Mic,
    title: "Спросить",
    text: "Голосом или текстом: «Что горит сегодня?», «Кто срывает сроки?»",
  },
];

export default function Landing() {
  const { status, role, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"governor" | "team" | null>(null);

  const openDemo = async (as: "governor" | "team") => {
    setBusy(as);
    try {
      const r = await demoLogin(as);
      navigate(homeFor(r));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const signedIn = status === "ready" && role;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <AppMark size={32} />
          <span className="text-headline">Планшет губернатора</span>
        </div>
        {signedIn ? (
          <Link to={homeFor(role)} className="press text-[16px] font-semibold text-tint">
            Открыть
          </Link>
        ) : (
          <Link to="/login" className="press text-[16px] font-semibold text-tint">
            Войти
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-[1180px] px-5 pb-16">
        <section className="grid grid-cols-1 items-center gap-10 pt-10 lg:grid-cols-[0.95fr_1.05fr] lg:pt-16">
          <div className="animate-rise-in">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-ai/12 px-3 py-1 text-[13px] font-semibold text-ai-ink">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              ИИ-помощник руководителя региона
            </p>
            <h1 className="mt-5 text-[42px] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance md:text-[58px]">
              Главное за день — на одном экране
            </h1>
            <p className="mt-4 max-w-[34rem] text-[19px] leading-[27px] text-ink-2 text-pretty">
              ИИ собирает сигналы из ЕДДС, ЦУР, соцсетей и СМИ, готовит сводку и предлагает решение. Поручить можно в
              одно касание, а результат виден в индексе доверия.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {signedIn ? (
                <Button size="lg" onClick={() => navigate(homeFor(role))}>
                  Открыть планшет
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    loading={busy === "governor"}
                    disabled={busy !== null}
                    onClick={() => openDemo("governor")}
                  >
                    Открыть демо
                  </Button>
                  <Button
                    size="lg"
                    variant="gray"
                    loading={busy === "team"}
                    disabled={busy !== null}
                    onClick={() => openDemo("team")}
                  >
                    Кабинет команды
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 max-w-[34rem] text-footnote text-ink-2">
              Демо на примере Тверской области: округа настоящие, события и цифры придуманы. Данные пересобираются
              каждую ночь.
            </p>
          </div>

          <LivePreview onOpen={() => (signedIn ? navigate(homeFor(role)) : openDemo("governor"))} />
        </section>

        <section className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.title} className="surface p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-tint/12 text-tint dark:bg-tint/20">
                <f.icon className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <h2 className="mt-3 text-headline">{f.title}</h2>
              <p className="mt-1 text-subhead text-ink-2">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

/** Живой фрагмент экрана «Сегодня»: карта области с сигналами и индекс доверия. */
function LivePreview({ onOpen }: { onOpen: () => void }) {
  const [selected, setSelected] = useState<string | null>("p-udomlya");
  return (
    <div className="animate-rise-in [animation-delay:120ms]">
      <RegionMap
        title="Тверская область"
        signals={previewSignals}
        selectedId={selected}
        onSelect={setSelected}
        onOpen={onOpen}
        renderOverlay={(placement) => (
          <TrustGlance trust={previewTrust} onOpen={onOpen} layout={placement === "over" ? "stack" : "row"} />
        )}
      />
    </div>
  );
}

const today = mskToday();
const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
const sample = (id: string, severity: Severity, municipality: string, title: string, hoursAgo: number): Signal => ({
  id,
  kind: "incident",
  severity,
  title,
  summary: null,
  municipality: { id, name: municipality },
  source: null,
  mentions: null,
  detected_at: at(hoursAgo),
  ai_cause: null,
  ai_forecast: null,
  ai_recommendation: null,
  suggested_title: null,
  suggested_executor: null,
  suggested_due: null,
  status: "new",
  status_note: null,
  updated_at: at(hoursAgo),
  instruction: null,
});

// Пример для главной: те же сюжеты, что в демо.
const previewSignals: Signal[] = [
  sample("p-udomlya", "critical", "Удомельский округ", "Удомля: три дома без отопления после аварии на теплосети", 9),
  sample("p-tver", "high", "Тверь", "Тверь: втрое больше жалоб на вывоз мусора в Заволжском районе", 17),
  sample("p-rzhev", "high", "Ржевский округ", "Ржев: ремонт школы № 3 отстаёт от графика на 12 дней", 26),
  sample("p-volochek", "high", "Вышневолоцкий округ", "Вышний Волочёк: подтопление подвалов в шести домах", 30),
  sample("p-kimry", "medium", "Кимрский округ", "Кимры: очередь к терапевту до 14 дней", 28),
  sample("p-torzhok", "medium", "Торжок", "Торжок: федеральное издание пишет о разрушении исторического здания", 12),
];

const trustValues = [
  59.4, 59.4, 59.7, 60.2, 60.3, 60.1, 60.2, 60.2, 59.9, 59.6, 59.8, 60, 60, 60.3, 60.8, 60.9, 60.7, 60.6, 60.6, 60.3,
  58.3, 58.7, 59.4, 60, 60.6, 61.4, 61.7, 61.6, 61.7, 61.3,
];
const previewTrust: TrustSummary = {
  day: today,
  value: 61.3,
  delta_day: -0.4,
  delta_week: 1.9,
  components: { media_tone: null, appeals_resolved: null, response_speed: null, survey: null },
  series: trustValues.map((value, i) => ({
    day: addDays(today, i - trustValues.length + 1),
    value,
    event_label: i === 20 ? "Авария" : i === 23 ? "Вернули воду" : null,
    event_kind: i === 20 ? "incident" : i === 23 ? "project" : null,
  })),
};
