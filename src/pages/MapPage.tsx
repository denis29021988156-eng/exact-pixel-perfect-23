import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import StatusBadge from '@/components/StatusBadge';
import { MapPin, AlertTriangle, Filter } from 'lucide-react';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const severityColors: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
const severityLabels: Record<string, string> = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' };
const statusLabels: Record<string, string> = { new: 'Новый', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт' };
const typeLabels: Record<string, string> = { housing: 'ЖКХ', road: 'Дороги', social: 'Соцсфера', ecology: 'Экология', transport: 'Транспорт', other: 'Другое' };

function createIcon(severity: string) {
  const color = severityColors[severity] || '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Balashikha center
const CITY_CENTER: [number, number] = [55.7963, 37.9382];

type Incident = Tables<'incidents'> & { lat?: number | null; lng?: number | null };

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    supabase.from('incidents').select('*').not('lat', 'is', null).not('lng', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setIncidents((data as Incident[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = incidents.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    high: filtered.filter(i => i.severity === 'high').length,
    medium: filtered.filter(i => i.severity === 'medium').length,
    low: filtered.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Карта города</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Балашиха · Инциденты на карте</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ef4444]" /> {stats.high}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#f59e0b]" /> {stats.medium}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#22c55e]" /> {stats.low}</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все уровни</option>
          <option value="high">Высокая</option>
          <option value="medium">Средняя</option>
          <option value="low">Низкая</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все типы</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} инцидентов</span>
      </div>

      <div className="glass-card overflow-hidden rounded-xl" style={{ height: 'calc(100vh - 260px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Загрузка карты...</p>
          </div>
        ) : (
          <MapContainer center={CITY_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(inc => (
              <Marker key={inc.id} position={[inc.lat!, inc.lng!]} icon={createIcon(inc.severity)}>
                <Popup maxWidth={280}>
                  <div className="text-sm space-y-1.5 py-1">
                    <div className="font-bold text-foreground">{inc.title}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: severityColors[inc.severity] + '20', color: severityColors[inc.severity] }}>{severityLabels[inc.severity]}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{statusLabels[inc.status]}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{typeLabels[inc.type]}</span>
                    </div>
                    {inc.address && <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{inc.address}</div>}
                    {inc.responsible && <div className="text-xs text-muted-foreground">Отв: {inc.responsible}</div>}
                    {inc.sla_overdue && <div className="text-xs text-red-500 font-medium">⚠ SLA просрочен</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
