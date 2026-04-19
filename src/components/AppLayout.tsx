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
  Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/app', label: 'Сегодня', icon: LayoutDashboard },
  { path: '/app/incidents', label: 'Инциденты', icon: AlertTriangle },
  { path: '/app/map', label: 'Карта', icon: Map },
  { path: '/app/program', label: 'Программа', icon: FolderKanban },
  { path: '/app/tasks', label: 'Поручения', icon: ClipboardCheck },
  { path: '/app/reputation', label: 'Репутация', icon: Newspaper },
  { path: '/app/data-quality', label: 'Качество данных', icon: Database },
  { path: '/app/excel-upload', label: 'Excel загрузка', icon: FileSpreadsheet },
  { path: '/app/ai-extract', label: 'AI-структурирование', icon: Sparkles },
  { path: '/app/moderation', label: 'Модерация', icon: Inbox },
  { path: '/app/cheatsheet', label: 'Шпаргалка', icon: BookOpen },
];

const roleLabels: Record<string, string> = {
  mayor: 'Мэр',
  deputy: 'Заместитель',
  employee: 'Сотрудник',
};

function AIStatusIndicator() {
  const [status, setStatus] = useState<'active' | 'elevated' | 'unavailable'>('active');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const check = () => {
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .eq('severity', 'high').neq('status', 'closed')
        .then(({ count, error }) => {
          if (error) {
            setStatus('unavailable');
          } else {
            setStatus((count || 0) >= 3 ? 'elevated' : 'active');
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
      {minutesAgo > 0 && (
        <span className="text-xs text-muted-foreground/50">
          Updated {minutesAgo}m ago
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
        <div className="h-16 flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">City Intelligence</h1>
            <p className="text-xs text-sidebar-foreground/60 tracking-wide">Операционная система</p>
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
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 text-sm font-medium
                  ${isActive 
                    ? 'bg-sidebar-accent text-white' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white'
                  }`}
              >
                <item.icon className={`w-[22px] h-[22px] flex-shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/40">
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
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:block text-xs font-medium">Выйти</span>
          </button>
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
