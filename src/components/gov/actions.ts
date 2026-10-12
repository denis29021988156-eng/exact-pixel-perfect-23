// Действия с подтверждением и кнопкой «Отменить» в уведомлении.
// Отмена вызывается напрямую, а не через хук: карточка, из которой поручили,
// к этому моменту уже может исчезнуть с экрана.

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rpc } from "@/lib/api";
import { fmtDay } from "@/lib/format";
import {
  qk,
  useAgendaDecide,
  useAssignSignal,
  useCreateInstruction,
  type AssignArgs,
  type CreateInstructionArgs,
} from "@/lib/queries";
import type { Instruction } from "@/lib/types";

function useUndo() {
  const qc = useQueryClient();
  return async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      toast(done);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      qc.invalidateQueries({ queryKey: qk.all });
    }
  };
}

function useAssignedToast() {
  const undo = useUndo();
  return (instr: Instruction) => {
    toast.success(`Поручено: ${instr.executor?.short_name ?? "исполнителю"}`, {
      description: `Срок — ${fmtDay(instr.due_date)}`,
      action: {
        label: "Отменить",
        onClick: () => undo(() => rpc("gov_cancel_instruction", { _id: instr.id }), "Поручение отменено"),
      },
    });
  };
}

/** Поручить по сигналу. Возвращает поручение или null при ошибке (ошибка уже показана). */
export function useAssignFlow() {
  const assign = useAssignSignal();
  const notify = useAssignedToast();
  return {
    pending: assign.isPending,
    pendingId: assign.isPending ? assign.variables?.signalId : undefined,
    run: async (args: AssignArgs): Promise<Instruction | null> => {
      try {
        const instr = await assign.mutateAsync(args);
        notify(instr);
        return instr;
      } catch {
        return null;
      }
    },
  };
}

/** Новое поручение (вручную, по обещанию или из ответа ИИ). */
export function useCreateFlow() {
  const create = useCreateInstruction();
  const notify = useAssignedToast();
  return {
    pending: create.isPending,
    run: async (args: CreateInstructionArgs): Promise<Instruction | null> => {
      try {
        const instr = await create.mutateAsync(args);
        notify(instr);
        return instr;
      } catch {
        return null;
      }
    },
  };
}

/** Решение по пункту повестки с возможностью отменить. */
export function useAgendaFlow() {
  const decide = useAgendaDecide();
  const undo = useUndo();
  return {
    pending: decide.isPending,
    pendingId: decide.isPending ? decide.variables?.id : undefined,
    run: async (id: string, decision: "approved" | "returned" | "proposed", note?: string | null) => {
      try {
        await decide.mutateAsync({ id, decision, note });
        if (decision === "proposed") return true;
        toast.success(decision === "approved" ? "Согласовано" : "Возвращено на доработку", {
          action: {
            label: "Отменить",
            onClick: () =>
              undo(() => rpc("gov_agenda_decide", { _id: id, _decision: "proposed", _note: null }), "Решение отменено"),
          },
        });
        return true;
      } catch {
        return false;
      }
    },
  };
}
