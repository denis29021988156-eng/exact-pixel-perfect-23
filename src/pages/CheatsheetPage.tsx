import { cheatsheetSectors } from '@/data/mock';
import { Copy, Check, Route, Building2, Wrench, Trees, Users, Landmark, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const sectorIcons: Record<string, React.ReactNode> = {
  road: <Route className="w-5 h-5" />,
  building: <Building2 className="w-5 h-5" />,
  wrench: <Wrench className="w-5 h-5" />,
  trees: <Trees className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  crane: <Landmark className="w-5 h-5" />,
  wallet: <Wallet className="w-5 h-5" />,
};

export default function CheatsheetPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = cheatsheetSectors.map(s => {
      const metricsText = s.metrics.map(m => `  • ${m.label}: ${m.value}${m.unit ? ' ' + m.unit : ''}`).join('\n');
      return `📊 ${s.name}\n${metricsText}`;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Шпаргалка скопирована в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Шпаргалка</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ключевые цифры города по 7 отраслям</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Скопировано!' : 'Скопировать всё'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cheatsheetSectors.map((sector) => (
          <div key={sector.id} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {sectorIcons[sector.icon]}
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
    </div>
  );
}
