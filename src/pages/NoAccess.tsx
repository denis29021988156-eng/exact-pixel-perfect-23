import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ios/Button";
import { homeFor, useAuth } from "@/contexts/auth";

export default function NoAccess() {
  const { status, user, role, signOut, reloadRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "signed_out") navigate("/login", { replace: true });
    if (status === "ready" && role) navigate(homeFor(role), { replace: true });
  }, [status, role, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="surface w-full max-w-md px-6 py-10 text-center">
        <Lock className="mx-auto h-8 w-8 text-ink-3" aria-hidden />
        <h1 className="mt-3 text-title2">Нет доступа</h1>
        <p className="mt-2 text-subhead text-ink-2">
          {user?.email ? `Аккаунт ${user.email} ещё не получил роль.` : "У аккаунта ещё нет роли."} Попросите
          администратора выдать доступ в кабинете команды.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="tinted" onClick={reloadRole}>
            Проверить снова
          </Button>
          <Button
            variant="plain"
            onClick={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }}
          >
            Выйти
          </Button>
          <Link to="/" className="mt-1 text-[15px] text-ink-2">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
