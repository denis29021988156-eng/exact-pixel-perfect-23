import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import StatusBadge from '@/components/StatusBadge';
import CreateProjectDialog from '@/components/forms/CreateProjectDialog';
import CreateContractDialog from '@/components/forms/CreateContractDialog';
import { FolderKanban, FileText, AlertCircle, Plus, Shield, ChevronDown } from 'lucide-react';
import { useCanManage } from '@/hooks/useCanManage';
import PermissionGate from '@/components/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';

const projStatusLabels: Record<string, string> = {
  on_track: 'В срок', risk: 'Риск', overdue: 'Просрочено', completed: 'Завершено',
};
const projStatusVariants: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'muted'> = {
  on_track: 'success', risk: 'warning', overdue: 'danger', completed: 'success',
};

const riskVariants: Record<string, 'danger' | 'warning' | 'success'> = { low: 'success', medium: 'warning', high: 'danger' };
const riskLabels: Record<string, string> = { low: 'Норма', medium: 'Риск', high: 'Красный' };

const deptLabels: Record<string, string> = {
  utilities: 'ЖКХ', transport: 'Транспорт', improvement: 'Благоустройство',
  social: 'Соц. сфера', construction: 'Строительство',
};

export default function ProgramPage() {
  const canManage = useCanManage();
  const { userRole, userDepartment } = useAuth();
  const [tab, setTab] = useState<'projects' | 'contracts'>('projects');
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [contracts, setContracts] = useState<Tables<'contracts'>[]>([]);
  const [payments, setPayments] = useState<Tables<'budget_forecast'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    let pq = supabase.from('projects').select('*').order('created_at', { ascending: false });
    let cq = supabase.from('contracts').select('*').order('created_at', { ascending: false });
    const fq = supabase.from('budget_forecast').select('*').order('planned_payment_date', { ascending: true });
    if (userRole === 'deputy' && userDepartment) {
      pq = pq.eq('department', userDepartment);
      cq = cq.eq('department', userDepartment);
    }
    Promise.all([pq, cq, fq]).then(([pRes, cRes, fRes]) => {
      setProjects(pRes.data || []);
      setContracts(cRes.data || []);
      setPayments(fRes.data || []);
      setLoading(false);
    });
  }, [userRole, userDepartment]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatAmount = (n: number | null) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₽`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₽`;
    return `${n} ₽`;
  };

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading text-2xl">Программа</h1>
          <p className="meta-text mt-1">Нацпроекты, стройки и контракты</p>
        </div>
        {canManage && (
          <button
            onClick={() => tab === 'projects' ? setProjectDialogOpen(true) : setContractDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> {tab === 'projects' ? 'Новый проект' : 'Новый контракт'}
          </button>
        )}
      </div>

      <div className="flex bg-surface border border-border rounded-xl p-1 w-fit">
        <button onClick={() => setTab('projects')} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === 'projects' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <FolderKanban className="w-4 h-4" /> Объекты ({projects.length})
        </button>
        <button onClick={() => setTab('contracts')} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === 'contracts' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <FileText className="w-4 h-4" /> Контракты ({contracts.length})
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-16 text-center"><p className="text-muted-foreground">Загрузка...</p></div>
      ) : tab === 'projects' ? (
        <div className="space-y-3">
          {projects.map(p => {
            const open = expandedId === p.id;
            const spentPct = p.budget_total ? Math.round(((p.budget_spent || 0) / Number(p.budget_total)) * 100) : null;
            return (
            <div key={p.id} className={`glass-card glass-card-hover ${p.status === 'overdue' ? 'border-l-[3px] border-l-danger' : p.status === 'risk' ? 'border-l-[3px] border-l-warning' : ''}`}>
              <button onClick={() => toggle(p.id)} className="w-full text-left p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge variant={projStatusVariants[p.status]}>{projStatusLabels[p.status]}</StatusBadge>
                    {(p as any).political_sensitivity === 'high' && (
                      <StatusBadge variant="danger"><Shield className="w-3 h-3 inline mr-0.5" />Полит. чувств.</StatusBadge>
                    )}
                    {(p as any).political_sensitivity === 'medium' && (
                      <StatusBadge variant="warning"><Shield className="w-3 h-3 inline mr-0.5" />Внимание</StatusBadge>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">{p.name}</h3>
                  <p className="meta-text mt-1.5">{deptLabels[p.department || ''] || p.department} · {p.responsible}</p>
                  {p.blocker && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-danger">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {p.blocker}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0 flex items-start gap-3">
                  <div>
                  {p.planned_end && <div className="meta-text mb-2">до {p.planned_end}</div>}
                  <div className="w-28">
                    <div className="flex justify-between meta-text mb-1">
                      <span>Прогресс</span>
                      <span className="font-semibold text-foreground">{p.progress ?? 0}%</span>
                    </div>
                    <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${p.status === 'overdue' ? 'bg-danger' : p.status === 'risk' ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${p.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform mt-1 ${open ? 'rotate-180' : ''}`} />
                </div>
              </div>
              </button>
              {open && (
                <div className="px-6 pb-6 pt-2 border-t border-border/60 animate-fade-in-up">
                  {p.description && <p className="text-sm text-foreground/90 leading-relaxed mb-4">{p.description}</p>}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="meta-text mb-1">Период</div>
                      <div className="font-semibold text-foreground">{p.planned_start || '—'} → {p.planned_end || '—'}</div>
                    </div>
                    <div>
                      <div className="meta-text mb-1">Бюджет</div>
                      <div className="font-semibold text-foreground">{formatAmount(Number(p.budget_total))}</div>
                    </div>
                    <div>
                      <div className="meta-text mb-1">Освоено</div>
                      <div className="font-semibold text-foreground">{formatAmount(Number(p.budget_spent))} {spentPct !== null && <span className="text-muted-foreground">({spentPct}%)</span>}</div>
                    </div>
                    <div>
                      <div className="meta-text mb-1">Ответственный</div>
                      <div className="font-semibold text-foreground">{p.responsible || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
          })}
          {projects.length === 0 && <div className="glass-card p-16 text-center"><p className="text-muted-foreground">Проектов нет</p></div>}
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => {
            const open = expandedId === c.id;
            const cPayments = payments.filter(f => f.contract_id === c.id).slice(0, 3);
            return (
            <div key={c.id} className={`glass-card glass-card-hover ${c.risk_level === 'high' ? 'border-l-[3px] border-l-danger' : c.risk_level === 'medium' ? 'border-l-[3px] border-l-warning' : ''}`}>
              <button onClick={() => toggle(c.id)} className="w-full text-left p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge variant={riskVariants[c.risk_level || 'low']}>{riskLabels[c.risk_level || 'low']}</StatusBadge>
                    {c.status && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-muted text-muted-foreground font-medium">{c.status}</span>}
                    {(c as any).political_sensitivity === 'high' && (
                      <StatusBadge variant="danger"><Shield className="w-3 h-3 inline mr-0.5" />Полит. чувств.</StatusBadge>
                    )}
                    {(c as any).political_sensitivity === 'medium' && (
                      <StatusBadge variant="warning"><Shield className="w-3 h-3 inline mr-0.5" />Внимание</StatusBadge>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">{c.name}</h3>
                  <p className="meta-text mt-1.5">{c.contractor} · {formatAmount(Number(c.amount))}</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-start gap-3">
                  <div className="meta-text">{c.deadline && `до ${c.deadline}`}</div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
              </div>
              </button>
              {open && (
                <div className="px-6 pb-6 pt-2 border-t border-border/60 animate-fade-in-up">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                    <div>
                      <div className="meta-text mb-1">Департамент</div>
                      <div className="font-semibold text-foreground">{deptLabels[c.department || ''] || c.department || '—'}</div>
                    </div>
                    <div>
                      <div className="meta-text mb-1">Сумма контракта</div>
                      <div className="font-semibold text-foreground">{formatAmount(Number(c.amount))}</div>
                    </div>
                    <div>
                      <div className="meta-text mb-1">Исполнение</div>
                      <div className="font-semibold text-foreground">{c.execution_rate ?? 0}%</div>
                    </div>
                    <div>
                      <div className="meta-text mb-1">Риск неисполнения</div>
                      <div className={`font-semibold ${Number(c.risk_of_non_execution) > 60 ? 'text-danger' : Number(c.risk_of_non_execution) > 30 ? 'text-warning' : 'text-success'}`}>{c.risk_of_non_execution ?? 0}%</div>
                    </div>
                  </div>
                  {cPayments.length > 0 && (
                    <div>
                      <div className="meta-text mb-2">Платежи (план / факт):</div>
                      <div className="space-y-1.5">
                        {cPayments.map(pay => (
                          <div key={pay.id} className="flex items-center justify-between text-xs px-3 py-2 bg-surface-muted rounded-lg">
                            <span className="text-foreground">{pay.planned_payment_date}</span>
                            <span className="text-muted-foreground">план {formatAmount(Number(pay.planned_amount))}</span>
                            <span className={`font-semibold ${pay.actual_payment_date ? 'text-success' : 'text-muted-foreground'}`}>
                              {pay.actual_payment_date ? `факт ${formatAmount(Number(pay.actual_amount))}` : 'ожидание'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
          {contracts.length === 0 && <div className="glass-card p-16 text-center"><p className="text-muted-foreground">Контрактов нет</p></div>}
        </div>
      )}

      <CreateProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} onCreated={loadData} />
      <CreateContractDialog open={contractDialogOpen} onOpenChange={setContractDialogOpen} onCreated={loadData} />
    </div>
  );
}
