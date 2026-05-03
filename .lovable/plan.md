# Старт: Этап 0 + 7a (две миграции в одном коммите)

Финальный план — готовый к выполнению. После approve начну с миграции, затем cron, затем baseline-метрики, потом Этап 5.

## Миграция 1 — baseline tables

Создаю 5 таблиц с RLS:

- **`feature_flags`** — `key`, `enabled`, `enabled_for_roles[]`, `payload jsonb`, `enabled_at`, `description`. Сидирую 9 флагов (`risk_engine_v2`, `sla_matrix_active`, `moderation_thresholds_v2`, `copilot_token_budget`, `escalation_dedup`, `audit_enabled=true`, `public_aggregation_v2`, `excel_strict_validation`, `ai_fallback_briefing`) — все `false`, кроме `audit_enabled`.
- **`risk_index_snapshots`** — ежедневные снимки индекса (`snapshot_date UNIQUE`, `index_value`, `level`, `components jsonb`, `formula_version`).
- **`metrics_baseline`** — фиксация метрик «до» (`metric`, `value`, `context`, `captured_at`).
- **`incidents_severity_log`** — история severity (`incident_id`, `severity`, `previous_severity`, `changed_by`, `source`).
- **`audit_log`** — журнал мутаций (`user_id`, `action`, `entity_type`, `entity_id`, `before_data`, `after_data`, `diff`).

**RLS:**
- Чтение `feature_flags`/`risk_index_snapshots`/`metrics_baseline`/`incidents_severity_log` — все авторизованные.
- Управление `feature_flags`, INSERT в snapshots/baseline — `mayor`.
- `incidents_severity_log` INSERT — только триггер (SECURITY DEFINER), пользователям INSERT/UPDATE/DELETE запрещён.
- `audit_log` SELECT — только `mayor`. INSERT — только триггер.

## Миграция 2 — функции, baseline-сид, триггеры

1. Функция `log_audit()` (SECURITY DEFINER) — пишет в `audit_log` для INSERT/UPDATE/DELETE; для UPDATE считает diff по изменившимся ключам.
2. Функция `log_incident_severity()` — пишет в `incidents_severity_log` при создании или смене severity.
3. **Baseline-сид (до триггеров)**:
   ```sql
   INSERT INTO incidents_severity_log (incident_id, severity, changed_at, source)
   SELECT id, severity::text, created_at, 'baseline_seed' FROM incidents;
   ```
4. Триггеры на `incidents`:
   - `trg_audit_incidents` (AFTER INSERT/UPDATE/DELETE)
   - `trg_severity_log_incidents` (AFTER INSERT/UPDATE)

Аудит-триггеры на `tasks`/`contracts`/`projects`/`escalations` — в Этапе 7b (позже).

## После миграции

1. **Cron `daily-risk-snapshot`** — `0 0 * * *` UTC (= 03:00 МСК), вызывает edge `risk-snapshot`, вычисляет текущий индекс по существующей формуле v1 и пишет в `risk_index_snapshots`. Включаю pg_cron + pg_net.
2. **Edge `risk-snapshot`** — деплой, читает incidents/tasks/projects, считает индекс, инсертит снимок.
3. **Одноразовый INSERT** текущей точки в `risk_index_snapshots` (стартовая точка серии).
4. **Baseline-метрики** — INSERT в `metrics_baseline`:
   - `escalations_per_day` — за доступный месяц
   - `escalation_avg_lifetime_minutes`
   - `confidence_p25/p50/p75/p95` из `staging_raw`
   - `ai_failure_rate_30d` из `ai_logs`
5. **Экспорт** `/mnt/documents/baseline_2026-05-03.csv`.

## Дальше (по плану v3)

После завершения Этапа 0+7a — **Этап 5: Fallback ИИ + дедуп Telegram-алертов**. Без миграций (только код фронта + новая edge `notify-admin` + sessionStorage для статуса AI).

---

Подтверждаю готовность. Жму approve — выполняю миграцию.