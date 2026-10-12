import { Navigate } from "react-router-dom";
import { SelectInput } from "@/components/ios/Form";
import { PageHeader } from "@/components/ios/List";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ios/States";
import { useAuth } from "@/contexts/auth";
import { fmtAgo } from "@/lib/format";
import { useAdminUsers, useSetUserRole } from "@/lib/team";
import type { Role } from "@/lib/types";

const roleOptions: { value: Role | ""; label: string }[] = [
  { value: "", label: "Нет доступа" },
  { value: "governor", label: "Губернатор" },
  { value: "team", label: "Команда" },
  { value: "admin", label: "Администратор" },
];

/** Доступ: кто видит планшет и кабинет. Только для администратора. */
export default function TeamUsers() {
  const { role, user } = useAuth();
  const q = useAdminUsers(role === "admin");
  const setRole = useSetUserRole();

  if (role !== "admin") return <Navigate to="/team" replace />;

  return (
    <div>
      <PageHeader
        title="Доступ"
        subtitle="Новые сотрудники регистрируются на странице входа, затем здесь им выдаётся роль"
      />
      {q.error && !q.data ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton rows={5} />
      ) : q.data.length ? (
        <div className="surface rows overflow-hidden">
          {q.data.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">{u.full_name || u.email}</p>
                <p className="truncate text-subhead text-ink-2">
                  {u.full_name ? `${u.email} · ` : ""}
                  {u.last_sign_in_at ? `заходил ${fmtAgo(u.last_sign_in_at)}` : "ещё не входил"}
                </p>
              </div>
              <SelectInput
                value={u.role ?? ""}
                disabled={setRole.isPending || u.id === user?.id}
                onChange={(e) => setRole.mutate({ userId: u.id, role: (e.target.value || null) as Role | null })}
                aria-label={`Роль: ${u.email}`}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectInput>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Пользователей нет" />
      )}
      <p className="px-4 pt-2 text-footnote text-ink-2">
        Свою роль администратора изменить нельзя — попросите другого администратора.
      </p>
    </div>
  );
}
