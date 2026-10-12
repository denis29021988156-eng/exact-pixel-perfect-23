// Доступ к данным: функции базы (rpc) и серверные функции (edge functions).
// Новые таблицы и функции не описаны в автогенерируемых типах, поэтому клиент без типов.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const db = supabase as unknown as SupabaseClient;

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const NETWORK = "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.";

function isCyrillic(s: string | undefined | null): s is string {
  return !!s && /[а-яё]/i.test(s);
}

/** Понятное сообщение из ошибки базы, сети или функции. */
export function humanError(err: unknown): string {
  if (!err) return "Что-то пошло не так. Попробуйте ещё раз.";
  const e = err as { message?: string; code?: string; status?: number; name?: string };
  const msg = e.message ?? String(err);
  if (isCyrillic(msg)) return msg;
  if (e.code === "42501" || e.status === 403) return "Нет доступа к этим данным.";
  if (e.code === "PGRST301" || /jwt|token/i.test(msg) || e.status === 401) {
    return "Сессия истекла. Войдите ещё раз.";
  }
  if (/failed to fetch|network|load failed|fetch/i.test(msg)) return NETWORK;
  if (/timeout|timed out|abort/i.test(msg)) return "Сервер долго не отвечает. Попробуйте ещё раз.";
  return "Что-то пошло не так. Попробуйте ещё раз.";
}

/** Вызов функции базы. Ошибка — с понятным текстом. */
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args ?? {});
  if (error) {
    throw new ApiError(humanError(error), error.code);
  }
  return data as T;
}

/** Вызов серверной функции. Ошибка из ответа функции показывается как есть. */
export async function callFunction<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = "";
    let status: number | undefined;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      status = ctx.status;
      try {
        const payload = await ctx.clone().json();
        message = payload?.error ?? "";
      } catch {
        /* тело не JSON */
      }
    }
    if (!isCyrillic(message)) {
      message =
        status === 429
          ? "Слишком много запросов. Подождите минуту."
          : status === 401
            ? "Сессия истекла. Войдите ещё раз."
            : status === 403
              ? "Нет доступа."
              : humanError(error);
    }
    throw new ApiError(message, undefined, status);
  }
  if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
    const m = (data as { error?: string }).error;
    if (m) throw new ApiError(isCyrillic(m) ? m : humanError(new Error(m)));
  }
  return data as T;
}
