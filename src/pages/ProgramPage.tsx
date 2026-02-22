import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import StatusBadge from '@/components/StatusBadge';
import CreateProjectDialog from '@/components/forms/CreateProjectDialog';
import CreateContractDialog from '@/components/forms/CreateContractDialog';
import { FolderKanban, FileText, AlertCircle, Plus } from 'lucide-react';

const projStatusLabels: Record<string, string> = {
  on_track: 'В срок', risk: 'Риск', overdue: 'Просрочено', completed: 'Завершено',
};
const projStatusVariants: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'muted'> = {
  on_track: 'success', risk: 'warning', overdue: 'danger', completed: 'success',
};

const riskVariants: Record<string, 'danger' | 'warning' | 'success'> = { low: 'success', medium: 'warning', high: 'danger' };
const riskLabels: Record<string, string> = { low: 'Норма', medium: 'Риск', high: 'Красный' };

export default function ProgramPage() {
  const [tab, setTab] = useState<'projects' | 'contracts'>('projects');
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [contracts, setContracts] = useState<Tables<'contracts'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
    ]).then(([pRes, cRes]) => {
      setProjects(pRes.data || []);
      setContracts(cRes.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const formatAmount = (n: number | null) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₽`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₽`;
    return `${n} ₽`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Программа</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Нацпроекты, стройки и контракты</p>
        </div>
        <button
          onClick={() => tab === 'projects' ? setProjectDialogOpen(true) : setContractDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {tab === 'projects' ? 'Новый проект' : 'Новый контракт'}
        </button>
      </div>

      <div className="flex bg-surface rounded-lg p-1 w-fit">
        <button onClick={() => setTab('projects')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'projects' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          <FolderKanban className="w-4 h-4" /> Объекты ({projects.length})
        </button>
        <button onClick={() => setTab('contracts')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'contracts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          <FileText className="w-4 h-4" /> Контракты ({contracts.length})
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Загрузка...</p></div>
      ) : tab === 'projects' ? (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className={`glass-card p-5 ${p.status === 'overdue' ? 'border-l-2 border-l-danger' : p.status === 'risk' ? 'border-l-2 border-l-warning' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge variant={projStatusVariants[p.status]}>{projStatusLabels[p.status]}</StatusBadge>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.department} · {p.responsible}</p>
                  {p.blocker && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {p.blocker}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {p.planned_end && <div className="text-xs text-muted-foreground mb-2">до {p.planned_end}</div>}
                  <div className="w-24">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Прогресс</span>
                      <span>{p.progress ?? 0}%</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.status === 'overdue' ? 'bg-danger' : p.status === 'risk' ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${p.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Проектов нет</p></div>}
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className={`glass-card p-5 ${c.risk_level === 'high' ? 'border-l-2 border-l-danger' : c.risk_level === 'medium' ? 'border-l-2 border-l-warning' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge variant={riskVariants[c.risk_level || 'low']}>{riskLabels[c.risk_level || 'low']}</StatusBadge>
                    {c.status && <span className="text-xs px-2 py-0.5 rounded bg-surface text-muted-foreground">{c.status}</span>}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{c.contractor} · {formatAmount(c.amount)}</p>
                </div>
                <div className="text-right flex-shrink-0 text-xs text-muted-foreground">
                  {c.deadline && `до ${c.deadline}`}
                </div>
              </div>
            </div>
          ))}
          {contracts.length === 0 && <div className="glass-card p-12 text-center"><p className="text-muted-foreground">Контрактов нет</p></div>}
        </div>
      )}

      <CreateProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} onCreated={loadData} />
      <CreateContractDialog open={contractDialogOpen} onOpenChange={setContractDialogOpen} onCreated={loadData} />
    </div>
  );
}
