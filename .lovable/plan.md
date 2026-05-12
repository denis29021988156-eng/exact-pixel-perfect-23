# Аудит RLS: incidents и связанные таблицы

## 1. Актуальное состояние политики INSERT на `public.incidents`

**Заявление аудита неактуально.** Политика `"Authenticated insert incidents" WITH CHECK (true)` была заменена ещё в миграции `20260222160517` (через 81 секунду после исходной):

```sql
DROP POLICY "Authenticated insert incidents" ON public.incidents;
CREATE POLICY "Authenticated insert incidents" ON public.incidents 
  FOR INSERT TO authenticated 
  WITH CHECK (created_by = auth.uid());
```

Текущая политика в БД (проверено через `pg_policies`):

```
Incidents insert own | INSERT | WITH CHECK: (created_by = auth.uid())
```

То есть `WITH CHECK (true)` **уже нет**. Но проблема, на которую указывает аудит, **частично остаётся**: employee может вставить инцидент с произвольным `severity='high'`, `political_sensitivity='high'`, `department=<любой>`, `responsible=<кто угодно>` — лишь бы `created_by = auth.uid()`.

## 2. Колонки `political_sensitivity` и `created_by`

- `created_by uuid REFERENCES auth.users(id)` — добавлена при создании таблицы в `20260222160436` (строка 50).
- `political_sensitivity text NOT NULL DEFAULT 'low'` — добавлена в `20260330150413` (для incidents, projects, contracts одной миграцией).

Обе колонки присутствуют в текущей схеме (подтверждено `<supabase-tables>`).

## 3. INSERT-политики `WITH CHECK (true)` на ключевых таблицах

Проверка `pg_policies` (cmd='INSERT'):

| Таблица | Политика | WITH CHECK |
|---|---|---|
| incidents | Incidents insert own | `created_by = auth.uid()` |
| public_complaints | Mayor/Deputy insert complaints | `mayor OR deputy` |
| tasks | Tasks insert mayor or deputy of dept | `mayor OR deputy_of(department)` |
| projects | Projects insert mayor or deputy of dept | `mayor OR deputy_of(department)` |
| contracts | Contracts insert mayor or deputy of dept | `mayor OR deputy_of(department)` |
| staging_raw | Admin/Mayor/Deputy manage (ALL) | `admin OR mayor OR deputy` |

**Ни одной политики `WITH CHECK (true)` не осталось.** Самая «слабая» — `incidents` (любой залогиненный + `created_by=self`).

## 4. Как создаются инциденты

- **`CreateIncidentDialog.tsx`** — клиентский `supabase.from('incidents').insert(...)`, проходит через RLS. Передаёт `created_by: user?.id`. **Это и есть единственный путь, где employee может злоупотребить.**
- **`ingest-excel/index.ts`** — использует `SUPABASE_SERVICE_ROLE_KEY` → **обходит RLS**. Не пострадает.
- **`ai-extract-incident/index.ts`** — использует `SERVICE_ROLE_KEY` → **обходит RLS**. Пишет извлечённые инциденты в `incidents`/`staging_raw`.
- **`telegram-poll/index.ts`** — `SERVICE_ROLE_KEY` → пишет в `staging_raw`/`telegram_messages`, обходит RLS.
- **`ingest-manual/index.ts`** — `SERVICE_ROLE_KEY`, обходит RLS.

Вывод: ужесточение RLS на `incidents` затронет **только клиентский диалог** — все edge-функции работают сервисной ролью.

## 5. План миграции (НЕ применять до подтверждения)

```sql
-- === incidents ===
DROP POLICY IF EXISTS "Incidents insert own" ON public.incidents;

-- Mayor/Deputy/Admin — без ограничений по severity/sensitivity
CREATE POLICY "Incidents insert privileged"
ON public.incidents
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'mayor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (department IS NOT NULL AND is_deputy_of_department(department))
  )
);

-- Employee — только свой департамент, severity != 'high', political_sensitivity != 'high'
CREATE POLICY "Incidents insert employee limited"
ON public.incidents
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND department IS NOT NULL
  AND department = get_user_department(auth.uid())
  AND severity <> 'high'::incident_severity
  AND political_sensitivity <> 'high'
);
```

Для `public_complaints / tasks / staging_raw / projects / contracts` правки **не требуются** — INSERT уже ограничен ролями mayor/deputy/admin.

Опционально (если хочется усилить): добавить `created_by = auth.uid()` к INSERT-политикам `tasks/projects/contracts` — но там нет такой колонки, поэтому пропускаем.

## 6. Риски и rollback

**Что сломается:**
- `CreateIncidentDialog` для employee — если выбран чужой департамент или severity=high → INSERT упадёт с RLS-ошибкой. Нужно либо UI-ограничение (disable severity=high для employee), либо обработка ошибки toast'ом. Это можно сделать отдельной задачей после миграции.
- Мock-сидинг в `20260419090921` уже выполнен — не задет.

**Что НЕ сломается:**
- Excel-импорт, AI-извлечение, Telegram-poll, ingest-manual — все на service role, RLS обходят.
- Чтение/обновление инцидентов — политики `SELECT`/`UPDATE` не трогаем.
- Триггеры (`log_audit`, `log_incident_severity`, `check_and_create_escalation`) — security definer, не зависят от INSERT-политики.

**Rollback-план:** одна обратная миграция — `DROP` двух новых политик, `CREATE` старой `Incidents insert own WITH CHECK (created_by = auth.uid())`. Простой и безопасный.

## 7. Дополнительные замечания (не правим без отдельного запроса)

- **«`Authenticated read roles USING (true)`» — неактуально.** Текущие политики на `user_roles`: `Users read own role` (только своя), `Admin reads all user_roles`, `Admin manages roles`. Утечки ролей нет.
- **Дубли «Mayor/Deputy reads all profiles»** — формально это три отдельные политики (`Mayor`, `Deputy`, `Admin reads all profiles`), а не дубли. Можно было бы объединить в одну `WHERE has_role(auth.uid(),'mayor') OR has_role(auth.uid(),'deputy') OR has_role(auth.uid(),'admin')`, но функционально это эквивалентно и не критично. Отложим.

---

**Итог:** критическая дыра из аудита уже закрыта (`created_by = auth.uid()`). Остаётся менее острая проблема — employee может ставить high/чужой департамент. Миграция выше её закрывает, риск минимален. Жду подтверждения, чтобы применить.
