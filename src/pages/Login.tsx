import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AppMark } from "@/components/gov/AppMark";
import { Button } from "@/components/ios/Button";
import { FieldStack, FormGroup, TextInput } from "@/components/ios/Form";
import { homeFor, useAuth } from "@/contexts/auth";

type Mode = "signin" | "signup";

/** Разрешаем возврат только на свои страницы. */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  try {
    const decoded = decodeURIComponent(next);
    return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : null;
  } catch {
    return null;
  }
}

export default function Login() {
  const { status, role, signIn, signUp, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Вошли — ведём на нужный экран, когда роль известна.
  useEffect(() => {
    if (status !== "ready") return;
    if (!role) {
      navigate("/no-access", { replace: true });
      return;
    }
    const home = homeFor(role);
    const target = next && (next.startsWith(home) || role === "admin") ? next : home;
    navigate(target, { replace: true });
  }, [status, role, next, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Введите почту и пароль.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        if (password.length < 8) throw new Error("Пароль должен быть не короче 8 символов.");
        const { needsConfirmation } = await signUp(email, password, fullName);
        if (needsConfirmation) setSent(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const openDemo = async () => {
    setBusy(true);
    try {
      const r = await demoLogin("governor");
      navigate(homeFor(r), { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <Link to="/" aria-label="На главную">
            <AppMark size={64} />
          </Link>
          <h1 className="mt-4 text-title1">{mode === "signin" ? "Вход" : "Регистрация"}</h1>
          <p className="mt-1 text-subhead text-ink-2">
            {mode === "signin"
              ? "Планшет губернатора и кабинет команды"
              : "После регистрации администратор выдаст доступ"}
          </p>
        </div>

        {sent ? (
          <div className="surface mt-6 p-5 text-center">
            <p className="text-headline">Проверьте почту</p>
            <p className="mt-1 text-subhead text-ink-2">
              Мы отправили письмо на {email}. Перейдите по ссылке, затем войдите. Доступ выдаст администратор.
            </p>
            <Button
              variant="tinted"
              className="mt-4"
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
            >
              Ко входу
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <FormGroup>
              {mode === "signup" && (
                <FieldStack label="Имя и фамилия" htmlFor="name">
                  <TextInput
                    id="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Как к вам обращаться"
                  />
                </FieldStack>
              )}
              <FieldStack label="Почта" htmlFor="email">
                <TextInput
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@region.ru"
                />
              </FieldStack>
              <FieldStack label="Пароль" htmlFor="password">
                <TextInput
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signin" ? "Пароль" : "Не короче 8 символов"}
                />
              </FieldStack>
            </FormGroup>

            {error && (
              <p className="px-4 text-subhead text-critical-ink" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" block loading={busy}>
              {mode === "signin" ? "Войти" : "Зарегистрироваться"}
            </Button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                type="button"
                className="press text-[16px] font-semibold text-tint"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
              >
                {mode === "signin" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
              </button>
              <button type="button" className="press text-[15px] text-ink-2" onClick={openDemo} disabled={busy}>
                Открыть демо без входа
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
