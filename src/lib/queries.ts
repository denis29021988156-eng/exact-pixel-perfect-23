// Запросы экранов и действия губернатора. После любого действия данные экранов обновляются.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { callFunction, rpc } from "./api";
import type {
  AgendaPayload,
  AskAnswer,
  Brief,
  Instruction,
  InstructionsPayload,
  Signal,
  SignalsPayload,
  TodayPayload,
} from "./types";

export const qk = {
  all: ["gov"] as const,
  today: ["gov", "today"] as const,
  signals: ["gov", "signals"] as const,
  instructions: ["gov", "instructions"] as const,
  agenda: ["gov", "agenda"] as const,
};

const LIVE = { refetchInterval: 60_000, staleTime: 15_000 };

export const useToday = () => useQuery({ queryKey: qk.today, queryFn: () => rpc<TodayPayload>("gov_today"), ...LIVE });

export const useSignals = () =>
  useQuery({ queryKey: qk.signals, queryFn: () => rpc<SignalsPayload>("gov_signals"), ...LIVE });

export const useInstructions = () =>
  useQuery({
    queryKey: qk.instructions,
    queryFn: () => rpc<InstructionsPayload>("gov_instructions"),
    ...LIVE,
  });

export const useAgenda = () =>
  useQuery({
    queryKey: qk.agenda,
    queryFn: () => rpc<AgendaPayload>("gov_agenda"),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

/** Обёртка: после успеха обновить все экраны, ошибку показать уведомлением. */
function useGovAction<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, opts: { quietError?: boolean } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.all }),
    onError: (err: Error) => {
      if (!opts.quietError) toast.error(err.message);
    },
  });
}

export interface AssignArgs {
  signalId: string;
  executorId?: string | null;
  due?: string | null;
  title?: string | null;
  note?: string | null;
}

export const useAssignSignal = () =>
  useGovAction((a: AssignArgs) =>
    rpc<Instruction>("gov_assign_signal", {
      _signal_id: a.signalId,
      _executor_id: a.executorId ?? null,
      _due: a.due ?? null,
      _title: a.title ?? null,
      _note: a.note ?? null,
    }),
  );

export const useSignalStatus = () =>
  useGovAction((a: { signalId: string; status: "new" | "watch" | "dismissed"; note?: string | null }) =>
    rpc<Signal>("gov_signal_status", { _signal_id: a.signalId, _status: a.status, _note: a.note ?? null }),
  );

export interface CreateInstructionArgs {
  title: string;
  executorId: string;
  due: string;
  municipalityId?: string | null;
  details?: string | null;
  source?: "manual" | "ask" | "agenda" | "promise";
  promiseId?: string | null;
}

export const useCreateInstruction = () =>
  useGovAction((a: CreateInstructionArgs) =>
    rpc<Instruction>("gov_create_instruction", {
      _title: a.title,
      _executor_id: a.executorId,
      _due: a.due,
      _municipality_id: a.municipalityId ?? null,
      _details: a.details ?? null,
      _source: a.source ?? "manual",
      _promise_id: a.promiseId ?? null,
    }),
  );

export const useCancelInstruction = () =>
  useGovAction((id: string) => rpc<{ id: string }>("gov_cancel_instruction", { _id: id }));

export const useRemind = () => useGovAction((id: string) => rpc<Instruction>("gov_remind", { _id: id }));

export const usePostpone = () =>
  useGovAction((a: { id: string; due: string; note?: string | null }) =>
    rpc<Instruction>("gov_postpone", { _id: a.id, _due: a.due, _note: a.note ?? null }),
  );

export const useCallReport = () => useGovAction((id: string) => rpc<Instruction>("gov_call_report", { _id: id }));

export const useAgendaDecide = () =>
  useGovAction((a: { id: string; decision: "approved" | "returned" | "proposed"; note?: string | null }) =>
    rpc<{ id: string; status: string }>("gov_agenda_decide", {
      _id: a.id,
      _decision: a.decision,
      _note: a.note ?? null,
    }),
  );

export const useSetInstructionStatus = () =>
  useGovAction(
    (a: {
      id: string;
      status: "new" | "in_progress" | "done" | "cancelled";
      effect?: string | null;
      effectPositive?: boolean | null;
    }) =>
      rpc<Instruction>("team_set_instruction_status", {
        _id: a.id,
        _status: a.status,
        _effect: a.effect ?? null,
        _effect_positive: a.effectPositive ?? null,
      }),
  );

/** Пересобрать сводку дня (ИИ, при сбое — по правилам). */
export const useRefreshBrief = () =>
  useGovAction(() => callFunction<{ brief: Brief; mode: "ai" | "rules" }>("gov-brief"));

/** Вопрос к ИИ. Ошибки показывает сам экран вопроса. */
export const useAsk = () =>
  useMutation({
    mutationFn: (a: { question: string; history: { q: string; a: string }[] }) =>
      callFunction<AskAnswer>("gov-ask", { question: a.question, history: a.history }),
  });

export const useDemoReset = () => useGovAction(() => rpc<void>("demo_reset"));
