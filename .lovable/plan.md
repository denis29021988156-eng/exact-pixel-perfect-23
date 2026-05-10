## 1. Сократить объекты и контракты до 5

Сейчас в БД 17 проектов и 17 контрактов (включая дубли и оставшиеся `[DEMO]`). Оставляем по 5 «эталонных» записей в каждой таблице — по одной на каждый из 5 департаментов (utilities, transport, improvement, social, construction).

**Действия (через миграцию/insert):**
- `DELETE FROM contracts WHERE id NOT IN (...5 выбранных id)` — предварительно почистить связанный `budget_forecast` по `contract_id`.
- `DELETE FROM projects WHERE id NOT IN (...5 выбранных id)`.
- Выбор 5 проектов: «Модернизация водоснабжения» (utilities), «Ремонт дорог 2026» (transport), «Реконструкция набережной Пехорки» (improvement), «Капремонт школы №12» (social), плюс новый проект «Строительство ФОК "Реутов-Арена"» (construction).
- Выбор 5 контрактов: «Замена труб водоснабжения» (utilities), «Ямочный ремонт дорог — лот 1» (transport), «Реконструкция набережной — СМР» (improvement), «Капремонт школы №12 — подряд» (social), «Строительство ФОК — генподряд» (construction).

**«Обновить везде, чтобы не было ошибок»:**
- Счётчики `Объекты ({projects.length})` / `Контракты ({contracts.length})` на `ProgramPage` и `BudgetRiskCard` — динамические, сами пересчитаются.
- Проверить `Шпаргалку` (`CheatsheetPage.tsx`) на хардкод чисел про объекты — оставить как есть (это отдельные отраслевые показатели, не привязаны к таблицам).
- Проверить `dataAggregator`, `risk-snapshot`, `budget-forecast` edge-функции — все читают БД динамически, изменений в коде не нужно.

## 2. Раскрывающаяся карточка объекта/контракта

В `src/pages/ProgramPage.tsx` сделать каждую карточку кликабельной: при клике плавно (через `Collapsible`) разворачивается блок с ключевой информацией.

**Поля для проекта (`projects`):** description, planned_start → planned_end, прогресс с цветной полосой, бюджет (`budget_total` / `budget_spent` + остаток в %), `responsible`, `blocker`, статус политической чувствительности.

**Поля для контракта (`contracts`):** contractor, amount, deadline, execution_rate, risk_of_non_execution, status, department, признак политической чувствительности; плюс таблица последних 3 платежей из `budget_forecast` (план/факт).

**Дозаполнение БД (придумать «близко к реальности»):** для оставленных 5 проектов/контрактов через `UPDATE` дописать `description`, `planned_start`, `budget_total`, `budget_spent`, `execution_rate`, `risk_of_non_execution` — чтобы при раскрытии карточки было что показать. Для контрактов добавить 2–3 строки в `budget_forecast` (план/факт платежей).

UI:
- В свёрнутом виде карточка как сейчас (название, статус, прогресс/срок).
- При клике — анимированное раскрытие, серая разделительная линия, сетка `grid-cols-2` с подписями полей.
- Иконка ChevronDown справа, поворот при открытии.
- Ничего не ломаем по фильтрам (deputy department) — просто оборачиваем существующий рендер.

## 3. AI знает реальное московское время

В `supabase/functions/city-copilot/index.ts` и `city-briefing/index.ts` посчитать московское время и подставить в system prompt:

```ts
const mskNow = new Date().toLocaleString('ru-RU', {
  timeZone: 'Europe/Moscow',
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});
```

В начало промта добавить блок:
```
ТЕКУЩЕЕ ВРЕМЯ (МСК, Europe/Moscow): {mskNow}
Все даты, дедлайны и сроки в ответах — по московскому времени.
```

Также в `aggregatedData` добавить поле `nowMsk`. Это позволит AI корректно рассчитывать «сегодня», «завтра», «через 3 дня», избегая UTC-смещения.

## 4. Перевод RED ZONE / AI-статуса на русский

Файл `src/components/AppLayout.tsx`:
- `RED ZONE · {n}` → `КРАСНАЯ ЗОНА · {n}` (тот же стиль `red-zone-badge`).
- `statusConfig.active.label`: `AI Active` → `ИИ активен`.
- `statusConfig.elevated.label`: `Elevated Risk` → `Повышенный риск`.
- `statusConfig.unavailable.label`: `AI Unavailable` → `ИИ недоступен`.

Файл `src/pages/MapPage.tsx`:
- `RED ZONE · {stats.high}` → `КРАСНАЯ ЗОНА · {stats.high}`.

Файл `src/components/landing/TabletMockup.tsx`:
- `RED ZONE` → `КРАСНАЯ ЗОНА` (декоративный элемент лендинга).

Подпись «обновлено N мин назад» уже на русском — не трогаем.

---

### Порядок исполнения

1. Insert/миграция: очистка контрактов и проектов до 5; дозаполнение деталей; добавление записей `budget_forecast`.
2. UI: ProgramPage — раскрывающиеся карточки с расширенным блоком.
3. Edge: city-copilot и city-briefing — блок «Текущее время (МСК)».
4. UI: AppLayout, MapPage, TabletMockup — перевод RED ZONE и AI-статусов.
