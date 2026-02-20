import { useState } from 'react';
import { projects, contracts } from '@/data/mock';
import StatusBadge from '@/components/StatusBadge';
import { FolderKanban, FileText, AlertCircle, TrendingUp } from 'lucide-react';

const projStatusLabels: Record<string, string> = {
  in_progress: 'В работе', on_track: 'В срок', risk: 'Риск', overdue: 'Просрочено', completed: 'Завершено',
};
const projStatusVariants: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'muted'> = {
  in_progress: 'info', on_track: 'success', risk: 'warning', overdue: 'danger', completed: 'success',
};

const ctrStatusLabels: Record<string, string> = { tender: 'Торги', signed: 'Подписан', execution: 'Исполнение', closed: 'Закрыт' };
const riskVariants: Record<string, 'danger' | 'warning' | 'success'> = { normal: 'success', risk: 'warning', red: 'danger' };
const riskLabels: Record<string, string> = { normal: 'Норма', risk: 'Риск', red: 'Красный' };

export default function ProgramPage() {
  const [tab, setTab] = useState<'projects' | 'contracts'>('projects');

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Программа</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Нацпроекты, стройки и контракты</p>
      </div>

      <div className="flex bg-surface rounded-lg p-1 w-fit">
        <button onClick={() => setTab('projects')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'projects' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          <FolderKanban className="w-4 h-4" /> Объекты ({projects.length})
        </button>
        <button onClick={() => setTab('contracts')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'contracts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          <FileText className="w-4 h-4" /> Контракты ({contracts.length})
        </button>
      </div>

      {tab === 'projects' && (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className={`glass-card p-5 ${p.status === 'overdue' || p.status === 'risk' ? 'border-l-2 border-l-' + (p.status === 'overdue' ? 'danger' : 'warning') : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{p.id}</span>
                    <StatusBadge variant={projStatusVariants[p.status]}>{projStatusLabels[p.status]}</StatusBadge>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.department} · {p.responsible}</p>
                  {p.blockers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {p.blockers.map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-danger">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted-foreground mb-2">до {p.plannedEnd}</div>
                  <div className="w-24">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Прогресс</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.status === 'overdue' ? 'bg-danger' : p.status === 'risk' ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'contracts' && (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className={`glass-card p-5 ${c.risk === 'red' ? 'border-l-2 border-l-danger' : c.risk === 'risk' ? 'border-l-2 border-l-warning' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                    <StatusBadge variant={riskVariants[c.risk]}>{riskLabels[c.risk]}</StatusBadge>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface text-muted-foreground">{ctrStatusLabels[c.status]}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{c.contractor} · {c.amount}</p>
                  {c.comment && <p className="text-xs text-warning mt-1.5">{c.comment}</p>}
                </div>
                <div className="text-right flex-shrink-0 text-xs text-muted-foreground">
                  до {c.deadline}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
