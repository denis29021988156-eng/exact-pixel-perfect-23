// Справочники для форм: исполнители и округа. Меняются редко — кэшируем надолго.

import { useQuery } from "@tanstack/react-query";
import { db, humanError, ApiError } from "./api";
import type { Executor, Ref } from "./types";

export interface Directory {
  executors: (Executor & { municipality_id: string | null })[];
  municipalities: (Ref & { center: string | null })[];
}

export const directoryKey = ["gov", "directory"] as const;

export function useDirectory() {
  return useQuery({
    queryKey: directoryKey,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Directory> => {
      const [ex, mu] = await Promise.all([
        db.from("executors").select("id, name, short_name, kind, municipality_id").order("kind").order("name"),
        db.from("municipalities").select("id, name, center, sort").order("sort").order("name"),
      ]);
      if (ex.error) throw new ApiError(humanError(ex.error), ex.error.code);
      if (mu.error) throw new ApiError(humanError(mu.error), mu.error.code);
      return {
        executors: (ex.data ?? []) as Directory["executors"],
        municipalities: (mu.data ?? []) as Directory["municipalities"],
      };
    },
  });
}

export const executorKindLabel = {
  ministry: "Министерства",
  service: "Управления",
  municipality: "Главы округов",
} as const;
