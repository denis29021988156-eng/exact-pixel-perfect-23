

## City Intelligence OS — Plan for 10 Enhancements

This is a large-scale feature set. Below is a phased plan grouped by priority, preserving all existing logic (Risk Engine, AI modules, RLS, routes, edge functions).

---

### Phase 1: Critical (E001 + E006)

**E001 — Escalations and Notifications**

Database changes:
- Create table `escalations` (id, type, severity, source_type, source_id, message, suggested_action, status enum [active/acknowledged/resolved], channels jsonb, acknowledged_by uuid, acknowledged_at, created_at)
- Create DB function `check_and_create_escalation()` — called via trigger on `incidents` INSERT/UPDATE: if severity = 'high' AND sla_overdue = true, insert into `escalations`
- RLS: authenticated read all, mayor/deputy update (acknowledge)

Edge function:
- `send-notification` — accepts escalation_id, reads escalation + channels, sends via Telegram connector (if connected) or logs for future SMS/email. Retry logic with ai_logs entry.

UI:
- New `EscalationPanel` component on TodayPage — list of active escalations with [Принять меры] and [Отложить] buttons
- Escalation rules UI deferred to Phase 2 (hardcoded rules first)

**E006 — Role-based UI + PermissionGate**

- Create `PermissionGate` component: `<PermissionGate roles={['mayor','deputy']}>{children}</PermissionGate>`
- Refactor existing `useCanManage` usage to use PermissionGate where appropriate
- No demo switcher needed since auth is now enabled — skip DemoRoleSwitcher

---

### Phase 2: High Priority (E002 + E004 + E003)

**E002 — What-If Scenarios**

Database:
- Create table `scenario_history` (id, user_id, input_params jsonb, predicted_output jsonb, approved boolean default false, created_at)

Logic:
- Deterministic What-If engine in `src/lib/whatif/whatIfEngine.ts` — pure functions that take current stats + proposed action params, return predicted deltas using historical ratios
- Edge function `what-if-analyzer` — receives action type + params, queries current data, runs deterministic formula, returns prediction JSON

UI:
- What-If card on TodayPage: input form (action type dropdown, amount, target), "Calculate" button, result card with predicted impact
- [Утвердить] button creates a task via existing task creation flow (human-in-the-loop)

**E004 — Budget Forecast**

Database:
- Create table `budget_forecast` (id, contract_id uuid references contracts, planned_payment_date date, planned_amount numeric, actual_payment_date date, actual_amount numeric)
- Add columns to contracts: `execution_rate numeric default 0`, `risk_of_non_execution numeric default 0`

Logic:
- Edge function `budget-forecast` — calculates execution_rate = actual_spent / planned_by_now, risk = formula based on remaining time vs remaining budget
- If risk > 70% → auto-create escalation (ties into E001)

UI:
- Budget risk indicator on TodayPage — contracts with risk > 50% shown as warning cards

**E003 — City Pulse (Public Complaints)**

Database:
- Create table `public_complaints` (id, source text, topic text, district text, sentiment text, text text, created_at)

Logic:
- Edge function `fetch-complaints` — placeholder that accepts manual input or future API integration
- Divergence calculation: compare complaint topics vs incident types, flag >50% mismatch

UI:
- "Пульс города" block on TodayPage: top-5 complaint topics with trend indicators
- [Создать поручение] button (only for mayor/deputy via PermissionGate)

---

### Phase 3: Medium Priority (E005)

**E005 — Political Sensitivity Filter**

Database:
- Add column `political_sensitivity text default 'low'` to incidents, projects, contracts

UI/Logic:
- When sensitivity = 'high': action buttons visible only to mayor (via PermissionGate with roles=['mayor'])
- Deputies see "Требуется решение мэра" badge instead
- Update City Copilot system prompt: add instruction about high-sensitivity items
- Log who approved sensitive actions in ai_logs

---

### Phase 4: Low Priority (E007 + E008 + E009 + E010)

**E007 — Benchmarks**: Table `benchmarks`, manual data entry UI, comparison block on TodayPage

**E008 — Deputy Zones**: `profiles.department` already exists. Filter TodayPage data by deputy's department. Personalized AI briefing context.

**E009 — Reputation Dashboard**: Table `media_mentions`, new `/app/reputation` page with sentiment chart

**E010 — Public Dashboard**: New `/public` route (outside auth), DB view `public_metrics`, read-only aggregated data

---

### Technical Details

**New tables (6):** escalations, scenario_history, budget_forecast, public_complaints, benchmarks, media_mentions

**New columns (4):** contracts.execution_rate, contracts.risk_of_non_execution, incidents.political_sensitivity, projects.political_sensitivity, contracts.political_sensitivity

**New edge functions (4):** send-notification, what-if-analyzer, budget-forecast, fetch-complaints

**New components:** EscalationPanel, PermissionGate, WhatIfCard, BudgetRiskCard, CityPulseBlock

**Preserved:** Risk Engine formula, AI as interpreter only, human-in-the-loop, existing RLS, existing routes, existing edge functions (city-briefing, city-copilot), ai_logs table

**Data flow remains:**
```text
Database → Risk Engine (deterministic) → Data Aggregator → AI Module → Structured Output → User Confirmation → System Action
```

New data sources (escalations, complaints, budget) feed into the Data Aggregator as additional context fields — AI interprets but never executes CRUD.

---

### Recommended Implementation Order

I suggest starting with **Phase 1 (E001 + E006)** as it provides the most immediate operational value. Shall I proceed with Phase 1?

