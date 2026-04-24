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
  { label: 'Мэр', value: 'видит всё', tone: 'primary' },
  { label: 'Операторы', value: 'вносят данные', tone: 'success' },
  { label: 'AI', value: 'готовит сводки', tone: 'warning' },
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
  { step: '01', title: 'Сбор', desc: 'Excel-файлы, Telegram-чаты, письма и ручной ввод попадают в одну систему.' },
  { step: '02', title: 'Структурирование', desc: 'AI извлекает тип, адрес, срочность, ответственного и качество данных.' },
  { step: '03', title: 'Контроль', desc: 'Система показывает SLA, риски, связи между сущностями и приоритеты.' },
  { step: '04', title: 'Решение', desc: 'Мэр видит чистую картину и принимает решение без сбора ручных отчётов.' },
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
              Автоматизируйте управление городом за 8 недель
            </h1>

            <p className="mt-7 max-w-2xl text-[18px] font-medium leading-[30px] text-foreground/75">
              Демонстрационный контур показывает, как мэр видит город на одном экране: инциденты,
              поручения, проекты, контракты, обращения граждан и AI-сводки для решений.
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

          <div className="animate-fade-in-up lg:pl-6" style={{ animationDelay: '120ms' }}>
            <div className="rounded-[2rem] border border-border bg-card p-4 shadow-xl shadow-primary/10">
              <div className="rounded-[1.5rem] border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Live command center</p>
                    <h2 className="mt-1 text-[22px] font-extrabold leading-[28px] tracking-normal">Демо мэра</h2>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">online</span>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-danger">Инцидент → задача → департамент</p>
                        <p className="mt-2 text-[15px] font-bold leading-[22px] text-foreground">Прорыв теплотрассы передан в департамент ЖКХ</p>
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
                        <p className="mt-2 text-[15px] font-bold leading-[22px] text-foreground">Ремонт школы: проект, подрядчик и статус исполнения</p>
                      </div>
                      <Layers3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[76%] rounded-full bg-success" />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">Исполнение: 76%, требуется контроль срока</p>
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

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="section-heading text-primary">Боли мэра</p>
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">Что демонстрация показывает заказчику</h2>
            </div>
            <p className="max-w-2xl text-[17px] font-medium leading-[29px] text-foreground/70 lg:justify-self-end">
              Лендинг не продаёт обещание, а объясняет сценарий: какие проблемы управления уже видны в демо и что будет доведено до промышленного режима.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {pains.map(([pain, solution]) => (
              <div key={pain} className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-danger">Боль</p>
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
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">Достаточно мэра и небольшой команды операторов</h2>
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
              Часть модулей уже доступна в демо, часть требует подключения данных, регламентов и городских каналов на этапе внедрения.
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
              <h2 className="mt-4 text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[48px] lg:leading-[54px]">От сырого сигнала до решения мэра — за минуты</h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-4">
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
                  <p className="text-[16px] font-extrabold leading-[22px]">Excel / Telegram / ручной ввод → AI → SLA → дашборд мэра</p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold transition-colors hover:bg-surface-muted"
                >
                  Открыть демо
                  <ArrowRight className="h-4 w-4" />
                </button>
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
                  Демо для заказчика
                </div>
                <h2 className="text-[32px] font-extrabold leading-[38px] tracking-normal lg:text-[40px] lg:leading-[46px]">Покажите не кризис, а управляемость</h2>
                <p className="mt-4 max-w-2xl text-[16px] font-medium leading-[26px] text-primary-foreground/85">
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
