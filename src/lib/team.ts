// Кабинет команды: прямое редактирование сигналов, повестки и настроек (доступ проверяет база).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, db, humanError, rpc } from "./api";
import { addDays, mskToday } from "./format";
import type { AdminUser, AgendaChannel, AgendaStatus, Role, Severity, SignalKind, SignalStatus } from "./types";

export interface SignalRecord {
  id: string;
  kind: SignalKind;
  severity: Severity;
  title: string;
  summary: string | null;
  municipality_id: string | null;
  source: string | null;
  mentions: number | null;
  detected_at: string;
  ai_cause: string | null;
  ai_forecast: string | null;
  ai_recommendation: string | null;
  suggested_title: string | null;
  suggested_executor_id: string | null;
  suggested_due: string | null;
  status: SignalStatus;
  status_note: string | null;
  instruction_id: string | null;
}

export type SignalInput = Omit<SignalRecord, "id" | "instruction_id" | "status_note">;

export interface AgendaRecord {
  id: string;
  day: string;
  channel: AgendaChannel;
  title: string;
  description: string | null;
  municipality_id: string | null;
  expected_effect: string | null;
  status: AgendaStatus;
  decision_note: string | null;
}

export type AgendaInput = Omit<AgendaRecord, "id" | "decision_note">;

const teamKey = ["gov", "team"] as const;

function check<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new ApiError(humanError(res.error), res.error.code);
  return res.data as T;
}

export function useTeamSignals() {
  return useQuery({
    queryKey: [...teamKey, "signals"],
    queryFn: async () =>
      check(
        await db
          .from("signals")
          .select(
            "id, kind, severity, title, summary, municipality_id, source, mentions, detected_at, ai_cause, ai_forecast, ai_recommendation, suggested_title, suggested_executor_id, suggested_due, status, status_note, instruction_id",
          )
          .order("detected_at", { ascending: false })
          .limit(200),
      ) as SignalRecord[],
  });
}

export function useTeamAgenda() {
  return useQuery({
    queryKey: [...teamKey, "agenda"],
    queryFn: async () =>
      check(
        await db
          .from("agenda_items")
          .select("id, day, channel, title, description, municipality_id, expected_effect, status, decision_note")
          .gte("day", addDays(mskToday(), -14))
          .order("day")
          .order("created_at"),
      ) as AgendaRecord[],
  });
}

function useTeamMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>, success?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gov"] });
      if (success) toast.success(success);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export const useSaveSignal = () =>
  useTeamMutation(async ({ id, values }: { id?: string; values: SignalInput }) => {
    const row = { ...values, updated_at: new Date().toISOString() };
    if (id) check(await db.from("signals").update(row).eq("id", id).select("id"));
    else check(await db.from("signals").insert(row).select("id"));
  }, "Сигнал сохранён");

export const useDeleteSignal = () =>
  useTeamMutation(async (id: string) => {
    check(await db.from("signals").delete().eq("id", id).select("id"));
  }, "Сигнал удалён");

export const useSaveAgenda = () =>
  useTeamMutation(async ({ id, values }: { id?: string; values: AgendaInput }) => {
    // Снова на согласование — прежнее решение и комментарий больше не актуальны.
    const row =
      values.status === "proposed" ? { ...values, decision_note: null, decided_at: null, decided_by: null } : values;
    if (id) check(await db.from("agenda_items").update(row).eq("id", id).select("id"));
    else check(await db.from("agenda_items").insert(row).select("id"));
  }, "Пункт повестки сохранён");

export const useDeleteAgenda = () =>
  useTeamMutation(async (id: string) => {
    check(await db.from("agenda_items").delete().eq("id", id).select("id"));
  }, "Пункт удалён");

export const useSaveTone = () =>
  useTeamMutation(async (v: { tone: string[]; avoid: string[] }) => {
    check(
      await db
        .from("comms_settings")
        .upsert({ id: 1, tone: v.tone, avoid: v.avoid, updated_at: new Date().toISOString() })
        .select("id"),
    );
  }, "Тон сохранён");

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: [...teamKey, "users"],
    enabled,
    queryFn: () => rpc<AdminUser[]>("admin_list_users"),
  });
}

export const useSetUserRole = () =>
  useTeamMutation(
    (a: { userId: string; role: Role | null }) => rpc<void>("admin_set_role", { _user_id: a.userId, _role: a.role }),
    "Доступ изменён",
  );
