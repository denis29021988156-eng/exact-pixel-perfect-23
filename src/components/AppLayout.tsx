import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import CityCopilot from '@/components/CityCopilot';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FolderKanban, 
  ClipboardCheck, 
  BookOpen,
  Map,
  Shield,
  BrainCircuit
} from 'lucide-react';

const navItems = [
  { path: '/app', label: 'Сегодня', icon: LayoutDashboard },
  { path: '/app/incidents', label: 'Инциденты', icon: AlertTriangle },
  { path: '/app/map', label: 'Карта', icon: Map },
  { path: '/app/program', label: 'Программа', icon: FolderKanban },
  { path: '/app/tasks', label: 'Поручения', icon: ClipboardCheck },
  { path: '/app/cheatsheet', label: 'Шпаргалка', icon: BookOpen },
];

function AIStatusIndicator() {
  const [riskLevel, setRiskLevel] = useState<'normal' | 'elevated'>('normal');

  useEffect(() => {
    supabase.from('incidents').select('id', { count: 'exact', head: true })
      .eq('severity', 'high').neq('status', 'closed')
      .then(({ count }) => {
        setRiskLevel((count || 0) >= 3 ? 'elevated' : 'normal');
      });
  }, []);

  const isElevated = riskLevel === 'elevated';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-muted">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${isElevated ? 'bg-warning' : 'bg-success'} ai-pulse`} />
      </div>
      <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">
        {isElevated ? 'Elevated Risk' : 'AI Active'}
      </span>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">City Intelligence</h1>
            <p className="text-[10px] text-muted-foreground/60 tracking-wide">Операционная система</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = item.path === '/app' 
              ? location.pathname === '/app' || location.pathname === '/app/'
              : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-sm font-medium
                  ${isActive 
                    ? 'bg-primary-soft text-primary' 
                    : 'text-sidebar-foreground hover:bg-surface-muted hover:text-foreground'
                  }`}
              >
                <item.icon className={`w-[22px] h-[22px] flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Demo badge */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-muted/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Демо-режим</p>
              <p className="text-[10px] text-muted-foreground/60">Публичный доступ</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 h-14 flex items-center justify-end px-6 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <AIStatusIndicator />
        </div>
        <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>

      <CityCopilot />
    </div>
  );
}
