import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, AlertTriangle, FolderKanban, ClipboardCheck, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface SectorData {
  name: string;
  icon: React.ReactNode;
  metrics: { label: string; value: string; unit?: string }[];
}

export default function CheatsheetPage() {
  const [copied, setCopied] = useState(false);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [incRes, projRes, taskRes, ctrRes] = await Promise.all([
      supabase.from('incidents').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('contracts').select('*'),
    ]);

    const incidents = incRes.data || [];
    const projects = projRes.data || [];
    const tasks = taskRes.data || [];
    const contracts = ctrRes.data || [];

    const active = incidents.filter(i => i.status !== 'closed');
    const critical = incidents.filter(i => i.severity === 'high' && i.status !== 'closed');
    const slaOverdue = incidents.filter(i => i.sla_overdue);
    const social = incidents.filter(i => i.social_object && i.status !== 'closed');

    const onTrack = projects.filter(p => p.status === 'on_track');
    const riskProj = projects.filter(p => p.status === 'risk');
    const overdueProj = projects.filter(p => p.status === 'overdue');
    const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;

    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    const overdueTasks = tasks.filter(t => t.overdue);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const totalBudget = contracts.reduce((s, c) => s + (c.amount || 0), 0);
    const highRisk = contracts.filter(c => c.risk_level === 'high');

    const data: SectorData[] = [
      {
        name: 'Инциденты',
        icon: <AlertTriangle className="w-5 h-5" />,
        metrics: [
          { label: 'Активных', value: String(active.length) },
          { label: 'Критических', value: String(critical.length) },
          { label: 'Просрочено SLA', value: String(slaOverdue.length) },
          { label: 'Соцобъекты', value: String(social.length) },
          { label: 'Всего за всё время', value: String(incidents.length) },
        ],
      },
      {
        name: 'Проекты',
        icon: <FolderKanban className="w-5 h-5" />,
        metrics: [
          { label: 'Всего', value: String(projects.length) },
          { label: 'В срок', value: String(onTrack.length) },
          { label: 'Под риском', value: String(riskProj.length) },
          { label: 'Просрочено', value: String(overdueProj.length) },
          { label: 'Средний прогресс', value: String(avgProgress), unit: '%' },
        ],
      },
      {
        name: 'Поручения',
        icon: <ClipboardCheck className="w-5 h-5" />,
        metrics: [
          { label: 'Активных', value: String(activeTasks.length) },
          { label: 'Просрочено', value: String(overdueTasks.length) },
          { label: 'Выполнено', value: String(completedTasks.length) },
          { label: 'Всего', value: String(tasks.length) },
        ],
      },
      {
        name: 'Контракты',
        icon: <TrendingUp className="w-5 h-5" />,
        metrics: [
          { label: 'Всего', value: String(contracts.length) },
          { label: 'Высокий риск', value: String(highRisk.length) },
          { label: 'Общий бюджет', value: totalBudget >= 1_000_000 ? `${(totalBudget / 1_000_000).toFixed(1)}` : String(totalBudget), unit: totalBudget >= 1_000_000 ? 'млн ₽' : '₽' },
        ],
      },
    ];

    setSectors(data);
    setLoading(false);
  }

  const handleCopy = () => {
    const text = sectors.map(s => {
      const metricsText = s.metrics.map(m => `  • ${m.label}: ${m.value}${m.unit ? ' ' + m.unit : ''}`).join('\n');
      return `📊 ${s.name}\n${metricsText}`;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Шпаргалка скопирована в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Шпаргалка</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ключевые цифры города — из реальных данных</p>
        </div>
        <button
          onClick={handleCopy}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Скопировано!' : 'Скопировать всё'}
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Загрузка статистики...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((sector) => (
            <div key={sector.name} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {sector.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground">{sector.name}</h3>
              </div>
              <div className="space-y-2.5">
                {sector.metrics.map((m, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {m.value}{m.unit ? <span className="text-xs text-muted-foreground font-normal ml-1">{m.unit}</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
