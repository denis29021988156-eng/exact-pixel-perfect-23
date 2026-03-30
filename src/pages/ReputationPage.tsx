import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StatusBadge from '@/components/StatusBadge';
import PermissionGate from '@/components/PermissionGate';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MediaMention {
  id: string;
  source: string;
  url: string | null;
  title: string;
  sentiment: string;
  topic: string | null;
  published_at: string;
}

const sentimentLabels: Record<string, string> = { positive: 'Позитив', neutral: 'Нейтрально', negative: 'Негатив' };
const sentimentVariants: Record<string, 'success' | 'muted' | 'danger'> = { positive: 'success', neutral: 'muted', negative: 'danger' };
const COLORS = ['hsl(145 55% 45%)', 'hsl(220 15% 70%)', 'hsl(2 72% 52%)'];

export default function ReputationPage() {
  const [mentions, setMentions] = useState<MediaMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', source: '', url: '', sentiment: 'neutral', topic: '' });
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data } = await supabase
      .from('media_mentions')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100);
    setMentions((data as MediaMention[]) || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { error } = await supabase.from('media_mentions').insert({
      title: form.title.trim(),
      source: form.source.trim() || 'Вручную',
      url: form.url.trim() || null,
      sentiment: form.sentiment,
      topic: form.topic.trim() || null,
    });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Упоминание добавлено' });
      setForm({ title: '', source: '', url: '', sentiment: 'neutral', topic: '' });
      setShowAddForm(false);
      loadData();
    }
  }

  // Aggregate sentiment
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  mentions.forEach(m => {
    if (m.sentiment in sentimentCounts) sentimentCounts[m.sentiment as keyof typeof sentimentCounts]++;
  });
  const pieData = [
    { name: 'Позитив', value: sentimentCounts.positive },
    { name: 'Нейтрально', value: sentimentCounts.neutral },
    { name: 'Негатив', value: sentimentCounts.negative },
  ].filter(d => d.value > 0);

  // Topic aggregation
  const topicCounts: Record<string, { pos: number; neu: number; neg: number }> = {};
  mentions.forEach(m => {
    const t = m.topic || 'Без темы';
    if (!topicCounts[t]) topicCounts[t] = { pos: 0, neu: 0, neg: 0 };
    if (m.sentiment === 'positive') topicCounts[t].pos++;
    else if (m.sentiment === 'negative') topicCounts[t].neg++;
    else topicCounts[t].neu++;
  });
  const topicData = Object.entries(topicCounts)
    .sort(([, a], [, b]) => (b.pos + b.neu + b.neg) - (a.pos + a.neu + a.neg))
    .slice(0, 7)
    .map(([topic, counts]) => ({ topic, ...counts }));

  const negPct = mentions.length > 0 ? Math.round(sentimentCounts.negative / mentions.length * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading text-2xl">Репутация</h1>
          <p className="meta-text mt-1">Мониторинг упоминаний города в СМИ и соцсетях</p>
        </div>
        <PermissionGate roles={['mayor', 'deputy']}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </PermissionGate>
      </div>

      {showAddForm && (
        <div className="glass-card p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Заголовок *" className="col-span-2 px-3 py-2 text-sm rounded-lg border border-border bg-background" required />
            <input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="Источник" className="px-3 py-2 text-sm rounded-lg border border-border bg-background" />
            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="URL" className="px-3 py-2 text-sm rounded-lg border border-border bg-background" />
            <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="Тема" className="px-3 py-2 text-sm rounded-lg border border-border bg-background" />
            <select value={form.sentiment} onChange={e => setForm(p => ({ ...p, sentiment: e.target.value }))} className="px-3 py-2 text-sm rounded-lg border border-border bg-background">
              <option value="positive">Позитив</option>
              <option value="neutral">Нейтрально</option>
              <option value="negative">Негатив</option>
            </select>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs rounded-lg bg-muted text-muted-foreground">Отмена</button>
              <button type="submit" className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground">Добавить</button>
            </div>
          </form>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-[11px] text-muted-foreground mb-1">Всего упоминаний</p>
          <p className="text-2xl font-bold text-foreground">{mentions.length}</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-[11px] text-muted-foreground mb-1">Позитивных</p>
          <p className="text-2xl font-bold text-success">{sentimentCounts.positive}</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-[11px] text-muted-foreground mb-1">Негативных</p>
          <p className="text-2xl font-bold text-danger">{sentimentCounts.negative}</p>
        </div>
        <div className={`glass-card p-5 text-center ${negPct > 40 ? 'border-danger/20 bg-danger-soft/30' : ''}`}>
          <p className="text-[11px] text-muted-foreground mb-1">% негатива</p>
          <p className={`text-2xl font-bold ${negPct > 40 ? 'text-danger' : 'text-foreground'}`}>{negPct}%</p>
        </div>
      </div>

      {/* Charts */}
      {mentions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Тональность</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">По темам</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 92%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="topic" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="pos" name="Позитив" fill="hsl(145 55% 45%)" stackId="a" />
                  <Bar dataKey="neu" name="Нейтрально" fill="hsl(220 15% 70%)" stackId="a" />
                  <Bar dataKey="neg" name="Негатив" fill="hsl(2 72% 52%)" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Mentions list */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Последние упоминания</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : mentions.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">Нет упоминаний. Добавьте через кнопку выше.</p>
        ) : (
          <div className="space-y-2">
            {mentions.slice(0, 20).map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted/50">
                <StatusBadge variant={sentimentVariants[m.sentiment] || 'muted'}>{sentimentLabels[m.sentiment] || m.sentiment}</StatusBadge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-[11px] text-muted-foreground">{m.source} · {new Date(m.published_at).toLocaleDateString('ru-RU')}</p>
                </div>
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
