import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Tablet } from "lucide-react";
import { AppMark } from "@/components/gov/AppMark";
import { TabletSheets } from "@/components/gov/TabletSheets";
import { Badge } from "@/components/ios/Badge";
import { ThemeToggle } from "@/components/ios/Theme";
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
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-[max(8px,env(safe-area-inset-top))] md:px-6">
        <div className="glass-bar mx-auto max-w-[1200px] rounded-[26px] px-3 pb-2.5 pt-1.5 md:px-4">
          <div className="flex h-12 items-center justify-between gap-3">
            <Link to="/team" className="flex min-w-0 items-center gap-2.5">
              <AppMark size={30} />
              <span className="truncate text-headline">Кабинет команды</span>
              {today.data?.demo && <Badge tone="warning">Демо</Badge>}
            </Link>
            <div className="flex items-center gap-1.5">
              <ThemeToggle className="h-[38px] w-[38px] border-0 bg-fill shadow-none" />
              <Link
                to="/app"
                className="press inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-tint/12 px-3.5 text-[15px] font-semibold text-tint dark:bg-tint/20"
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
                className="press inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3 text-[15px] text-ink-2"
                aria-label="Выйти"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </div>
          </div>
          <nav className="overflow-x-auto scrollbar-none" aria-label="Разделы кабинета">
            <div className="flex w-max gap-1 rounded-full bg-fill p-[3px]">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap rounded-full px-4 py-1.5 text-[14.5px] transition-colors",
                      isActive
                        ? "bg-white font-semibold text-foreground shadow-[0_2px_10px_rgb(14_26_51/0.14)] dark:bg-white/15 dark:shadow-none"
                        : "text-foreground/75 hover:text-foreground",
                    )
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-2 md:px-6">
        <Outlet />
      </main>
      <TabletSheets />
    </div>
  );
}
