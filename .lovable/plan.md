
# План: Connectors Layer + Confidence + Data Quality

## Что добавляем (новый уровень архитектуры)

```text
Data Sources → CONNECTORS LAYER → Normalized Data → Risk Engine → AI → Action
                      ↓
              Confidence Score
              Data Quality Dashboard
```

## Phase A: Фундамент (БД + типы)

**Новые таблицы:**

1. `data_sources` — реестр источников (id, name, type [email/excel/telegram/manual/db], status, last_sync_at, success_rate, latency_minutes, config jsonb)
2. `ingestion_log` — лог ingestion (id, source_id, status [success/error/partial], records_in, records_normalized, records_failed, error_message, duration_ms, created_at)
3. `staging_raw` — сырые данные до нормализации (id, source_id, raw_payload jsonb, parsed_payload jsonb, status [pending/parsed/normalized/rejected], confidence numeric, target_table text, target_id uuid, created_at)
4. `address_normalization` — словарь адресов (raw_text, normalized_address, district, lat, lng)

**Новые колонки:**
- `incidents.confidence_score numeric default 100`
- `incidents.source_id uuid` (nullable, ref data_sources)
- `incidents.raw_source_id uuid` (nullable, ref staging_raw)
- то же для `tasks`, `public_complaints`

## Phase B: Connectors Layer (5 коннекторов)

Все коннекторы — Edge Functions с одинаковым контрактом: `ingest → normalize → score confidence → write to staging → promote to target table`.

1. **Manual Input Connector** (`POST /connectors/manual`) — форма быстрого ввода. Делается первым, т.к. не зависит ни от чего.
2. **Email Connector** (`POST /connectors/email-webhook`) — принимает forwarded email через webhook (SendGrid Inbound Parse / Resend / IMAP poller). Парсит subject + body + attachments.
3. **Excel/CSV Connector** (`POST /connectors/excel-upload`) — UI для загрузки .xlsx, парсинг через `xlsx` lib, маппинг колонок.
4. **Telegram Connector** — реюз связки `telegram-poll` (polling каждую минуту через pg_cron), парсит сообщения из заданных чатов как жалобы.
5. **DB Connector** (опционально, заглушка) — конфиг подключения к внешней Postgres/MSSQL через edge function.

## Phase C: AI Data Structuring

Edge function `ai-extract-incident` (Lovable AI Gateway, gemini-3-flash-preview):
- Вход: сырой текст (email/telegram message)
- Выход: структурированный JSON `{ type, severity, address, district, department, suggested_title, confidence }`
- Используется в Email/Telegram коннекторах автоматически
- Результат идёт в `staging_raw.parsed_payload` + confidence

## Phase D: Normalization Engine

`src/lib/ingestion/normalizer.ts` — чистые функции:
- `normalizeAddress(raw) → { normalized, lat, lng, confidence }` (словарь + Nominatim fallback)
- `normalizeIncidentType(raw) → enum incident_type`
- `normalizeSeverity(raw) → enum incident_severity`
- `calculateRecordConfidence({ completeness, freshness, sourceCount, parseConfidence }) → 0-100`

## Phase E: Confidence Layer в UI

- Risk Index на TodayPage показывает `67 (доверие: 72%)`
- Каждая карточка инцидента — маленький бейдж confidence
- Tooltip объясняет: «3 из 5 полей заполнены, источник: email, возраст: 12 мин»

## Phase F: Data Quality Dashboard

Новая страница `/app/data-quality` (только для мэра/зама/IT):
- KPI: % автоматических источников, % ручного ввода, средняя задержка, ошибки парсинга за 24ч
- Таблица `data_sources` с live-статусом (✅/⚠️/❌)
- График `ingestion_log` за 7 дней (Recharts)
- Кнопка «Test source» на каждом коннекторе

Ссылка в сайдбаре `AppLayout.tsx` (рядом с существующими).

## Phase G: Презентация продукта

Обновить `LandingPage.tsx`:
- Новый hero-блок: *«Подключаемся к хаотичным данным города за 2 недели — без доработки ваших систем»*
- Секция «Как мы работаем с вашими данными» — диаграмма Connectors Layer
- Замена позиционирования: «AI для управления городом» → «Система, которая превращает хаос городских данных в управляемые решения»

---

## Технические детали

**Edge Functions (новые):** `ingest-email`, `ingest-excel`, `ingest-telegram`, `ingest-manual`, `ai-extract-incident`, `connector-test`

**Cron jobs:** Telegram polling (1 мин), Email IMAP poll (опц., 5 мин), staging→target promotion (1 мин)

**RLS:** `data_sources`, `ingestion_log`, `staging_raw` — read для authenticated, write только для service_role + mayor

**Confidence формула (детерминированная, не AI):**
```
confidence = (completeness × 0.4) + (freshness × 0.3) + 
             (sourceReliability × 0.2) + (parseConfidence × 0.1)
```
где `sourceReliability` — статичная константа на коннектор (manual=100, db=95, excel=85, email=70, telegram=50).

**Промоут staging → target:** триггер на `staging_raw` после `status='normalized'` + `confidence > 60` автоматически вставляет в `incidents`/`tasks`/`public_complaints`. Иначе — попадает в очередь модерации.

**Очередь модерации:** новая страница `/app/moderation` — список записей с confidence < 60, мэр/зам жмёт «Принять» / «Отклонить» / «Редактировать».

---

## Порядок внедрения (рекомендуемый)

1. **Phase A** (БД) → **Phase D** (нормализация) → **Phase E** (confidence в UI) — фундамент, даёт сразу видимый эффект
2. **Phase B.1** (Manual) + **Phase F** (Data Quality Dashboard) — работающий MVP коннекторного слоя
3. **Phase B.2** (Excel upload) — самая частая «реальность» в администрациях
4. **Phase C** (AI extraction) + **Phase B.3** (Email) — автоматизация
5. **Phase B.4** (Telegram) — слой реальности от граждан
6. **Phase G** (лендинг + презентация) — финальная упаковка

---

## Что НЕ меняем (защищаем существующее)

- Risk Engine (`cityRiskEngine.ts`) — формула остаётся
- AI как интерпретатор (никакого CRUD от AI)
- Существующие RLS, роли, маршруты, edge functions (city-briefing, city-copilot)
- White-label «Балашиха», карта Реутова, дизайн-токены

---

**Рекомендую стартовать с Phase A + D + E + B.1 + F** — это ~1 итерация, даёт работающий Connectors Layer с ручным вводом, confidence-метрикой и Data Quality Dashboard. Это то, что нужно показать заказчику.
