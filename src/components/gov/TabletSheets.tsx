import { Sheet } from "@/components/ios/Sheet";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useSheets } from "@/hooks/useSheetParam";
import { useInstructions, useSignals, useToday } from "@/lib/queries";
import { AskSheet } from "./AskSheet";
import { CreateInstructionSheet } from "./CreateInstructionSheet";
import { ExecutorSheet } from "./ExecutorSheet";
import { InstructionDetail } from "./InstructionDetail";
import { SignalDetail } from "./SignalDetail";
import { TrustSheet } from "./TrustSheet";

/** Карточки поверх любого экрана планшета. Открываются через адрес (?signal=…). */
export function TabletSheets() {
  const sheets = useSheets();
  const signalId = sheets.get("signal");
  const instructionId = sheets.get("instruction");
  const newParam = sheets.get("new");
  const executorId = sheets.get("executor");

  return (
    <>
      <SignalSheet id={signalId} onClose={sheets.close} />
      <InstructionSheet id={instructionId} onClose={sheets.close} />
      <AskSheet open={sheets.get("ask") !== null} onClose={sheets.close} />
      <TrustSheet open={sheets.get("trust") !== null} onClose={sheets.close} />
      <NewInstruction param={newParam} onClose={sheets.close} />
      <ExecutorSheet id={executorId} onClose={sheets.close} />
    </>
  );
}

function SignalSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const sheets = useSheets();
  const signals = useSignals();
  const today = useToday();
  const signal =
    (id && (signals.data?.items.find((s) => s.id === id) ?? today.data?.top.find((s) => s.id === id))) || null;

  return (
    <Sheet open={id !== null} onOpenChange={(v) => !v && onClose()} title="Сигнал" size="lg">
      {signal ? (
        <SignalDetail signal={signal} onOpenInstruction={(iid) => sheets.open("instruction", iid)} onDone={onClose} />
      ) : signals.isLoading ? (
        <ListSkeleton rows={3} />
      ) : signals.error ? (
        <ErrorState message={(signals.error as Error).message} onRetry={() => signals.refetch()} />
      ) : (
        <EmptyState title="Сигнал не найден" text="Возможно, он уже закрыт или удалён." />
      )}
    </Sheet>
  );
}

function InstructionSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const sheets = useSheets();
  const q = useInstructions();
  const item = (id && q.data?.items.find((i) => i.id === id)) || null;

  return (
    <Sheet open={id !== null} onOpenChange={(v) => !v && onClose()} title="Поручение" size="lg">
      {item ? (
        <InstructionDetail item={item} onOpenSignal={(sid) => sheets.open("signal", sid)} />
      ) : q.isLoading ? (
        <ListSkeleton rows={3} />
      ) : q.error ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : (
        <EmptyState title="Поручение не найдено" text="Возможно, его отменили или оно закрыто больше месяца назад." />
      )}
    </Sheet>
  );
}

function NewInstruction({ param, onClose }: { param: string | null; onClose: () => void }) {
  const q = useInstructions();
  const promiseId = param?.startsWith("promise:") ? param.slice("promise:".length) : null;
  const promise = promiseId ? (q.data?.promises.find((p) => p.id === promiseId) ?? null) : null;
  return <CreateInstructionSheet open={param !== null} onClose={onClose} promise={promise} />;
}
