import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/ios/States";
import { AppMark } from "./AppMark";

export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5" role="status" aria-label="Загрузка">
      <AppMark size={64} />
      <Loader2 className="h-5 w-5 animate-spin text-ink-3" aria-hidden />
    </div>
  );
}

export function FullScreenError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ErrorState message={message} onRetry={onRetry} className="w-full max-w-md" />
    </div>
  );
}
