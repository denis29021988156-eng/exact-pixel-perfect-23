// Действия с подтверждением и кнопкой «Отменить» в уведомлении.

import { toast } from "sonner";
import { fmtDay } from "@/lib/format";
import {
  useAgendaDecide,
  useAssignSignal,
  useCancelInstruction,
  useCreateInstruction,
  type AssignArgs,
  type CreateInstructionArgs,
} from "@/lib/queries";
import type { Instruction } from "@/lib/types";

function useUndoToast() {
  const cancel = useCancelInstruction();
  return (instr: Instruction) => {
    toast.success(`Поручено: ${instr.executor?.short_name ?? "исполнителю"}`, {
      description: `Срок — ${fmtDay(instr.due_date)}`,
      action: {
        label: "Отменить",
        onClick: () =>
          cancel.mutate(instr.id, {
            onSuccess: () => toast("Поручение отменено"),
          }),
      },
    });
  };
}

/** Поручить по сигналу. Возвращает поручение или null при ошибке (ошибка уже показана). */
export function useAssignFlow() {
  const assign = useAssignSignal();
  const undo = useUndoToast();
  return {
    pending: assign.isPending,
    pendingId: assign.isPending ? assign.variables?.signalId : undefined,
    run: async (args: AssignArgs): Promise<Instruction | null> => {
      try {
        const instr = await assign.mutateAsync(args);
        undo(instr);
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
  const undo = useUndoToast();
  return {
    pending: create.isPending,
    run: async (args: CreateInstructionArgs): Promise<Instruction | null> => {
      try {
        const instr = await create.mutateAsync(args);
        undo(instr);
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
            onClick: () => decide.mutate({ id, decision: "proposed" }),
          },
        });
        return true;
      } catch {
        return false;
      }
    },
  };
}
