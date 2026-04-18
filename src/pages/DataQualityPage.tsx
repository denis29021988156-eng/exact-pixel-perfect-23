import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database, Activity, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid } from 'recharts';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  last_sync_at: string | null;
  success_rate: number;
  latency_minutes: number;
  reliability: number;
}

interface IngestionRow {
  id: string;
  source_id: string | null;
  status: string;
  records_in: number;
  records_normalized: number;
  records_failed: number;
  duration_ms: number | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  disabled: 'bg-muted text-muted-foreground border-border',
};

const TYPE_LABEL: Record<string, string> = {
  manual: 'Ручной ввод',
  email: 'Email',
  excel: 'Excel/CSV',
  telegram: 'Telegram',
  db: 'БД',
  api: 'API',
};

export default function DataQualityPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [logs, setLogs] = useState<IngestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Manual ingest form
  const [target, setTarget] = useState<'incident' | 'task' | 'complaint'>('incident');
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [address, setAddress] = useState('');

  const load = async () => {
    setLoading(true);
    const [srcRes, logRes] = await Promise.all([
      supabase.from('data_sources').select('*').order('type'),
      supabase.from('ingestion_log').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (srcRes.data) setSources(srcRes.data as DataSource[]);
    if (logRes.data) setLogs(logRes.data as IngestionRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalRecords = logs.reduce((s, l) => s + l.records_in, 0);
  const failedRecords = logs.reduce((s, l) => s + l.records_failed, 0);
  const errorRate = totalRecords > 0 ? Math.round((failedRecords / totalRecords) * 100) : 0;
  const automated = sources.filter((s) => s.type !== 'manual' && s.status === 'active').length;
  const manualPct = sources.length > 0 ? Math.round(((sources.length - automated) / sources.length) * 100) : 100;
  const avgLatency = sources.length > 0
    ? Math.round(sources.reduce((s, x) => s + Number(x.latency_minutes || 0), 0) / sources.length)
    : 0;

  // Build 7-day chart
  const chartData = (() => {
    const days: Record<string, { day: string; success: number; failed: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(5, 10);
      days[key] = { day: key, success: 0, failed: 0 };
    }
    logs.forEach((l) => {
      const key = l.created_at.slice(5, 10);
      if (days[key]) {
        days[key].success += l.records_normalized;
        days[key].failed += l.records_failed;
      }
    });
    return Object.values(days);
  })();

  const handleManualSubmit = async () => {
    if (!title && !rawText) {
      toast({ title: 'Заполните название или текст', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('ingest-manual', {
      body: {
        target,
        title: title || undefined,
        raw_text: rawText || undefined,
        address: address || undefined,
        topic: target === 'complaint' ? title || rawText.slice(0, 60) : undefined,
      },
    });
    setSubmitting(false);
    if (error || !data?.ok) {
      toast({ title: 'Ошибка ingestion', description: String(error?.message || data?.error), variant: 'destructive' });
      return;
    }
    toast({
      title: 'Запись принята',
      description: `Confidence: ${data.confidence}% · тип: ${data.type}`,
    });
    setTitle(''); setRawText(''); setAddress('');
    load();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Качество данных</h1>
        <p className="text-muted-foreground mt-1">
          Слой коннекторов: источники, ingestion, нормализация, confidence.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Источников</div>
            <div className="text-3xl font-bold mt-1">{sources.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {automated} автоматических
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Ручной ввод</div>
            <div className="text-3xl font-bold mt-1">{manualPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">от всех потоков</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Задержка</div>
            <div className="text-3xl font-bold mt-1">{avgLatency} мин</div>
            <div className="text-xs text-muted-foreground mt-1">средняя</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Ошибки</div>
            <div className={`text-3xl font-bold mt-1 ${errorRate > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {errorRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">{failedRecords} из {totalRecords}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual ingest */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" /> Быстрый ввод
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Тип записи</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as typeof target)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Инцидент</SelectItem>
                  <SelectItem value="task">Поручение</SelectItem>
                  <SelectItem value="complaint">Жалоба жителя</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Название / тема</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Прорыв трубы..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Свободный текст</Label>
              <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Опишите ситуацию — система сама определит тип и серьёзность" rows={3} />
            </div>
            {target === 'incident' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Адрес</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ул. Ленина, 12" />
              </div>
            )}
            <Button className="w-full" onClick={handleManualSubmit} disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить через коннектор'}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Запись пройдёт через staging → нормализация → confidence → целевая таблица.
            </p>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" /> Источники данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Источник</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Надёжность</TableHead>
                  <TableHead className="text-right">Последняя синхр.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{TYPE_LABEL[s.type] || s.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[s.status]}>
                        {s.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {s.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{Number(s.reliability)}%</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString('ru-RU') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 7-day chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> Ingestion за 7 дней
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RTooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="success" fill="hsl(var(--primary))" name="Успешно" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="hsl(0 70% 60%)" name="Ошибки" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center text-muted-foreground py-8">Загрузка...</div>}
    </div>
  );
}
