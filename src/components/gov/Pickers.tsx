import { SelectInput } from "@/components/ios/Form";
import { executorKindLabel, useDirectory } from "@/lib/directory";

/** Выбор исполнителя: министерства, управления, главы округов. */
export function ExecutorSelect({
  id,
  value,
  onChange,
  placeholder = "Выбрать",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { data } = useDirectory();
  const groups = (["ministry", "service", "municipality"] as const).map((k) => ({
    kind: k,
    items: (data?.executors ?? []).filter((e) => e.kind === k),
  }));
  return (
    <SelectInput id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Исполнитель">
      <option value="" disabled>
        {data ? placeholder : "Загрузка…"}
      </option>
      {groups.map((g) =>
        g.items.length ? (
          <optgroup key={g.kind} label={executorKindLabel[g.kind]}>
            {g.items.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </optgroup>
        ) : null,
      )}
    </SelectInput>
  );
}

/** Выбор округа (необязательный). */
export function MunicipalitySelect({
  id,
  value,
  onChange,
  emptyLabel = "Вся область",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  emptyLabel?: string;
}) {
  const { data } = useDirectory();
  return (
    <SelectInput id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Округ">
      <option value="">{emptyLabel}</option>
      {(data?.municipalities ?? []).map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </SelectInput>
  );
}
