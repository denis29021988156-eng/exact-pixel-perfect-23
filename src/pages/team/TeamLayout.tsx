import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Tablet } from "lucide-react";
import { AppMark } from "@/components/gov/AppMark";
import { TabletSheets } from "@/components/gov/TabletSheets";
import { Badge } from "@/components/ios/Badge";
import { useAuth } from "@/contexts/auth";
import { useToday } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Кабинет команды: здесь готовят то, что губернатор видит на планшете. */
export default function TeamLayout() {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const today = useToday();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const tabs = [
    { to: "/team/signals", label: "Сигналы" },
    { to: "/team/instructions", label: "Поручения" },
    { to: "/team/agenda", label: "Повестка" },
    { to: "/team/settings", label: "Сводка и тон" },
    ...(role === "admin" ? [{ to: "/team/users", label: "Доступ" }] : []),
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 bg-background/85 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/team" className="flex min-w-0 items-center gap-2">
            <AppMark size={28} />
            <span className="truncate text-headline">Кабинет команды</span>
            {today.data?.demo && <Badge tone="warning">Демо</Badge>}
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/app"
              className="press inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-tint"
            >
              <Tablet className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Планшет</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/", { replace: true });
              }}
              className="press inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[15px] text-ink-2"
              aria-label="Выйти"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
        <nav
          className="mx-auto max-w-[1200px] overflow-x-auto px-4 pb-2 scrollbar-none md:px-6"
          aria-label="Разделы кабинета"
        >
          <div className="flex w-max gap-1 rounded-[10px] bg-fill p-[2px]">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-[8px] px-3.5 py-1.5 text-[14px] transition-colors",
                    isActive
                      ? "bg-card font-semibold shadow-[0_1px_3px_rgb(0_0_0/0.12)] dark:bg-elevated"
                      : "text-foreground/80",
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-4 md:px-6">
        <Outlet />
      </main>
      <TabletSheets />
    </div>
  );
}
