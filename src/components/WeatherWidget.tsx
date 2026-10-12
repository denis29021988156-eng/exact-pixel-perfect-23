import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, AlertTriangle, RefreshCw, Snowflake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WeatherAlert {
  id: string;
  alert_type: 'heavy_rain' | 'heavy_snow' | 'extreme_heat' | 'extreme_cold' | 'storm';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  peak_value: number | null;
  peak_unit: string | null;
  acknowledged: boolean;
  created_at: string;
}

interface Snapshot {
  city_name: string;
  fetched_at: string;
  current: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number; precipitation?: number };
  active_alerts: number;
}

const ALERT_ICONS = {
  heavy_rain: CloudRain,
  heavy_snow: CloudSnow,
  extreme_heat: Sun,
  extreme_cold: Snowflake,
  storm: Wind,
};

const SEVERITY_STYLES = {
  info: 'border-info/30 bg-info-soft text-info',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  danger: 'border-danger/40 bg-danger-soft text-danger',
};

function formatWindow(starts: string, ends: string) {
  const s = new Date(starts);
  const e = new Date(ends);
  const fmt = (d: Date) => d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return s.getTime() === e.getTime() ? fmt(s) : `${fmt(s)} → ${fmt(e)}`;
}

export default function WeatherWidget() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [snapRes, alertsRes] = await Promise.all([
      supabase.from('weather_snapshot').select('*').eq('id', 1).maybeSingle(),
      supabase.from('weather_alerts')
        .select('*')
        .eq('acknowledged', false)
        .gte('ends_at', new Date().toISOString())
        .order('severity', { ascending: false })
        .order('starts_at', { ascending: true })
        .limit(5),
    ]);
    if (snapRes.data) setSnapshot(snapRes.data as any);
    if (alertsRes.data) setAlerts(alertsRes.data as any);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('weather-widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weather_alerts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weather_snapshot' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('weather-check', { body: {} });
      if (error) throw error;
      toast.success('Прогноз обновлён');
      await load();
    } catch (e) {
      toast.error('Не удалось обновить прогноз');
    } finally {
      setRefreshing(false);
    }
  };

  const acknowledge = async (id: string) => {
    const { error } = await supabase.from('weather_alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Не удалось подтвердить');
    else { toast.success('Принято к сведению'); load(); }
  };

  const temp = snapshot?.current?.temperature_2m;
  const wind = snapshot?.current?.wind_speed_10m;
  const hasAlerts = alerts.length > 0;

  return (
    <div className={`glass-card p-5 ${hasAlerts ? 'border-l-4 border-l-warning' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasAlerts ? 'bg-warning/15' : 'bg-info/15'}`}>
            <Cloud className={`w-4.5 h-4.5 ${hasAlerts ? 'text-warning' : 'text-info'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Погода 72 часа</h3>
            <p className="text-[11px] text-muted-foreground">
              {snapshot?.city_name ?? '—'} · обновлено {snapshot ? new Date(snapshot.fetched_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {temp !== undefined && (
            <div className="text-right">
              <div className="text-xl font-bold text-foreground tabular-nums">{Math.round(temp)}°C</div>
              {wind !== undefined && <div className="text-[10px] text-muted-foreground">{wind.toFixed(0)} м/с</div>}
            </div>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-surface-muted hover:bg-surface-muted/70 transition disabled:opacity-50"
            title="Обновить прогноз"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!hasAlerts ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-success-soft border border-success/20">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-xs text-success font-medium">Угроз в ближайшие 72 часа не обнаружено</span>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => {
            const Icon = ALERT_ICONS[a.alert_type] ?? AlertTriangle;
            return (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${SEVERITY_STYLES[a.severity]}`}>
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold">{a.title}</p>
                    <span className="text-[10px] opacity-70 flex-shrink-0">{formatWindow(a.starts_at, a.ends_at)}</span>
                  </div>
                  {a.description && <p className="text-[11px] text-foreground/70 mt-1 leading-relaxed">{a.description}</p>}
                  <button
                    onClick={() => acknowledge(a.id)}
                    className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/60 hover:text-foreground transition"
                  >
                    Принято к сведению
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}