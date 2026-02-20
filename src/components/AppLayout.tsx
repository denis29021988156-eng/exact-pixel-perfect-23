import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FolderKanban, 
  ClipboardCheck, 
  BookOpen,
  Shield
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Сегодня', icon: LayoutDashboard },
  { path: '/incidents', label: 'Инциденты', icon: AlertTriangle },
  { path: '/program', label: 'Программа', icon: FolderKanban },
  { path: '/tasks', label: 'Поручения', icon: ClipboardCheck },
  { path: '/cheatsheet', label: 'Шпаргалка', icon: BookOpen },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-bold text-foreground leading-tight">Планшет мэра</h1>
            <p className="text-[10px] text-muted-foreground">Ситуационный центр</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium
                  ${isActive 
                    ? 'bg-sidebar-accent text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">МЭ</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium text-foreground">Мэр города</p>
              <p className="text-[10px] text-muted-foreground">Администратор</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
