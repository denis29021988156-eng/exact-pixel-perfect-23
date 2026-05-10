import { useState } from 'react';
import {
  Copy, Check,
  ChevronDown, ChevronRight, Building2, Route, School, TreePine, Home,
  Droplets, Landmark
} from 'lucide-react';
import { toast } from 'sonner';

interface MetricItem {
  label: string;
  value: string;
  unit?: string;
  highlight?: 'danger' | 'warning' | 'success';
}

interface SectorBlock {
  name: string;
  icon: React.ReactNode;
  color: string;
  metrics: MetricItem[];
}

// ─── Тестовые данные по отраслям Реутова ───
const staticBlocks: SectorBlock[] = [
  {
    name: 'Строительство объектов',
    icon: <Building2 className="w-5 h-5" />,
    color: 'bg-primary/10 text-primary',
    metrics: [
      { label: 'Объектов в стройке', value: '14' },
      { label: 'Жилых домов', value: '6' },
      { label: 'Соцобъектов (школы, сады, поликлиники)', value: '5' },
      { label: 'Коммерческих объектов', value: '3' },
      { label: 'Завершено в 2026 году', value: '3', highlight: 'success' },
      { label: 'С отставанием от графика', value: '4', highlight: 'warning' },
      { label: 'Общая площадь в стройке', value: '128 500', unit: 'м²' },
    ],
  },
  {
    name: 'Дорожное хозяйство',
    icon: <Route className="w-5 h-5" />,
    color: 'bg-warning/10 text-warning',
    metrics: [
      { label: 'Отремонтировано дорог (2026)', value: '12.4', unit: 'км' },
      { label: 'План на год', value: '28', unit: 'км' },
      { label: 'Выполнение плана', value: '44', unit: '%', highlight: 'warning' },
      { label: 'Ямочный ремонт выполнен', value: '2 380', unit: 'м²' },
      { label: 'Новых дорог построено', value: '1.8', unit: 'км' },
      { label: 'Светофоров установлено / заменено', value: '7' },
      { label: 'Тротуаров обновлено', value: '4.2', unit: 'км' },
      { label: 'Активных контрактов на дороги', value: '8' },
    ],
  },
  {
    name: 'Образование',
    icon: <School className="w-5 h-5" />,
    color: 'bg-success/10 text-success',
    metrics: [
      { label: 'Школ в городе', value: '42' },
      { label: 'Школ на капремонте', value: '3', highlight: 'warning' },
      { label: 'Школ построено / введено', value: '1', highlight: 'success' },
      { label: 'Детских садов', value: '58' },
      { label: 'Новых мест в садах (2026)', value: '240' },
      { label: 'Спортзалов отремонтировано', value: '5' },
    ],
  },
  {
    name: 'Благоустройство дворов',
    icon: <Home className="w-5 h-5" />,
    color: 'bg-primary/10 text-primary',
    metrics: [
      { label: 'Дворов благоустроено (2026)', value: '34' },
      { label: 'План на год', value: '60' },
      { label: 'Детских площадок установлено', value: '18' },
      { label: 'Лавочек и урн установлено', value: '420' },
      { label: 'Освещение обновлено (дворов)', value: '22' },
      { label: 'Жалоб на дворы (в работе)', value: '12', highlight: 'warning' },
    ],
  },
  {
    name: 'Общественные пространства и парки',
    icon: <TreePine className="w-5 h-5" />,
    color: 'bg-success/10 text-success',
    metrics: [
      { label: 'Парков и скверов в городе', value: '15' },
      { label: 'Благоустроено в 2026', value: '3', highlight: 'success' },
      { label: 'В процессе реконструкции', value: '2' },
      { label: 'Набережная Пехорки', value: '45', unit: '% готовности' },
      { label: 'Высажено деревьев (2026)', value: '1 200' },
      { label: 'Площадь озеленения', value: '8.5', unit: 'га' },
    ],
  },
  {
    name: 'ЖКХ и коммуникации',
    icon: <Droplets className="w-5 h-5" />,
    color: 'bg-danger/10 text-danger',
    metrics: [
      { label: 'Замена труб водоснабжения', value: '4.8', unit: 'км' },
      { label: 'Замена теплотрасс', value: '2.1', unit: 'км' },
      { label: 'Аварий на сетях (за месяц)', value: '7', highlight: 'danger' },
      { label: 'Среднее время устранения аварии', value: '4.2', unit: 'ч' },
      { label: 'Домов после капремонта (2026)', value: '12' },
      { label: 'Лифтов заменено', value: '28' },
      { label: 'Подъездов отремонтировано', value: '156' },
    ],
  },
];

export default function CheatsheetPage() {
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (name: string) => {
    setOpenSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const allBlocks = staticBlocks;

  const handleCopy = () => {
    const text = allBlocks.map(s => {
      const metricsText = s.metrics.map(m => `  • ${m.label}: ${m.value}${m.unit ? ' ' + m.unit : ''}`).join('\n');
      return `📊 ${s.name}\n${metricsText}`;
    }).join('\n\n');

    navigator.clipboard.writeText(`Шпаргалка · г. Реутов\n${new Date().toLocaleDateString('ru-RU')}\n\n${text}`);
    setCopied(true);
    toast.success('Шпаргалка скопирована в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightColor = (h?: string) => {
    if (h === 'danger') return 'text-danger';
    if (h === 'warning') return 'text-warning';
    if (h === 'success') return 'text-success';
    return 'text-foreground';
  };

  const renderBlock = (block: SectorBlock) => {
    const isOpen = openSections[block.name] ?? false;
    return (
      <div key={block.name} className="glass-card overflow-hidden">
        <button
          onClick={() => toggleSection(block.name)}
          className="w-full flex items-center gap-3 p-5 text-left hover:bg-surface-muted/50 transition-colors"
        >
          <div className={`w-10 h-10 rounded-lg ${block.color} flex items-center justify-center flex-shrink-0`}>
            {block.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">{block.name}</h3>
            <p className="text-xs text-muted-foreground">{block.metrics.length} показателей</p>
          </div>
          {isOpen
            ? <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          }
        </button>
        {isOpen && (
          <div className="px-5 pb-5 space-y-2">
            {block.metrics.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <span className={`text-sm font-bold tabular-nums ${highlightColor(m.highlight)}`}>
                  {m.value}
                  {m.unit && <span className="text-xs text-muted-foreground font-normal ml-1">{m.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Шпаргалка</h1>
          <p className="text-sm text-muted-foreground mt-0.5">г. Реутов · Ключевые цифры для доклада</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg shadow-btn hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Скопировано!' : 'Скопировать всё'}
        </button>
      </div>

      <div>
        <p className="section-heading text-primary mb-3 flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5" />
          Отраслевые показатели
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staticBlocks.map(renderBlock)}
        </div>
      </div>
    </div>
  );
}
