## Сводный план — 5 фиксов одной итерацией

Параллельно: миграция RLS + правки в `dataAggregator`/edge-функции + фикс фильтров на странице Инцидентов. Лендинг — без изменений (число «19» в нём не зашито, проверено).

---

### Фикс 1. RLS контрактов — Сотрудник видит свой департамент

Сейчас `contracts` SELECT доступен только Мэру и Заму своего департамента → Сотрудник видит **0 контрактов**, хотя у `projects` Сотрудник своего департамента читает.

**Миграция:** заменить политику `Contracts read mayor or deputy of dept` на:
```sql
USING (
  has_role(auth.uid(),'mayor')
  OR (department IS NOT NULL AND is_deputy_of_department(department))
  OR (department IS NOT NULL AND department = get_user_department(auth.uid()))
)
```

---

### Фикс 2. RLS инцидентов — Сотрудник видит назначенные/свой департамент

Сейчас Сотрудник видит только инциденты, где `created_by = auth.uid()`. Если Мэр или Зам создал инцидент по департаменту Сотрудника — тот его не увидит, хотя поручение по нему может быть назначено на него.

**Миграция:** заменить политику `Incidents read` на:
```sql
USING (
  has_role(auth.uid(),'mayor')
  OR (department IS NOT NULL AND is_deputy_of_department(department))
  OR (department IS NOT NULL AND department = get_user_department(auth.uid()))
  OR created_by = auth.uid()
)
```

---

### Фикс 3. AI-контекст: подключить Репутацию

В `src/lib/ai/dataAggregator.ts` и `supabase/functions/city-copilot/index.ts`:

- Добавить запрос `media_mentions` за последние 30 дней (`published_at >= now() - 30d`).
- Считать: `mentionsCount`, `negativeMentions` (sentiment='negative'), `positiveMentions`, `topReputationTopics[3]`.
- Добавить эти поля в возвращаемый JSON-контекст ИИ. Промпты не трогаем — модель сама подхватит новые поля.

После фикса Мэр сможет спросить «что про нас в СМИ» — ИИ ответит по реальным данным.

---

### Фикс 4. Лендинг — убрать конкретные числа объёмов

Поиск показал: чисел 19/17/17/13 в `LandingPage.tsx` нет. Литерал «87, три критичных инцидента, пять задач» в нарративе «Дня мэра» — это иллюстративный пример, не статистика. Оставляем как есть.

**Действие:** добавить заметку в проектную память — «не вшивать конкретные счётчики в лендинг», если возникнут в будущем. Никаких правок кода.

---

### Фикс 5. Фильтры на странице Инцидентов

Файл: `src/pages/IncidentsPage.tsx`. Три бага из-за того, что счётчики плашек считаются по одной логике, а клик переключает фильтры по другой.

**Что меняем:**

1. Ввести два независимых boolean-фильтра:
   - `activeOnly` (по умолчанию `true`) — отрезает `closed` и `resolved`.
   - `resolvedOrClosedOnly` — показывает только `resolved`+`closed`.

2. Заменить логику плашек:
   - **«Активных инцидентов»** — клик включает `activeOnly=true`, выключает `resolvedOrClosedOnly`, сбрасывает severity/overdue.
   - **«Критический»** — клик включает `severityFilter='high'` + `activeOnly=true`, выключает `resolvedOrClosedOnly`.
   - **«Просрочено SLA»** — клик включает `overdueOnly=true` + `activeOnly=true`, выключает `resolvedOrClosedOnly`.
   - **«Решено / Закрыто»** — клик включает `resolvedOrClosedOnly=true`, выключает `activeOnly`, сбрасывает severity/overdue.

3. В `filtered`:
   ```ts
   if (activeOnly && (i.status === 'closed' || i.status === 'resolved')) return false;
   if (resolvedOrClosedOnly && !(i.status === 'resolved' || i.status === 'closed')) return false;
   ```

4. Убрать `statusFilter='resolved'` из обработчиков плашек — он и был источником рассинхрона.
   `<select>` со статусом оставить как ручной вспомогательный фильтр (он работает поверх `activeOnly`/`resolvedOrClosedOnly`, переводя их в `false` при выборе конкретного статуса).

**Проверки в DevTools после фикса:** счётчик каждой плашки = `filtered.length` после её клика, на текущих данных — 19 / критичные / 0 просрочено / 6.

---

### Технические детали

**Файлы:**
- Новая миграция: 2 политики (`contracts`, `incidents`).
- `src/lib/ai/dataAggregator.ts` — расширить интерфейс и запросы.
- `supabase/functions/city-copilot/index.ts` — добавить запрос `media_mentions` и поля в `aggregatedData`.
- `src/pages/IncidentsPage.tsx` — переписать логику плашек и `filtered`.
- `mem://features/landing-content-rules` — короткая заметка-правило.

**НЕ трогаем:**
- Лендинг, маршруты, схему ролей, роли в `user_roles`.
- Системные промпты ИИ.
- `media_mentions` / `public_complaints` RLS — пункт про фильтр «по департаменту» из предыдущего обсуждения сюда **не включён** (нужно отдельное решение по продукту: жалобы и СМИ — общегородские или по зонам?).

**Риски:** минимальные. RLS-расширение только добавляет права чтения, ничего не отбирает. AI получит больше полей в контексте — это безопасно. Фильтры — локальная логика одной страницы.

После всех правок дам короткий отчёт «кто что видит» по каждой роли + поля, появившиеся в AI-контексте.
