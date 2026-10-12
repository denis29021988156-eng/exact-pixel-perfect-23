import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callFunction, humanError, rpc } from "@/lib/api";
import type { Role } from "@/lib/types";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [roleFor, setRoleFor] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleNonce, setRoleNonce] = useState(0);

  // Сессия: сначала подписка, потом текущее состояние.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setSessionReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  // Роль загружаем отдельно от обработчика сессии, чтобы не блокировать клиент.
  useEffect(() => {
    if (!userId) {
      setRole(null);
      setRoleFor(null);
      setRoleError(null);
      return;
    }
    let cancelled = false;
    setRoleError(null);
    rpc<Role | null>("gov_my_role")
      .then((r) => {
        if (cancelled) return;
        setRole(r ?? null);
        setRoleFor(userId);
      })
      .catch((err) => {
        if (cancelled) return;
        setRole(null);
        setRoleFor(userId);
        setRoleError(humanError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, roleNonce]);

  const status: AuthStatus = !sessionReady
    ? "loading"
    : !userId
      ? "signed_out"
      : roleFor === userId
        ? "ready"
        : "loading";

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      throw new Error(
        /invalid login credentials/i.test(error.message)
          ? "Неверная почта или пароль."
          : /email not confirmed/i.test(error.message)
            ? "Почта не подтверждена. Откройте письмо и перейдите по ссылке."
            : humanError(error),
      );
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      throw new Error(
        /already registered|already exists/i.test(error.message)
          ? "Такая почта уже зарегистрирована. Войдите."
          : /password/i.test(error.message)
            ? "Пароль слишком простой: нужно не меньше 8 символов."
            : humanError(error),
      );
    }
    return { needsConfirmation: !data.session };
  }, []);

  const demoLogin = useCallback(
    async (as: "governor" | "team") => {
      const tokens = await callFunction<{ access_token: string; refresh_token: string }>("demo-login", { role: as });
      qc.clear();
      const { data, error } = await supabase.auth.setSession(tokens);
      if (error || !data.session) throw new Error("Не удалось открыть демо. Попробуйте ещё раз.");
      const r = await rpc<Role | null>("gov_my_role");
      setRole(r ?? null);
      setRoleFor(data.session.user.id);
      return r ?? null;
    },
    [qc],
  );

  const signOut = useCallback(async () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* нет синтеза речи */
    }
    await supabase.auth.signOut();
    qc.clear();
    setRole(null);
    setRoleFor(null);
  }, [qc]);

  const reloadRole = useCallback(() => setRoleNonce((n) => n + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      role,
      roleError,
      signIn,
      signUp,
      demoLogin,
      signOut,
      reloadRole,
    }),
    [status, session, role, roleError, signIn, signUp, demoLogin, signOut, reloadRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
