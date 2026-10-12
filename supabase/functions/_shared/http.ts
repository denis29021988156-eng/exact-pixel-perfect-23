// Общие помощники для серверных функций: CORS, ответы, клиенты базы.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

export const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Метод не поддерживается" }, 405);
  return null;
}

function env(name: string, fallback?: string): string {
  const v = Deno.env.get(name) ?? (fallback ? Deno.env.get(fallback) : undefined);
  if (!v) throw new Error(`Не задана переменная окружения ${name}`);
  return v;
}

export const supabaseUrl = () => env("SUPABASE_URL");
export const anonKey = () => env("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY");
export const serviceKey = () => env("SUPABASE_SERVICE_ROLE_KEY");

/** Клиент от имени пользователя: база сама проверит роль и права. */
export function userClient(req: Request): SupabaseClient | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return createClient(supabaseUrl(), anonKey(), {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function publicClient(): SupabaseClient {
  return createClient(supabaseUrl(), anonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Ошибка базы → ответ с понятным текстом и кодом. */
export function dbErrorResponse(err: { code?: string; message?: string } | null): Response {
  const code = err?.code ?? "";
  const msg = err?.message ?? "";
  if (code === "42501") return json({ error: "Нет доступа" }, 403);
  if (code.startsWith("PGRST3") || /jwt/i.test(msg)) return json({ error: "Сессия истекла. Войдите ещё раз." }, 401);
  console.error("db error", code, msg);
  return json({ error: "Ошибка базы данных. Попробуйте ещё раз." }, 500);
}
