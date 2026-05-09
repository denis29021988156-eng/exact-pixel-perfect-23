import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import CityCopilot from '@/components/CityCopilot';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FolderKanban, 
  ClipboardCheck, 
  BookOpen,
  Map,
  Shield,
  BrainCircuit,
  LogOut,
  User,
  Newspaper,
  Database,
  FileSpreadsheet,
  Inbox,
  Sparkles,
  Send,
  ShieldAlert,
  Users
} from 'lucide-react';

type NavItem = { path: string; label: string; icon: any; roles?: string[] };
type NavGroup = { label: string; roles?: string[]; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Обзор',
    items: [
      { path: '/app', label: 'Сегодня', icon: LayoutDashboard },
      { path: '/app/map', label: 'Карта', icon: Map },
    ],
  },
  {
    label: 'Управление',
    items: [
      { path: '/app/incidents', label: 'Инциденты', icon: AlertTriangle },
      { path: '/app/program', label: 'Программа', icon: FolderKanban },
      { path: '/app/tasks', label: 'Поручения', icon: ClipboardCheck },
      { path: '/app/reputation', label: 'Репутация', icon: Newspaper },
    ],
  },
  {
    label: 'Интеллект',
    items: [
      { path: '/app/cheatsheet', label: 'Шпаргалка', icon: BookOpen },
      { path: '/app/sla-matrix', label: 'Матрица SLA', icon: ShieldAlert, roles: ['employee'] },
    ],
  },
  {
    label: 'Администрирование',
    roles: ['mayor'],
    items: [
      { path: '/app/users', label: 'Пользователи', icon: Users, roles: ['mayor'] },
    ],
  },
  {
    label: 'Источники данных',
    roles: ['employee'],
    items: [
      { path: '/app/data-quality', label: 'Качество данных', icon: Database },
      { path: '/app/excel-upload', label: 'Excel загрузка', icon: FileSpreadsheet },
      { path: '/app/telegram-inbox', label: 'Telegram', icon: Send },
      { path: '/app/ai-extract', label: 'AI-структурирование', icon: Sparkles },
      { path: '/app/moderation', label: 'Модерация', icon: Inbox },
    ],
  },
];

const roleLabels: Record<string, string> = {
  mayor: 'Мэр',
  deputy: 'Заместитель',
  employee: 'Сотрудник',
};

function AIStatusIndicator() {
  const [status, setStatus] = useState<'active' | 'elevated' | 'unavailable'>('active');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const check = () => {
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .eq('severity', 'high').neq('status', 'closed')
        .then(({ count, error }) => {
          if (error) {
            setStatus('unavailable');
          } else {
            const c = count || 0;
            setCriticalCount(c);
            setStatus(c >= 3 ? 'elevated' : 'active');
            setLastUpdate(new Date());
          }
        });
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const minutesAgo = Math.round((Date.now() - lastUpdate.getTime()) / 60000);
  const statusConfig = {
    active: { color: 'bg-success', label: 'AI Active', textColor: 'text-muted-foreground' },
    elevated: { color: 'bg-warning', label: 'Elevated Risk', textColor: 'text-warning' },
    unavailable: { color: 'bg-danger', label: 'AI Unavailable', textColor: 'text-danger' },
  };
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      {criticalCount >= 3 && (
        <span className="red-zone-badge">RED ZONE · {criticalCount}</span>
      )}
      {minutesAgo > 0 && (
        <span className="text-xs text-muted-foreground/60">
          обновлено {minutesAgo} мин назад
        </span>
      )}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted border border-border">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${cfg.color} ai-pulse`} />
        </div>
        <span className={`text-xs font-semibold tracking-wide ${cfg.textColor}`}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const roleName = roleLabels[userRole || ''] || 'Сотрудник';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Dark Navy Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-20 flex items-center gap-3 px-5 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-[13px] font-bold text-white leading-tight tracking-tight">Реутов</h1>
            <p className="text-[10px] text-sidebar-foreground/60 tracking-[0.12em] uppercase">Цифровая платформа</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 lg:px-3 overflow-y-auto">
          {navGroups
            .filter((g) => !g.roles || g.roles.includes(userRole || ''))
            .map((group, gi) => {
              const items = group.items.filter(
                (it) => !it.roles || it.roles.includes(userRole || '')
              );
              if (items.length === 0) return null;
              return (
                <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
                  {gi > 0 && (
                    <div className="lg:hidden h-px bg-sidebar-border/60 mx-2 mb-3" />
                  )}
                  <p className="hidden lg:block text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/45 px-3 mb-1.5 font-semibold">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const isActive = item.path === '/app'
                        ? location.pathname === '/app' || location.pathname === '/app/'
                        : location.pathname.startsWith(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 h-10 px-3 justify-center lg:justify-start rounded-lg transition-all duration-150 text-sm font-medium
                            ${isActive
                              ? 'bg-sidebar-accent text-white shadow-sm'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white'
                            }`}
                        >
                          <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
                          <span className="hidden lg:block leading-none">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </nav>

        {/* User info */}
        <div className="p-3 space-y-2 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/40">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleName}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:block text-xs font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 h-16 flex items-center justify-end px-8 bg-background/85 backdrop-blur-md border-b border-border/60">
          <AIStatusIndicator />
        </div>
        <div className="px-8 py-8 max-w-[1600px] mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>

      <CityCopilot />
    </div>
  );
}
