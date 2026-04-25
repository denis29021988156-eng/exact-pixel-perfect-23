import { type CSSProperties, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle,
  ChevronRight,
  DatabaseZap,
  FileSpreadsheet,
  Globe,
  Layers3,
  Map,
  MessageSquare,
  Radio,
  Shield,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const defaultPublicMetrics = {
  activeIncidents: 24,
  criticalIncidents: 3,
  activeTasks: 42,
  activeProjects: 11,
  riskProjects: 2,
  totalBudget: 840,
  spentBudget: 512,
};

const liveSignals = [
  { label: 'MVP', value: 'уже показывает контур', tone: 'primary' },
  { label: 'Команда', value: 'видит роли и SLA', tone: 'success' },
  { label: 'После заказа', value: 'подключаем данные города', tone: 'warning' },
];

const capabilityCards = [
  {
    icon: BrainCircuit,
    title: 'AI-копилот мэра',
    status: 'работает в демо',
    desc: 'Отвечает на вопросы по городу, готовит сводки и объясняет приоритеты для решений.',
  },
  {
    icon: Radio,
    title: 'Инциденты и эскалации',
    status: 'работает в демо',
    desc: 'Критичные события, SLA и ответственные департаменты собраны в одном контуре.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel-импорт',
    status: 'работает в демо',
    desc: 'Старые выгрузки превращаются в нормализованные записи без ручной сборки таблиц.',
  },
  {
    icon: Map,
    title: 'Карта города',
    status: 'работает в демо',
    desc: 'Тепловая карта показывает районы напряжения, аварии и точки концентрации жалоб.',
  },
  {
    icon: DatabaseZap,
    title: 'Проверка связей',
    status: 'работает в демо',
    desc: 'Показывает цепочки инцидент → задача → департамент и проект → контракт.',
  },
  {
    icon: MessageSquare,
    title: 'Telegram-коннектор',
    status: 'настраивается под город',
    desc: 'Подключение городских чатов жалоб и автоматическое извлечение сути обращения.',
  },
  {
    icon: Target,
    title: 'Что если?',
    status: 'настраивается под регламенты',
    desc: 'Сценарии по ресурсам, срокам и рискам перед тем, как принять управленческое решение.',
  },
  {
    icon: BarChart3,
    title: 'Бюджет и контракты',
    status: 'развивается на внедрении',
    desc: 'Прогноз риска неисполнения по контрактам и проектам без показа сумм на лендинге.',
  },
  {
    icon: Globe,
    title: 'Публичный дашборд',
    status: 'работает в демо',
    desc: 'Открытая витрина показателей города для демонстрации прозрачности и динамики.',
  },
];

const pains = [
  ['Я узнаю о ЧП последним — из новостей или соцсетей', 'Критичное попадает в красную зону дашборда сразу после регистрации сигнала'],
  ['У каждого зама свой Excel, общей картины нет', 'Excel, ручной ввод и каналы обращений собираются в единый контур данных'],
  ['Поручения теряются между департаментами', 'Задачи, SLA и ответственные закрепляются в системе и видны по статусам'],
  ['О риске проекта узнают слишком поздно', 'Проекты и контракты показываются вместе, чтобы видеть риск до срыва срока'],
  ['Жалобы граждан разбросаны по чатам', 'Обращения агрегируются, классифицируются и направляются ответственным'],
  ['Для среза нужно собирать совещание', 'AI-копилот готовит короткую управленческую сводку за секунды'],
];

const operatingModel = [
  { role: 'Мэр', title: 'Принимает решения', points: ['Видит город на одном экране', 'Получает AI-сводки и прогнозы', 'Контролирует исполнение поручений'] },
  { role: 'Замы', title: 'Управляют своей зоной', points: ['Видят свой департамент', 'Получают эскалации по направлению', 'Назначают исполнителей и сроки'] },
  { role: '2–5 операторов', title: 'Вносят данные', points: ['Загружают Excel', 'Модерируют записи с низкой уверенностью', 'Подключают каналы обращений'] },
];

const workflow = [
  { step: '01', title: 'Сбор', desc: 'Excel-файлы, Telegram-чаты, письма, ручной ввод — 4 способа загрузки.' },
  { step: '02', title: 'AI-структурирование', desc: 'Gemini извлекает тип, серьёзность, адрес, ответственного из сырого текста.' },
  { step: '03', title: 'Оценка уверенности', desc: 'Каждая запись получает confidence-score. <60% — на модерацию оператору.' },
  { step: '04', title: 'Решения мэра', desc: 'Чистые данные → дашборд мэра → AI-рекомендации → поручения с SLA.' },
];

const rollout = [
  {
    phase: 'Этап 1',
    duration: '2 недели',
    title: 'Запуск основы',
    items: ['White-label под город', 'Импорт первичных данных', 'Роли мэра и операторов', 'Демо-дашборд управления'],
  },
  {
    phase: 'Этап 2',
    duration: '4 недели',
    title: 'Интеграции и AI',
    items: ['Карта и heatmap', 'AI-копилот и сводки', 'Сценарии SLA', 'Бюджетные риски и контракты'],
  },
  {
    phase: 'Этап 3',
    duration: '2 недели',
    title: 'Обучение и приёмка',
    items: ['5 дней обучения', '5–6 сотрудников', 'Регламенты работы', 'Передача и поддержка 30 дней'],
  },
];

const metrics = [
  { value: '1', label: 'мэр видит общую картину' },
  { value: '2–5', label: 'операторов вносят данные' },
  { value: '9', label: 'модулей демонстрации' },
  { value: '8', label: 'недель до приёмки' },
];

const starPositions = [
  { left: '6%',  top: '10%',  size: 14, delay: '0ms',   tone: 'text-primary/70' },
  { left: '14%', top: '68%',  size: 10, delay: '320ms', tone: 'text-foreground/40' },
  { left: '38%', top: '6%',   size: 12, delay: '520ms', tone: 'text-primary/60' },
  { left: '46%', top: '54%',  size: 9,  delay: '1100ms',tone: 'text-foreground/35' },
  { left: '62%', top: '22%',  size: 16, delay: '780ms', tone: 'text-primary/70' },
  { left: '70%', top: '74%',  size: 11, delay: '1320ms',tone: 'text-foreground/40' },
  { left: '88%', top: '14%',  size: 13, delay: '160ms', tone: 'text-primary/60' },
  { left: '92%', top: '58%',  size: 10, delay: '1480ms',tone: 'text-foreground/45' },
  { left: '4%',  top: '40%',  size: 8,  delay: '900ms', tone: 'text-foreground/35' },
  { left: '24%', top: '32%',  size: 7,  delay: '1700ms',tone: 'text-foreground/30' },
  { left: '54%', top: '88%',  size: 12, delay: '600ms', tone: 'text-primary/60' },
  { left: '78%', top: '44%',  size: 9,  delay: '1900ms',tone: 'text-foreground/40' },
  { left: '34%', top: '82%',  size: 10, delay: '420ms', tone: 'text-foreground/35' },
  { left: '18%', top: '20%',  size: 11, delay: '1240ms',tone: 'text-primary/55' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [publicMetrics, setPublicMetrics] = useState(defaultPublicMetrics);

  useEffect(() => {
    let mounted = true;

    supabase
      .from('public_metrics')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data) return;

        setPublicMetrics({
          activeIncidents: data.active_incidents ?? defaultPublicMetrics.activeIncidents,
          criticalIncidents: data.critical_incidents ?? defaultPublicMetrics.criticalIncidents,
          activeTasks: data.active_tasks ?? defaultPublicMetrics.activeTasks,
          activeProjects: data.active_projects ?? defaultPublicMetrics.activeProjects,
          riskProjects: data.risk_projects ?? defaultPublicMetrics.riskProjects,
          totalBudget: data.total_budget ?? defaultPublicMetrics.totalBudget,
          spentBudget: data.spent_budget ?? defaultPublicMetrics.spentBudget,
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const budgetPct = publicMetrics.totalBudget > 0
    ? Math.round((publicMetrics.spentBudget / publicMetrics.totalBudget) * 100)
    : 0;
  const healthScore = Math.max(42, Math.min(98, 92 - publicMetrics.criticalIncidents * 9 - publicMetrics.riskProjects * 4));
  const progressPeak = Math.min(100, healthScore + Math.max(5, publicMetrics.criticalIncidents * 2 + publicMetrics.riskProjects * 3));
  const progressStyle = {
    '--progress-base': `${healthScore}%`,
    '--progress-peak': `${progressPeak}%`,
  } as CSSProperties;
  const barMetrics = [
    publicMetrics.activeIncidents * 3,
    publicMetrics.activeTasks * 1.6,
    publicMetrics.activeProjects * 6,
    (publicMetrics.riskProjects + publicMetrics.criticalIncidents) * 12,
    budgetPct,
    healthScore,
    Math.max(18, 100 - publicMetrics.criticalIncidents * 14),
    Math.max(24, 100 - publicMetrics.riskProjects * 11),
  ].map((value) => Math.max(20, Math.min(96, Math.round(value))));

  // Premium mock operational rows for tablet (looks rich & alive)
  const opsRows = [
    { dept: 'ЖКХ',         metric: 'SLA',     value: '98%', tone: 'text-success', dot: 'bg-success' },
    { dept: 'Дороги',      metric: 'Задач',   value: '14',  tone: 'text-primary', dot: 'bg-primary' },
    { dept: 'Транспорт',   metric: 'Риск',    value: 'low', tone: 'text-success', dot: 'bg-success' },
    { dept: 'Соц. сфера',  metric: 'Жалоб',   value: '7',   tone: 'text-warning', dot: 'bg-warning' },
    { dept: 'Бюджет',      metric: 'Освоение',value: `${budgetPct}%`, tone: 'text-primary', dot: 'bg-primary' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        className="fixed inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, hsl(var(--primary) / 0.12), transparent 28rem), radial-gradient(circle at 82% 18%, hsl(var(--success) / 0.10), transparent 24rem), linear-gradient(hsl(var(--border) / 0.28) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.28) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 72px 72px, 72px 72px',
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {starPositions.map((star, idx) => (
          <Star
            key={`star-${idx}`}
            className={`landing-star absolute ${star.tone} drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]`}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
            strokeWidth={1.25}
            fill="currentColor"
          />
        ))}
      </div>

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Shield className="h-5 w-5 text-primary" />
          </span>
            <span>
              <span className="block text-sm font-extrabold leading-none tracking-tight">Планшет Мэра</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reutov demo</span>
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#capabilities" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Возможности</a>
          <a href="#rollout" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Этапы</a>
          <a href="/public" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Публичный дашборд</a>
        </nav>

        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-btn transition-all hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Открыть демо
          <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div className="animate-fade-in-up">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 shadow-sm backdrop-blur-xl">
              <Radio className="h-3.5 w-3.5 text-success ai-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">MVP · City AI · внедрение 8 недель</span>
            </div>

            <h1 className="max-w-4xl text-[44px] font-extrabold leading-[0.98] tracking-normal text-foreground sm:text-[56px] lg:text-[68px]">
              Автоматизируйте управление городом за 8 недель
            </h1>

            <p className="mt-7 max-w-2xl text-[18px] font-medium leading-[30px] text-foreground/75">
              MVP уже показывает управленческий контур: инциденты, поручения, проекты, контракты,
              обращения граждан и AI-сводки. После заказа платформа подключается к данным города,
              регламентам и рабочим каналам администрации.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/app')}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-4 text-sm font-extrabold text-primary-foreground shadow-btn transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Открыть демо мэра
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#rollout"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-7 py-4 text-sm font-extrabold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface-muted"
              >
                План внедрения
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {liveSignals.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  <p className={`mt-2 text-sm font-extrabold ${item.tone === 'success' ? 'text-success' : item.tone === 'warning' ? 'text-warning' : 'text-primary'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[512px] animate-fade-in-up lg:pl-2" style={{ animationDelay: '120ms' }}>
              <div className="tablet-shell tablet-shell-front relative mx-auto w-full max-w-[760px] rounded-[3rem] border border-foreground/10 bg-foreground p-3 shadow-[0_42px_110px_hsl(var(--foreground)/0.22)] lg:-mr-6 lg:translate-y-8">
              <div className="rounded-[2.4rem] border border-card/20 bg-card p-2">
              <div className="tablet-screen rounded-[2rem] border border-border bg-background p-4 shadow-inner">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-extrabold leading-[26px] tracking-normal">ИИ Дашборд</h2>
                  </div>
                  <span className="live-badge rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">online</span>
                </div>

                <div className="grid gap-2.5">
                  <div className="live-signal-row rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Индекс здоровья города</p>
                        <p className="mt-1.5 text-[36px] font-extrabold leading-none text-foreground">{healthScore}</p>
                        <p className="mt-1.5 text-[12px] font-bold text-foreground/65">Сводный показатель по инцидентам, проектам и поручениям</p>
                      </div>
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="live-progress-fill h-full rounded-full bg-primary transition-all duration-700" style={progressStyle} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      ['Инциденты', publicMetrics.activeIncidents, 'text-primary'],
                      ['Критичные', publicMetrics.criticalIncidents, 'text-danger'],
                      ['Поручения', publicMetrics.activeTasks, 'text-success'],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-2xl border border-border bg-surface-muted p-3 text-center">
                        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Активность за 24 часа</p>
                      <p className="text-[10px] font-bold tracking-wide text-success">+12.4%</p>
                    </div>
                    <div className="grid h-16 grid-cols-6 items-end gap-2 sm:h-20 sm:grid-cols-8 sm:gap-2.5">
                      {barMetrics.slice(0, 8).map((height, index) => (
                        <span
                          key={height + index}
                          className={`live-bar rounded-t-lg ${index >= 6 ? 'hidden sm:block' : ''} bg-gradient-to-t from-primary/80 to-primary/40`}
                          style={{
                            height: `${height}%`,
                            animationDelay: `${index * 120}ms`,
                            '--bar-low': Math.max(0.38, (height - 18) / height),
                            '--bar-high': Math.min(1.16, (height + 10) / height),
                          } as CSSProperties}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Оперативная сводка</p>
                      <span className="live-badge text-[10px] font-bold text-success">live</span>
                    </div>
                    <ul className="space-y-1.5">
                      {opsRows.map((row) => (
                        <li key={row.dept} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-1.5 w-1.5 rounded-full ${row.dot} ai-pulse`} />
                            <span className="text-[12px] font-bold text-foreground truncate">{row.dept}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{row.metric}</span>
                            <span className={`text-[12px] font-extrabold ${row.tone}`}>{row.value}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-border bg-surface-muted p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Проекты</p>
                      <p className="mt-1.5 text-xl font-extrabold text-foreground">{publicMetrics.activeProjects}</p>
                      <p className="live-badge text-xs font-bold text-warning">{publicMetrics.riskProjects} в риске</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-muted p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Бюджет</p>
                      <p className="mt-1.5 text-xl font-extrabold text-foreground">{budgetPct}%</p>
                      <p className="live-badge text-xs font-bold text-success">освоение</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-muted p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Витрина</p>
                      <p className="mt-1.5 text-xl font-extrabold text-foreground">live</p>
                      <p className="live-badge text-xs font-bold text-primary">/public</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/70 py-8 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 lg:grid-cols-4 lg:px-8">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">{metric.value}</p>
                <p className="mt-1 text-[13px] font-bold leading-[18px] text-foreground/65">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="section-heading text-primary">Вызовы мэра</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">Что заказчик видит уже в MVP</h2>
            </div>
            <p className="max-w-2xl text-[17px] font-medium leading-[29px] text-foreground/70 lg:justify-self-end">
              Страница показывает рабочий контур продукта: какие управленческие сценарии уже можно открыть,
              проверить и обсудить — и что будет настроено после запуска проекта.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {pains.map(([pain, solution]) => (
              <div key={pain} className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-danger">Вызов</p>
                  <p className="mt-3 text-[15px] font-extrabold leading-[23px] text-foreground">{pain}</p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-success">Что показывает платформа</p>
                  <p className="mt-3 text-[14px] font-semibold leading-[22px] text-foreground/70">{solution}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card/70 py-20 backdrop-blur lg:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="section-heading text-primary">Модель работы</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">Достаточно небольшой команды сотрудников и операторов</h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {operatingModel.map((item) => (
                <div key={item.role} className="rounded-3xl border border-border bg-background p-7 shadow-sm">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{item.title}</p>
                  <h3 className="mt-3 text-[28px] font-extrabold leading-[34px] tracking-normal text-foreground">{item.role}</h3>
                  <ul className="mt-6 space-y-3">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-[14px] font-semibold leading-[21px] text-foreground/65">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="section-heading text-primary">Возможности</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">9 модулей в одной демонстрационной платформе</h2>
            </div>
            <p className="max-w-2xl text-[17px] font-medium leading-[29px] text-foreground/70 lg:justify-self-end">
              MVP показывает основу платформы. На внедрении модули наполняются данными конкретного города,
              ролями сотрудников, регламентами SLA и подключёнными каналами обращений.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilityCards.map((card) => (
              <div key={card.title} className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <card.icon className="h-6 w-6" />
                </div>
                <p className="mb-3 inline-flex rounded-full bg-secondary px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{card.status}</p>
                <h3 className="text-[18px] font-extrabold leading-[24px] tracking-normal text-foreground">{card.title}</h3>
                <p className="mt-3 text-[14px] font-medium leading-[22px] text-foreground/65">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card/70 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="section-heading text-primary">Поток данных</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">От Excel-файла оператора до решения мэра — за минуты</h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-12 lg:grid-cols-4">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="flex h-full flex-col rounded-2xl border border-border bg-background p-5 shadow-sm sm:rounded-3xl sm:p-6 lg:p-7"
                >
                  <p className="text-xs font-extrabold tracking-wide text-primary sm:text-sm">{item.step}</p>
                  <h3 className="mt-3 text-[20px] font-extrabold leading-[26px] tracking-normal sm:mt-4 sm:text-[22px] sm:leading-[28px] lg:mt-5 lg:text-[24px] lg:leading-[30px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] font-medium leading-[21px] text-foreground/65 sm:mt-3 sm:leading-[22px] [text-wrap:pretty]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background p-5 shadow-sm sm:mt-8 sm:rounded-3xl sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3 sm:items-center">
                  <DatabaseZap className="mt-0.5 h-6 w-6 shrink-0 text-primary sm:mt-0" />
                  <p className="text-[14px] font-extrabold leading-[20px] sm:text-[16px] sm:leading-[22px] [text-wrap:balance]">
                    Excel / Telegram / ручной ввод → AI → SLA → дашборд мэра
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold transition-colors hover:bg-surface-muted lg:w-auto"
                >
                  Открыть демо
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="ai-assistant" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-10 rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
                <BrainCircuit className="h-4 w-4" />
                AI-ассистент в планшете
              </div>
              <h2 className="mt-5 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[44px] lg:leading-[52px]">
                Не чат-бот. Полноценный AI-ассистент мэра прямо внутри планшета
              </h2>
              <p className="mt-5 text-[17px] font-medium leading-[28px] text-foreground/70">
                Ассистент видит весь контекст города в реальном времени: инциденты, поручения,
                проекты, бюджет, жалобы, карту и SLA. Отвечает на вопросы текстом и готовит
                управленческие сводки за секунды — без переключения между вкладками.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ['Полный контекст', 'Видит все данные платформы — от инцидентов до контрактов'],
                  ['Аналитика на лету', '«Что критично сейчас?», «Подготовь доклад» — за секунды'],
                  ['Прогнозы и риски', 'Объясняет причины и подсвечивает зоны напряжения'],
                  ['Безопасность', 'Не меняет данные без подтверждения мэра'],
                ].map(([t, d]) => (
                  <li key={t} className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-[13px] font-extrabold text-foreground">{t}</p>
                    <p className="mt-1.5 text-[13px] font-medium leading-[19px] text-foreground/65">{d}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-border bg-background p-5 shadow-[0_24px_60px_hsl(var(--primary)/0.12)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="ai-pulse h-2 w-2 rounded-full bg-success" />
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">AI-ассистент · online</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-sm">
                    Что критично сейчас?
                  </div>
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3 text-[13px] font-medium leading-[20px] text-foreground">
                    <p>3 критичных инцидента в красной зоне. Главный риск — авария ЖКХ на ул. Победы, SLA через 40 минут.</p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px] font-bold">
                      <span className="rounded-lg bg-danger/10 px-2 py-1 text-danger">3 critical</span>
                      <span className="rounded-lg bg-warning/10 px-2 py-1 text-warning">2 SLA risk</span>
                      <span className="rounded-lg bg-primary/10 px-2 py-1 text-primary">1 эскалация</span>
                    </div>
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-sm">
                    Подготовь сводку для совещания
                  </div>
                  <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3 text-[13px] font-medium leading-[20px] text-foreground/85">
                    Готовлю короткий брифинг по 5 департаментам с приоритетами и предложениями…
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[13px] font-medium text-muted-foreground">Спросите ассистента о городе…</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="rollout" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-heading text-primary">Внедрение</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">От договора до приёмки — 8 недель</h2>
            <p className="mt-5 text-[17px] font-medium leading-[29px] text-foreground/70">
              Три этапа: запуск основы, настройка AI и интеграций, затем обучение 5–6 сотрудников за 5 рабочих дней.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {rollout.map((phase) => (
              <div key={phase.phase} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{phase.phase}</p>
                    <h3 className="mt-2 text-[24px] font-extrabold leading-[30px] tracking-normal">{phase.title}</h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-extrabold text-primary">{phase.duration}</span>
                </div>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] font-semibold leading-[21px] text-foreground/65">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-24 lg:px-8">
          <div className="rounded-[2rem] border border-border bg-primary p-8 text-primary-foreground shadow-xl shadow-primary/20 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-bold">
                  <Sparkles className="h-4 w-4" />
                  Планшет Мэра
                </div>
                <h2 className="text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[40px] lg:leading-[46px]">Откройте демо управленческого контура</h2>
                <p className="mt-4 max-w-2xl text-[16px] font-medium leading-[26px] text-primary-foreground/85">
                  Посмотрите, какие сценарии уже работают в MVP: дашборд мэра, публичная витрина,
                  инциденты, поручения, карта, AI-сводки и маршрут внедрения после заказа продукта.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  onClick={() => navigate('/app')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-foreground px-7 py-4 text-sm font-extrabold text-primary transition-all hover:-translate-y-0.5"
                >
                  Открыть демо мэра
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="/public"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary-foreground/30 px-7 py-4 text-sm font-extrabold text-primary-foreground transition-all hover:bg-primary-foreground/10"
                >
                  <Globe className="h-4 w-4" />
                  Публичный вид
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border bg-card/70 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 Планшет Мэра · Демонстрационная платформа управления городом</p>
        </div>
      </footer>
    </div>
  );
}
