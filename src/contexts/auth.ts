import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";

export type AuthStatus = "loading" | "signed_out" | "ready";

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** Роль в системе. null — вошёл, но доступа нет. */
  role: Role | null;
  /** Ошибка при загрузке роли (например, нет сети). */
  roleError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  demoLogin: (as: "governor" | "team") => Promise<Role | null>;
  signOut: () => Promise<void>;
  reloadRole: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth вне AuthProvider");
  return ctx;
}

/** Куда вести пользователя после входа. */
export function homeFor(role: Role | null): string {
  if (role === "team") return "/team";
  if (role === "governor" || role === "admin") return "/app";
  return "/no-access";
}
