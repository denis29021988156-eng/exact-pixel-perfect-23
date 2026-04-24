import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle,
  ChevronRight,
  Clock,
  DatabaseZap,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Map,
  MessageSquare,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

const liveSignals = [
  { label: 'Критичный инцидент', value: 'локализован', tone: 'success' },
  { label: 'Проект', value: 'выведен из риска', tone: 'primary' },
  { label: 'Контракт', value: 'под контролем', tone: 'warning' },
];

const capabilityCards = [
  {
    icon: BrainCircuit,
    title: 'AI-копилот мэра',
    status: 'работает в демо',
    desc: 'Сводки, объяснение риска, быстрые ответы по инцидентам, проектам и поручениям.',
  },
  {
    icon: Map,
    title: 'Карта и heatmap',
    status: 'работает в демо',
    desc: 'Горячие точки жалоб и аварий видны на карте, чтобы быстрее направлять ресурсы.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Импорт Excel',
    status: 'настраивается под город',
    desc: 'Поддержка старых выгрузок: инциденты, поручения, проекты, контракты.',
  },
  {
    icon: MessageSquare,
    title: 'Telegram-жалобы',
    status: 'требует подключения',
    desc: 'Сбор обращений из рабочих чатов с AI-извлечением адреса, темы и срочности.',
  },
];

const workflow = [
  { step: '01', title: 'Сигнал', desc: 'Жалоба, Excel, Telegram или ручной ввод попадает в систему.' },
  { step: '02', title: 'Связь', desc: 'AI связывает инцидент с задачей, департаментом, проектом или контрактом.' },
  { step: '03', title: 'Решение', desc: 'Мэр видит приоритеты, SLA, риски и рекомендованное действие.' },
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
  { value: '8', label: 'недель до приёмки' },
  { value: '9', label: 'модулей платформы' },
  { value: '5–6', label: 'сотрудников обучаем' },
  { value: '24/7', label: 'мониторинг рисков' },
];

export default function LandingPage() {
  const navigate = useNavigate();

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

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Shield className="h-5 w-5 text-primary" />
          </span>
          <span>
            <span className="block text-sm font-extrabold leading-none tracking-tight">City Intelligence OS</span>
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
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              <Radio className="h-3.5 w-3.5 text-success ai-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Управляемый город · AI · SLA</span>
            </div>

            <h1 className="max-w-4xl text-[44px] font-extrabold leading-[0.98] tracking-normal text-foreground sm:text-[56px] lg:text-[68px]">
              Автоматизируйте управление городом и покажите контроль за 8 недель
            </h1>

            <p className="mt-7 max-w-2xl text-[18px] font-medium leading-[30px] text-foreground/75">
              Светлая управленческая платформа для мэра: инциденты, поручения, департаменты,
              проекты, контракты и жалобы связаны в единую картину принятия решений.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/app')}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-4 text-sm font-extrabold text-primary-foreground shadow-btn transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                Смотреть рабочее демо
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

          <div className="animate-fade-in-up lg:pl-6" style={{ animationDelay: '120ms' }}>
            <div className="rounded-[2rem] border border-border bg-card p-4 shadow-xl shadow-primary/10">
              <div className="rounded-[1.5rem] border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Live command center</p>
                    <h2 className="mt-1 text-[22px] font-extrabold leading-[28px] tracking-normal">Проверка управляемости</h2>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">online</span>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-danger">Инцидент → задача → департамент</p>
                        <p className="mt-2 text-[15px] font-bold leading-[22px] text-foreground">Прорыв теплотрассы связан с поручением ЖКХ</p>
                      </div>
                      <Target className="h-5 w-5 text-danger" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                      <span className="rounded-full bg-danger/10 px-3 py-1 text-danger">high</span>
                      <ChevronRight className="h-4 w-4" />
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">SLA 2ч</span>
                      <ChevronRight className="h-4 w-4" />
                      <span className="rounded-full bg-success/10 px-3 py-1 text-success">ЖКХ</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Проект → контракт</p>
                        <p className="mt-2 text-[15px] font-bold leading-[22px] text-foreground">Ремонт школы выведен из риска, контракт под контролем</p>
                      </div>
                      <Layers3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[76%] rounded-full bg-success" />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">Исполнение: 76%, риск снижен</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {metrics.slice(0, 3).map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-border bg-surface-muted p-4 text-center">
                        <p className="text-2xl font-extrabold text-foreground">{metric.value}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{metric.label}</p>
                      </div>
                    ))}
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

        <section id="capabilities" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="section-heading text-primary">Платформа</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">Часть функций уже работает, часть подключается на внедрении</h2>
            </div>
            <p className="max-w-2xl text-[17px] font-medium leading-[29px] text-foreground/70 lg:justify-self-end">
              Лендинг честно показывает заказчику текущее демо и будущую настройку: не набор обещаний,
              а понятную систему, которую можно поэтапно довести до промышленного контура.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="section-heading text-primary">Связность данных</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">Демо выглядит живым, потому что сущности связаны между собой</h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {workflow.map((item) => (
                <div key={item.step} className="rounded-3xl border border-border bg-background p-7 shadow-sm">
                  <p className="text-sm font-extrabold text-primary">{item.step}</p>
                  <h3 className="mt-5 text-[24px] font-extrabold leading-[30px] tracking-normal">{item.title}</h3>
                  <p className="mt-3 text-[14px] font-medium leading-[22px] text-foreground/65">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-border bg-background p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <DatabaseZap className="h-6 w-6 text-primary" />
                  <p className="text-[16px] font-extrabold leading-[22px]">Жалобы → heatmap → эскалация → поручение → департамент</p>
                </div>
                <button
                  onClick={() => navigate('/app/map')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold transition-colors hover:bg-surface-muted"
                >
                  Открыть карту
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="rollout" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-heading text-primary">Внедрение</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">3 этапа без бюджета в презентации</h2>
            <p className="mt-5 text-[17px] font-medium leading-[29px] text-foreground/70">
              Сроки: 2 недели + 4 недели + 2 недели. Внутри третьего этапа — обучение команды 5–6 человек за 5 дней.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {rollout.map((phase) => (
              <div key={phase.phase} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{phase.phase}</p>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{phase.title}</h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-extrabold text-primary">{phase.duration}</span>
                </div>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-semibold text-muted-foreground">
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
                  Демо для заказчика
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">Покажите не кризис, а управляемость</h2>
                <p className="mt-4 max-w-2xl text-primary-foreground/80">
                  Откройте приложение, публичный дашборд и презентацию как одну связанную историю внедрения.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  onClick={() => navigate('/app')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-foreground px-7 py-4 text-sm font-extrabold text-primary transition-all hover:-translate-y-0.5"
                >
                  Открыть приложение
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
          <p>© 2026 City Intelligence OS · Светлая платформа управления городом</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" /> RBAC</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> обучение 5–6 человек</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
