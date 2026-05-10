## Цель
ИИ помнит между сессиями: (а) предыдущие диалоги пользователя, (б) принятые решения/договорённости, (в) пользовательские настройки-предпочтения (формат докладов, фокус-департаменты и т.п.).

## Архитектура

```text
[user msg] → city-copilot
              ├─ load: ai_conversations (last 20 msgs текущего user_id)
              ├─ load: ai_memory (decisions + preferences для user_id)
              ├─ aggregate city data (как сейчас)
              ├─ system prompt + memory block + history + new msg
              ├─ stream answer
              └─ async: save user msg + assistant msg в ai_conversations
                       + если ответ содержит "РЕШЕНИЕ:" / явный commit — extract в ai_memory
```

## Изменения в БД (1 миграция)

**`ai_conversations`** — полная история чатов
- `user_id uuid` (FK auth.users, NOT NULL)
- `session_id uuid` (для группировки одной беседы)
- `role text` ('user' | 'assistant')
- `content text`
- `created_at timestamptz default now()`
- index: `(user_id, created_at desc)`
- RLS: пользователь читает/пишет только свои; mayor читает все.

**`ai_memory`** — структурированная долгосрочная память
- `user_id uuid` (NOT NULL — мэр/зам/сотрудник)
- `kind text` ('decision' | 'preference' | 'context_note')
- `key text` (короткий идентификатор, напр. "report_format")
- `value text` (содержимое)
- `source text` ('manual' | 'extracted' | 'system')
- `expires_at timestamptz` (nullable — для временных решений)
- `created_at, updated_at`
- unique `(user_id, kind, key)` — апсерт
- RLS: владелец full; mayor read all.

## Изменения в коде

**`supabase/functions/city-copilot/index.ts`**
- Из заголовка Authorization получить `user_id` через `supabase.auth.getUser(jwt)`.
- Загрузить последние 20 сообщений `ai_conversations` для этого user_id (фоллбек: пусто, если нет).
- Загрузить активные `ai_memory` (где `expires_at > now() OR null`), отформатировать в блок:
  ```
  ДОЛГОСРОЧНАЯ ПАМЯТЬ:
  Решения:
   - [2026-05-08] не закупать ёлки до сентября
  Предпочтения:
   - report_format: краткий, без эмодзи
  ```
- Вставить блок в systemPrompt после агрегированных данных.
- После ответа (после стрима — через `EdgeRuntime.waitUntil`) сохранить user msg + assistant msg в `ai_conversations`.
- Минимальная авто-экстракция: если в ответе есть строка `РЕШЕНИЕ: <текст>` — записать в `ai_memory` (kind='decision', key=hash, value=текст).

**Новая edge-функция `ai-memory-manage`** (опционально, без UI пока):
- POST { action: 'add'|'delete'|'list', kind, key, value, expires_at }
- Для будущей кнопки «Запомни это» в UI Copilot. Сейчас не подключаем UI — только endpoint, чтобы команды типа "запомни X" из чата работали через ту же экстракцию.

**`src/components/CityCopilot.tsx`**
- Передавать в invoke `Authorization` заголовок (уже передаётся через supabase.functions.invoke, проверить).
- Никаких видимых изменений интерфейса в этой итерации.

## Что НЕ делаем сейчас
- UI для просмотра/удаления памяти (отдельный шаг).
- Векторный поиск/embeddings (overkill для текущего объёма).
- Автоматический summary длинных диалогов (добавим, когда история превысит 50 сообщений).
- Сложный NLP-экстрактор решений — только маркер `РЕШЕНИЕ:` в ответе ИИ.

## Безопасность
- Память приватна по user_id; мэр видит всё (для аудита).
- Экспирация через `expires_at` для временных решений.
- ИИ продолжает не иметь прямого SQL-доступа — только чтение/запись через бэкенд.

## Файлы
- new: миграция (2 таблицы + RLS + индексы)
- edit: `supabase/functions/city-copilot/index.ts`
- new: `supabase/functions/ai-memory-manage/index.ts`
- update: `mem://ai/memory-management/conversation-state` (отразить новую модель)

## Проверка после внедрения
1. Залогиниться, в чате сказать «запомни: доклады делай списком из 3 пунктов» → проверить запись в `ai_memory`.
2. Перезагрузить страницу, открыть Copilot, спросить «как ты обычно делаешь доклады?» — должен ответить про 3 пункта.
3. Спросить вчерашний контекст (после реального дня) — должен подтянуть из `ai_conversations`.
