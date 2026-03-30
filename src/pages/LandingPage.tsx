import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowRight, AlertTriangle, Map, BrainCircuit, MessageSquare,
  BarChart3, Users, Globe, TrendingUp, Clock, DollarSign, Lightbulb,
  CheckCircle, Zap, Eye, FileText, Newspaper
} from 'lucide-react';

const painPoints = [
  { icon: Clock, problem: 'Узнаёте о проблемах из соцсетей', solution: 'Система сама находит и показывает критичное' },
  { icon: AlertTriangle, problem: 'Просроченные задачи теряются', solution: 'Автоматические эскалации и напоминания' },
  { icon: Users, problem: 'Замы не видят свою зону', solution: 'Каждый видит только свой участок ответственности' },
  { icon: DollarSign, problem: 'Бюджет контрактов непрозрачен', solution: 'Прогноз рисков неисполнения по каждому контракту' },
];

const features = [
  {
    icon: BrainCircuit,
    title: 'AI-помощник мэра',
    desc: 'Задайте вопрос голосом или текстом — «Что критично сейчас?», «Подготовь доклад» — и получите ответ за секунды.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: AlertTriangle,
    title: 'Инциденты и эскалации',
    desc: 'Все аварии, жалобы и ЧП в одном месте. Просроченные SLA автоматически поднимаются наверх.',
    color: 'bg-danger/10 text-danger',
  },
  {
    icon: Map,
    title: 'Карта города',
    desc: 'Тепловая карта проблем. Сразу видно, где горячие точки и куда направить ресурсы.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Lightbulb,
    title: '«Что если?» — сценарии',
    desc: 'Добавить бюджет? Нанять людей? Система покажет прогноз: как изменится ситуация.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: MessageSquare,
    title: 'Пульс города',
    desc: 'Жалобы граждан из Telegram, Госуслуг и соцсетей в одном потоке с анализом настроений.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: DollarSign,
    title: 'Бюджет и контракты',
    desc: 'Прогноз неисполнения контрактов. Видите риски до того, как деньги будут потеряны.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: BarChart3,
    title: 'Бенчмарки',
    desc: 'Сравнение показателей города с нормативами. Где вы лучше среднего, а где — нет.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Newspaper,
    title: 'Репутация в СМИ',
    desc: 'Мониторинг упоминаний города в медиа. Соотношение позитива и негатива в одном графике.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Globe,
    title: 'Публичный дашборд',
    desc: 'Открытая страница для граждан: ключевые показатели города без регистрации.',
    color: 'bg-success/10 text-success',
  },
];

const stats = [
  { value: '10×', label: 'быстрее реакция на инциденты' },
  { value: '100%', label: 'контроль поручений и SLA' },
  { value: '0', label: 'потерянных задач и жалоб' },
  { value: '24/7', label: 'мониторинг без выходных' },
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
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16 lg:pt-32 lg:pb-28 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft border border-primary/10 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-primary ai-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wide">ПЛАТФОРМА ДЛЯ УПРАВЛЕНИЯ ГОРОДОМ</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] max-w-4xl">
          Весь город —
          <span className="text-primary"> на одном экране</span>
        </h1>

        <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Инциденты, бюджет, жалобы граждан, контракты, репутация — всё в одном месте.
          <br className="hidden sm:block" />
          AI-помощник подскажет, что делать прямо сейчас.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-btn hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Попробовать бесплатно <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#problems"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-card border border-border text-foreground text-sm font-semibold rounded-lg hover:bg-surface-muted transition-all"
          >
            Узнать больше
          </a>
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

      {/* ═══════ PAIN POINTS ═══════ */}
      <section id="problems" className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="section-heading text-danger mb-3">Знакомо?</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Проблемы, которые мы решаем</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {painPoints.map((p, i) => (
            <div key={i} className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <p.icon className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground line-through mb-1">{p.problem}</p>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    {p.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="section-heading text-primary mb-3">Возможности</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Всё, что нужно для управления городом</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            9 модулей, которые работают вместе. Каждый решает конкретную задачу.
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
                <span className="text-xs font-semibold text-primary">AI Copilot</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Спросите — система ответит
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Задавайте вопросы голосом или текстом. AI-помощник знает всё о текущей ситуации
                в городе и готовит ответы за секунды.
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

      {/* ═══════ WHO IT'S FOR ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="section-heading text-primary mb-3">Для кого</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Три роли — одна система</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              role: 'Мэр',
              desc: 'Видит полную картину города. Получает AI-сводки, утверждает сценарии, контролирует исполнение.',
              icon: Shield,
              color: 'bg-primary/10 text-primary',
            },
            {
              role: 'Заместитель',
              desc: 'Работает в своей зоне ответственности. Видит только свой департамент, но с полной глубиной.',
              icon: Users,
              color: 'bg-warning/10 text-warning',
            },
            {
              role: 'Сотрудник',
              desc: 'Создаёт инциденты, отслеживает задачи, получает уведомления об изменениях.',
              icon: FileText,
              color: 'bg-success/10 text-success',
            },
          ].map((r) => (
            <div key={r.role} className="glass-card glass-card-hover p-7 text-center animate-fade-in-up">
              <div className={`w-12 h-12 rounded-lg ${r.color} flex items-center justify-center mx-auto mb-4`}>
                <r.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{r.role}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="section-heading text-primary mb-3">Как это работает</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">4 шага от хаоса к контролю</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { step: '1', title: 'Подключение', desc: 'Данные из ваших систем автоматически попадают в платформу', icon: Zap },
            { step: '2', title: 'Анализ', desc: 'AI обрабатывает данные и выявляет риски, тренды и аномалии', icon: BrainCircuit },
            { step: '3', title: 'Рекомендации', desc: 'Система говорит, что делать, и прогнозирует результат', icon: TrendingUp },
            { step: '4', title: 'Контроль', desc: 'Поручения, дедлайны и эскалации — ничего не теряется', icon: CheckCircle },
          ].map((s, i) => (
            <div key={s.step} className="glass-card p-6 text-center animate-fade-in-up" style={{ animationDelay: `${100 + i * 60}ms` }}>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                {s.step}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative z-10 px-6 lg:px-16 py-24 max-w-4xl mx-auto text-center">
        <div className="animate-fade-in-up">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Готовы увидеть свой город на одном экране?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Откройте демо с реальными данными Балашихи. Без регистрации, без обязательств.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-btn hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Открыть демо <ArrowRight className="w-4 h-4" />
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
