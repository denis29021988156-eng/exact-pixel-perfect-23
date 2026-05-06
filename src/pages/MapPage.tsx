import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { MapPin, Filter, Layers, Flame, CircleDot } from 'lucide-react';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const severityColors: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };
const severityLabels: Record<string, string> = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' };
const statusLabels: Record<string, string> = { new: 'Новый', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт' };
const typeLabels: Record<string, string> = { housing: 'ЖКХ', road: 'Дороги', social: 'Соцсфера', ecology: 'Экология', transport: 'Транспорт', other: 'Другое' };
const severityWeight: Record<string, number> = { low: 0.3, medium: 0.6, high: 1.0 };

// Реутов city boundary (real OSM data, simplified)
const REUTOV_BOUNDARY: [number, number][] = [
  [55.74718, 37.84254], [55.74633, 37.84315], [55.74531, 37.8448], [55.74459, 37.8468],
  [55.7445, 37.848], [55.74462, 37.84971], [55.74478, 37.8517], [55.74495, 37.85392],
  [55.74512, 37.85807], [55.74524, 37.86054], [55.74557, 37.86323], [55.7458, 37.86456],
  [55.74586, 37.86478], [55.74749, 37.87324], [55.74883, 37.88004], [55.74934, 37.88254],
  [55.74991, 37.88528], [55.75053, 37.88635], [55.75147, 37.88794], [55.7517, 37.89054],
  [55.75238, 37.89058], [55.75245, 37.89088], [55.75307, 37.8893], [55.75458, 37.88911],
  [55.75477, 37.88935], [55.75735, 37.88816], [55.75742, 37.88787], [55.7577, 37.88769],
  [55.75828, 37.88733], [55.75794, 37.88562], [55.75772, 37.88455], [55.75843, 37.88238],
  [55.75965, 37.88204], [55.76014, 37.88247], [55.76065, 37.88306], [55.76116, 37.88348],
  [55.76343, 37.88195], [55.7648, 37.88287], [55.7653, 37.88385], [55.76584, 37.88529],
  [55.76609, 37.8852], [55.76703, 37.8845], [55.76714, 37.88434], [55.76766, 37.88404],
  [55.76762, 37.88378], [55.76911, 37.88291], [55.77047, 37.88162], [55.77101, 37.88142],
  [55.77108, 37.88194], [55.77113, 37.88188], [55.77199, 37.88203], [55.77275, 37.88131],
  [55.77372, 37.87933], [55.77395, 37.87885], [55.77454, 37.87816], [55.77424, 37.87635],
  [55.77386, 37.87265], [55.77334, 37.87086], [55.77314, 37.86976], [55.77325, 37.86959],
  [55.77426, 37.86874], [55.77792, 37.86565], [55.77825, 37.86537], [55.77873, 37.86495],
  [55.78205, 37.86806], [55.78198, 37.86185], [55.78086, 37.85737], [55.7799, 37.8535],
  [55.77857, 37.85068], [55.7783, 37.84988], [55.77797, 37.84893], [55.77787, 37.84865],
  [55.7774, 37.84718], [55.77717, 37.84637], [55.77646, 37.8454], [55.77531, 37.84381],
  [55.77473, 37.8434], [55.77385, 37.84356], [55.77284, 37.84357], [55.77114, 37.84445],
  [55.77102, 37.84459], [55.77004, 37.84514], [55.76861, 37.84593], [55.76797, 37.84519],
  [55.76728, 37.84383], [55.76691, 37.8435], [55.76517, 37.8434], [55.7624, 37.84326],
  [55.7622, 37.84341], [55.76185, 37.8432], [55.76046, 37.84316], [55.75893, 37.84307],
  [55.75873, 37.84305], [55.75557, 37.8429], [55.75506, 37.84289], [55.75474, 37.84279],
  [55.75436, 37.84278], [55.75379, 37.84271], [55.75282, 37.84272], [55.75081, 37.84274],
  [55.74907, 37.84268], [55.74718, 37.84254],
];

function createIcon(severity: string) {
  const color = severityColors[severity] || '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 4px ${color}33, 0 4px 14px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

// Реутов — центр города и оптимальный зум, чтобы границы Реутова занимали экран
const CITY_CENTER: [number, number] = [55.7613, 37.8617];
const CITY_ZOOM = 14;
const REUTOV_BOUNDS: L.LatLngBoundsExpression = [
  [55.7445, 37.8420],
  [55.7825, 37.8910],
];

type Incident = Tables<'incidents'> & { lat?: number | null; lng?: number | null };

// Автоподгон под границы Реутова при загрузке
function FitToReutov() {
  const map = useMap();
  const didFitRef = useRef(false);
  useEffect(() => {
    if (didFitRef.current) return;
    didFitRef.current = true;
    map.fitBounds(REUTOV_BOUNDS, { padding: [24, 24] });
  }, [map]);
  return null;
}

// Heatmap layer component
function HeatmapLayer({ incidents }: { incidents: Incident[] }) {
  const map = useMap();
  const heatRef = useRef<any>(null);

  useEffect(() => {
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
    }

    const points = incidents
      .filter(i => i.lat && i.lng)
      .map(i => [i.lat!, i.lng!, severityWeight[i.severity] || 0.5] as [number, number, number]);

    if (points.length > 0) {
      heatRef.current = (L as any).heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.2: '#2ECC71', 0.5: '#F1C40F', 0.8: '#E74C3C', 1.0: '#991b1b' },
      }).addTo(map);
    }

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
      }
    };
  }, [map, incidents]);

  return null;
}

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

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
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Карта города</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Реутов · Инциденты на карте</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.high > 0 && <span className="red-zone-badge">RED ZONE · {stats.high}</span>}
          <div className="flex items-center gap-3 text-xs px-3 py-1.5 rounded-xl bg-card border border-border">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} /> {stats.high}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} /> {stats.medium}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} /> {stats.low}</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-surface-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все уровни</option>
          <option value="high">Высокая</option>
          <option value="medium">Средняя</option>
          <option value="low">Низкая</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-surface-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все типы</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} инцидентов</span>

        <div className="ml-auto flex items-center gap-1">
          <Layers className="w-4 h-4 text-muted-foreground mr-1" />
          <button
            onClick={() => setShowMarkers(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showMarkers ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:text-foreground border border-border'}`}
          >
            <CircleDot className="w-3.5 h-3.5" /> Маркеры
          </button>
          <button
            onClick={() => setShowHeatmap(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showHeatmap ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:text-foreground border border-border'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Тепловая карта
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl" style={{ height: 'calc(100vh - 260px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Загрузка карты...</p>
          </div>
        ) : (
          <MapContainer center={CITY_CENTER} zoom={CITY_ZOOM} minZoom={12} maxZoom={19} maxBounds={REUTOV_BOUNDS} maxBoundsViscosity={0.6} style={{ height: '100%', width: '100%', background: '#0F1524' }} zoomControl={true} attributionControl={false}>
            <FitToReutov />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <Polygon
              positions={REUTOV_BOUNDARY}
              pathOptions={{
                color: '#3B82F6',
                weight: 1.5,
                opacity: 0.5,
                fillColor: '#3B82F6',
                fillOpacity: 0.05,
              }}
            />
            {showHeatmap && <HeatmapLayer incidents={filtered} />}
            {showMarkers && filtered.map(inc => (
              <Marker key={inc.id} position={[inc.lat!, inc.lng!]} icon={createIcon(inc.severity)}>
                <Popup maxWidth={280}>
                  <div className="text-sm space-y-1.5 py-1">
                    <div className="font-bold text-foreground">{inc.title}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: severityColors[inc.severity] + '20', color: severityColors[inc.severity] }}>{severityLabels[inc.severity]}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{statusLabels[inc.status]}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{typeLabels[inc.type]}</span>
                    </div>
                    {inc.address && <div className="text-xs text-muted-foreground">📍 {inc.address}</div>}
                    {inc.responsible && <div className="text-xs text-muted-foreground">Отв: {inc.responsible}</div>}
                    {inc.sla_overdue && <div className="text-xs font-medium text-danger">⚠ SLA просрочен</div>}
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
