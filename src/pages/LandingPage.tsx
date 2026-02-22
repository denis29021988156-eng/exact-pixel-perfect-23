import { useNavigate } from 'react-router-dom';
import { Shield, Activity, BrainCircuit, Target, CheckCircle, ArrowRight, Zap, BarChart3, Eye } from 'lucide-react';

const steps = [
  { icon: Activity, title: 'Мониторинг', desc: 'Система агрегирует данные о городе в реальном времени — инциденты, проекты, задачи.' },
  { icon: BrainCircuit, title: 'Анализ', desc: 'AI выявляет риски, критические зоны и аномалии по всем городским системам.' },
  { icon: Target, title: 'Рекомендации', desc: 'Система предлагает конкретные управленческие действия на основе данных.' },
  { icon: CheckCircle, title: 'Контроль', desc: 'Отслеживание исполнения решений с автоматическим контролем дедлайнов.' },
];

const benefits = [
  { icon: Zap, text: 'Сокращение времени реакции на инциденты' },
  { icon: BarChart3, text: 'Централизация данных из всех источников' },
  { icon: Eye, text: 'Повышение управляемости и прозрачности' },
  { icon: BrainCircuit, text: 'Прогнозирование рисков до их наступления' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(232 60% 52% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(232 60% 52% / 0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 lg:px-16 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">City Intelligence OS</span>
        </div>
        <button
          onClick={() => navigate('/app')}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Войти в систему →
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 lg:pt-36 lg:pb-32 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-soft border border-primary/10 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-primary ai-pulse" />
          <span className="text-[11px] font-semibold text-primary tracking-wide">AI-POWERED PLATFORM</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-foreground tracking-tight leading-[1.1] max-w-4xl">
          City Intelligence
          <span className="block text-primary">OS</span>
        </h1>
        <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Интеллектуальная система управления городом.
          <br className="hidden sm:block" />
          Анализирует. Предсказывает. Рекомендует.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Открыть демо <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#how-it-works"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-surface border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-surface-muted transition-all"
          >
            Узнать больше
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="section-heading text-primary mb-3">Как это работает</h2>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">От данных к решениям за секунды</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="glass-card glass-card-hover p-7 text-center animate-fade-in-up"
              style={{ animationDelay: `${150 + i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2">{step.title}</h3>
              <p className="meta-text leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <div
          className="ai-card p-10 lg:p-14 text-center animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BrainCircuit className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">Встроенный городской AI</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
            Искусственный интеллект, который понимает контекст города и помогает принимать взвешенные управленческие решения.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Сводки', desc: 'Формирует ежедневные AI-брифинги для руководства' },
              { title: 'Риски', desc: 'Оценивает угрозы и предлагает превентивные меры' },
              { title: 'Решения', desc: 'Поддерживает принятие решений на основе данных' },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl bg-background/50">
                <h4 className="text-sm font-bold text-foreground mb-1.5">{item.title}</h4>
                <p className="meta-text leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 px-6 lg:px-16 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="section-heading text-primary mb-3">Преимущества</h2>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">Управление, основанное на данных</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="glass-card glass-card-hover p-6 flex items-center gap-5 animate-fade-in-up"
              style={{ animationDelay: `${150 + i * 80}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 lg:px-16 py-24 max-w-4xl mx-auto text-center">
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Готовы посмотреть систему в действии?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Откройте демо-версию и оцените возможности City Intelligence OS без регистрации.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Перейти в демо <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 text-center">
        <p className="meta-text">© 2025 City Intelligence OS · Интеллектуальная платформа управления городом</p>
      </footer>
    </div>
  );
}
