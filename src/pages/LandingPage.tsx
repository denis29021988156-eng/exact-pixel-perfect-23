import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowRight, AlertTriangle, Map, BrainCircuit, MessageSquare,
  BarChart3, Users, Globe, TrendingUp, Clock, DollarSign, Lightbulb,
  CheckCircle, Zap, FileText, Newspaper, FileSpreadsheet, Send,
  ShieldCheck, Filter, Crown, UserCog, Rocket, GraduationCap, Settings2, Radio
} from 'lucide-react';

// Боли мэра — что именно мешает управлять городом
const mayorPains = [
  {
    icon: Clock,
    pain: 'Я узнаю о ЧП последним — из новостей или соцсетей',
    fix: 'Критичное всплывает мгновенно в «Красной зоне» дашборда',
  },
  {
    icon: FileSpreadsheet,
    pain: 'Каждый зам присылает Excel в своём формате — я не вижу общую картину',
    fix: 'Excel, Telegram-чаты, письма — всё стекается в одну базу автоматически',
  },
  {
    icon: AlertTriangle,
    pain: 'Поручения теряются между департаментами, SLA срываются молча',
    fix: 'Авто-эскалации: просрочки и риски подсвечиваются в реальном времени',
  },
  {
    icon: DollarSign,
    pain: 'О срыве контракта узнаю, когда уже не вернуть деньги',
    fix: 'AI прогнозирует риск неисполнения по каждому контракту заранее',
  },
  {
    icon: MessageSquare,
    pain: 'Жалобы граждан копятся в десятке чатов — никто не агрегирует',
    fix: 'Telegram-бот собирает жалобы, AI извлекает суть, маршрутизирует ответственным',
  },
  {
    icon: BrainCircuit,
    pain: 'Чтобы получить срез по любому вопросу — нужно собирать совещание',
    fix: 'AI-копилот отвечает голосом за секунды: «Что критично?», «Покажи риски ЖКХ»',
  },
];

// Команда: МЭР + несколько операторов данных
const team = [
  {
    role: 'МЭР',
    headline: 'Принимает решения',
    icon: Crown,
    color: 'bg-primary/10 text-primary',
    border: 'border-primary/30',
    points: [
      'Видит весь город на одном экране',
      'Получает AI-сводки и прогнозы рисков',
      'Утверждает сценарии «что если»',
      'Контролирует исполнение поручений',
    ],
  },
  {
    role: 'Замы',
    headline: 'Управляют своей зоной',
    icon: UserCog,
    color: 'bg-warning/10 text-warning',
    border: 'border-warning/30',
    points: [
      'Видят только свой департамент (RBAC)',
      'Получают эскалации по своему направлению',
      'Назначают исполнителей и сроки',
      'Не видят чужие зоны — только свои KPI',
    ],
  },
  {
    role: '2–5 операторов',
    headline: 'Вносят данные',
    icon: FileText,
    color: 'bg-success/10 text-success',
    border: 'border-success/30',
    points: [
      'Загружают Excel из старых систем (1 клик)',
      'Подключают Telegram-чаты жалоб',
      'Модерируют записи с низкой уверенностью',
      'Не нужны айтишники — интерфейс простой',
    ],
  },
];

// Поток данных: как сырые данные превращаются в управленческие решения
const dataFlow = [
  {
    step: '01',
    title: 'Сбор',
    desc: 'Excel-файлы, Telegram-чаты, письма, ручной ввод — 4 способа загрузки',
    icon: Zap,
  },
  {
    step: '02',
    title: 'AI-структурирование',
    desc: 'Gemini извлекает тип, серьёзность, адрес, ответственного из сырого текста',
    icon: BrainCircuit,
  },
  {
    step: '03',
    title: 'Оценка уверенности',
    desc: 'Каждая запись получает confidence-score. <60% — на модерацию оператору',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Решения мэра',
    desc: 'Чистые данные → дашборд мэра → AI-рекомендации → поручения с SLA',
    icon: Crown,
  },
];

// Ключевые модули платформы
const features = [
  {
    icon: BrainCircuit,
    title: 'AI-помощник мэра',
    desc: 'Голосовые и текстовые запросы. Готовит доклады, объясняет цифры, предлагает решения.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: AlertTriangle,
    title: 'Инциденты и эскалации',
    desc: 'Все ЧП в одном месте. Просроченные SLA автоматически поднимаются в «Красную зону».',
    color: 'bg-danger/10 text-danger',
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel-импорт',
    desc: 'Загружайте .xlsx из старых систем. Маппинг колонок — за 30 секунд.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Send,
    title: 'Telegram-коннектор',
    desc: 'Городские чаты жалоб подключаются за минуту. AI парсит каждое сообщение.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Filter,
    title: 'Модерация низкой уверенности',
    desc: 'Записи с confidence < 60% выводятся в очередь. Принять / Отклонить / Редактировать.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: Map,
    title: 'Карта города',
    desc: 'Тепловая карта проблем. Видно, где горячие точки и куда направлять ресурсы.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Lightbulb,
    title: '«Что если?» — сценарии',
    desc: 'Добавить бюджет? Нанять людей? Платформа покажет прогноз: как изменится ситуация.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: DollarSign,
    title: 'Бюджет и контракты',
    desc: 'Прогноз неисполнения по каждому контракту. Видите риск до того, как потеряли деньги.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: BarChart3,
    title: 'Бенчмарки и репутация',
    desc: 'Сравнение с нормативами, мониторинг СМИ, анализ настроений граждан.',
    color: 'bg-primary/10 text-primary',
  },
];

const stats = [
  { value: '1', label: 'мэр видит всё' },
  { value: '2–5', label: 'операторов вносят данные' },
  { value: '4', label: 'канала загрузки данных' },
  { value: '24/7', label: 'AI-мониторинг города' },
];

// 3 этапа внедрения для Реутова
const rolloutPhases = [
  {
    step: '01',
    duration: '2 недели',
    title: 'Запуск и базовая настройка',
    icon: Rocket,
    color: 'text-primary',
    bg: 'bg-primary/10',
    items: [
      'Развёртывание платформы под бренд города',
      'Импорт исторических данных из Excel/1С',
      'Подключение Telegram-каналов жалоб',
      'Базовая роль мэра + 1 оператор',
    ],
  },
  {
    step: '02',
    duration: '4 недели',
    title: 'AI-модули и интеграции',
    icon: BrainCircuit,
    color: 'text-warning',
    bg: 'bg-warning/10',
    items: [
      'Тонкая настройка AI-копилота под лексику Реутова',
      'Подключение карты, бенчмарков и медиа-мониторинга',
      'Сценарии эскалаций и SLA по департаментам',
      'Бюджетный прогноз и риск-индекс контрактов',
    ],
  },
  {
    step: '03',
    duration: '2 недели',
    title: 'Обучение и приёмка',
    icon: GraduationCap,
    color: 'text-success',
    bg: 'bg-success/10',
    items: [
      'Обучение 5–6 сотрудников за 5 рабочих дней',
      'Регламенты работы для мэра, замов, операторов',
      'Приёмка по чек-листу и юридическая передача',
      'Гарантийная поддержка 30 дней',
    ],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(204 70% 53% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(204 70% 53% / 0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 lg:px-16 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">City Intelligence OS</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/public" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Открытые данные
          </a>
          <button
            onClick={() => navigate('/app')}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Войти →
          </button>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative z-10 px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 animate-fade-in-up overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-warning/5 blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card border border-border shadow-sm mb-10">
            <Radio className="w-3 h-3 text-success ai-pulse" />
            <span className="text-[11px] font-bold text-foreground tracking-[0.18em] uppercase">Tech OS · 2030 · Tablet of the Mayor</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tighter leading-[1.02] max-w-5xl">
            Город управляется
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">одним человеком</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/10 -z-0 rounded-sm" />
            </span>
          </h1>

          <p className="mt-8 text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Мэр видит весь город на одном экране. Команда из 3–5 операторов загружает данные —
            AI превращает их в чистую картину для решений.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-12">
            <button
              onClick={() => navigate('/app')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Открыть демо мэра
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#rollout"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-card border border-border text-foreground text-sm font-semibold rounded-lg hover:border-primary/40 hover:bg-surface-muted transition-all"
            >
              План внедрения
            </a>
          </div>

          {/* Inline trust strip */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] text-muted-foreground tracking-wide">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> RBAC и аудит-лог</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Размещение в РФ</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> Без vendor lock-in</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> White-label под город</span>
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto">
        <div className="glass-card p-6 lg:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl lg:text-4xl font-extrabold text-primary tracking-tight">{s.value}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ MAYOR PAINS — главный блок ═══════ */}
      <section id="pains" className="relative z-10 px-6 lg:px-16 py-20 lg:py-28 max-w-6xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="section-heading text-danger mb-3">Боли мэра</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground max-w-2xl mx-auto leading-tight">
            6 болей, из-за которых мэр теряет контроль над городом
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            И как платформа закрывает каждую из них.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {mayorPains.map((p, i) => (
            <div key={i} className="glass-card p-7 animate-fade-in-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-danger uppercase tracking-wider mb-1.5">Боль</p>
                  <p className="text-sm text-foreground leading-relaxed">{p.pain}</p>
                </div>
              </div>
              <div className="pl-14">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Решение</p>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{p.fix}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ TEAM MODEL — 1 мэр + операторы ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 lg:py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="section-heading text-primary mb-3">Модель работы</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground max-w-2xl mx-auto leading-tight">
            Не нужен IT-отдел. Достаточно мэра и нескольких операторов
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Платформа спроектирована так, чтобы городом мог управлять один человек —
            с минимальной командой, которая просто загружает данные.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {team.map((t, i) => (
            <div
              key={t.role}
              className={`glass-card p-7 border-2 ${t.border} animate-fade-in-up`}
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-lg ${t.color} flex items-center justify-center mb-5`}>
                <t.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t.headline}</p>
              <h3 className="text-2xl font-extrabold text-foreground mb-5">{t.role}</h3>
              <ul className="space-y-2.5">
                {t.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ DATA FLOW — как сырые данные становятся решениями ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 lg:py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="section-heading text-primary mb-3">Поток данных</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground max-w-2xl mx-auto leading-tight">
            От Excel-файла оператора до решения мэра — за минуты
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {dataFlow.map((s, i) => (
            <div key={s.step} className="glass-card p-6 animate-fade-in-up relative" style={{ animationDelay: `${100 + i * 80}ms` }}>
              <p className="text-xs font-bold text-primary tracking-widest mb-3">{s.step}</p>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="section-heading text-primary mb-3">Возможности</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">9 модулей в одной платформе</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Каждый модуль решает конкретную задачу мэра. Все работают вместе.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card glass-card-hover p-6 animate-fade-in-up"
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              <div className={`w-11 h-11 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ AI COPILOT HERO ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <div className="ai-card p-10 lg:p-14 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-5">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">AI Copilot мэра</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Спросите — система ответит
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                AI знает всё о текущей ситуации в городе. Готовит ответы за секунды —
                голосом или текстом, на основе чистых данных, которые загрузили операторы.
              </p>
              <div className="space-y-3">
                {[
                  '«Что критично сейчас?»',
                  '«Подготовь доклад по ЖКХ»',
                  '«Покажи риски по транспорту»',
                  '«Сколько просрочено SLA?»',
                ].map((q) => (
                  <div key={q} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{q}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-success ai-pulse" />
                  <span className="text-xs font-semibold text-muted-foreground">City Copilot Online</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-muted text-sm text-foreground">
                  Что критично сейчас?
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-foreground">
                  <p className="font-medium text-primary text-xs mb-1">AI ответ:</p>
                  3 критических инцидента, 2 просрочены по SLA. Прорыв теплотрассы требует немедленного внимания.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-24 max-w-4xl mx-auto text-center">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Готовы управлять городом одним человеком?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Откройте демо с реальными данными Реутова. Без регистрации, без обязательств.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-btn hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Открыть демо мэра <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/public"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-card border border-border text-foreground text-sm font-semibold rounded-lg hover:bg-surface-muted transition-all"
            >
              <Globe className="w-4 h-4" />
              Публичный дашборд
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 text-center">
        <p className="text-sm text-muted-foreground">© 2026 City Intelligence OS · Интеллектуальная платформа управления городом</p>
      </footer>
    </div>
  );
}
