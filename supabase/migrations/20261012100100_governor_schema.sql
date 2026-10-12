-- Планшет губернатора: схема данных, доступы и функции экранов.
-- Миграция повторяемая: её можно применить ещё раз без ошибок.

------------------------------------------------------------------------------
-- 1. Закрываем старую систему (City OS)
------------------------------------------------------------------------------

-- Старые фоновые задания больше не нужны: они вызывали удалённые функции.
do $$
declare j record;
begin
  for j in select jobname from cron.job
    where jobname in ('weather-check-6h', 'daily-risk-snapshot', 'refresh-public-metrics', 'detect-complaint-surge')
  loop
    perform cron.unschedule(j.jobname);
  end loop;
end $$;

-- Снимаем все политики со старых таблиц: данные остаются в базе, но без доступа из приложения.
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in (
        'address_normalization', 'ai_conversations', 'ai_logs', 'ai_memory', 'ai_status_state', 'app_settings',
        'audit_log', 'benchmarks', 'budget_forecast', 'contracts', 'data_sources', 'escalations', 'feature_flags',
        'incidents', 'incidents_severity_log', 'ingestion_log', 'media_mentions', 'metrics_baseline', 'projects',
        'public_complaints', 'public_metrics_snapshot', 'risk_index_snapshots', 'scenario_history', 'sla_matrix_draft',
        'staging_raw', 'tasks', 'telegram_bot_state', 'telegram_messages', 'weather_alerts', 'weather_snapshot',
        'profiles')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Новым регистрациям роль больше не выдаётся: доступ даёт только администратор.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict do nothing;
  return new;
end;
$$;

-- Служебные функции старой системы не должны быть доступны без входа.
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.get_user_department(uuid) from anon, public;
revoke execute on function public.is_deputy_of_department(text) from anon, public;

------------------------------------------------------------------------------
-- 2. Роли
------------------------------------------------------------------------------

create or replace function public.has_any_role(_uid uuid, _roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _uid and role = any(_roles));
$$;

create or replace function public.gov_require(_roles public.app_role[])
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_any_role(auth.uid(), _roles) then
    raise exception 'Нет доступа' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.msk_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Europe/Moscow')::date;
$$;

-- Роль текущего пользователя в новой системе: admin, governor, team или null.
create or replace function public.gov_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.has_any_role(auth.uid(), array['admin']::public.app_role[]) then 'admin'
    when public.has_any_role(auth.uid(), array['governor']::public.app_role[]) then 'governor'
    when public.has_any_role(auth.uid(), array['team']::public.app_role[]) then 'team'
    else null
  end;
$$;

------------------------------------------------------------------------------
-- 3. Таблицы
------------------------------------------------------------------------------

alter table public.app_settings add column if not exists region_name text;
alter table public.app_settings add column if not exists demo_mode boolean not null default true;
insert into public.app_settings (id, city_name, region_name, city_lat, city_lng, demo_mode)
values (1, 'Тверь', 'Тверская область', 56.8587, 35.9176, true)
on conflict (id) do update
  set region_name = coalesce(public.app_settings.region_name, excluded.region_name),
      city_name = 'Тверь', city_lat = 56.8587, city_lng = 35.9176;

create table if not exists public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  center text,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.executors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  kind text not null check (kind in ('ministry', 'municipality', 'service')),
  municipality_id uuid references public.municipalities(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('incident', 'negative', 'deadline', 'complaints', 'media')),
  severity text not null check (severity in ('critical', 'high', 'medium')),
  title text not null,
  summary text,
  municipality_id uuid references public.municipalities(id) on delete set null,
  source text,
  mentions int,
  detected_at timestamptz not null default now(),
  ai_cause text,
  ai_forecast text,
  ai_recommendation text,
  suggested_title text,
  suggested_executor_id uuid references public.executors(id) on delete set null,
  suggested_due date,
  status text not null default 'new' check (status in ('new', 'assigned', 'watch', 'dismissed', 'resolved')),
  status_note text,
  instruction_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promises (
  id uuid primary key default gen_random_uuid(),
  said_on date not null,
  occasion text not null,
  text text not null,
  municipality_id uuid references public.municipalities(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.instructions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text,
  executor_id uuid not null references public.executors(id),
  municipality_id uuid references public.municipalities(id) on delete set null,
  due_date date not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'cancelled')),
  source text not null default 'manual' check (source in ('signal', 'promise', 'agenda', 'ask', 'manual')),
  signal_id uuid references public.signals(id) on delete set null,
  promise_id uuid references public.promises(id) on delete set null,
  effect text,
  effect_positive boolean,
  reminders int not null default 0,
  last_reminded_at timestamptz,
  postponed int not null default 0,
  done_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'signals_instruction_fk') then
    alter table public.signals
      add constraint signals_instruction_fk foreign key (instruction_id)
      references public.instructions(id) on delete set null;
  end if;
end $$;

create table if not exists public.instruction_events (
  id uuid primary key default gen_random_uuid(),
  instruction_id uuid not null references public.instructions(id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind in ('created', 'reminded', 'postponed', 'status', 'called', 'comment')),
  note text,
  actor uuid
);

create table if not exists public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  channel text not null check (channel in ('media', 'pr', 'gr', 'event')),
  title text not null,
  description text,
  municipality_id uuid references public.municipalities(id) on delete set null,
  expected_effect text,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'returned', 'done')),
  decision_note text,
  decided_at timestamptz,
  decided_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.comms_settings (
  id int primary key default 1 check (id = 1),
  tone jsonb not null default '[]'::jsonb,
  avoid jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.trust_index (
  day date primary key,
  value numeric(4,1) not null,
  media_tone numeric(4,1),
  appeals_resolved numeric(4,1),
  response_speed numeric(4,1),
  survey numeric(4,1),
  event_label text,
  event_kind text check (event_kind in ('event', 'project', 'pr', 'media', 'incident'))
);

create table if not exists public.daily_briefs (
  day date primary key,
  generated_at timestamptz not null default now(),
  source text not null check (source in ('ai', 'rules', 'seed')),
  headline text not null,
  summary text not null,
  items jsonb not null default '[]'::jsonb
);

create table if not exists public.ask_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  at timestamptz not null default now(),
  question text not null,
  answer jsonb,
  ok boolean not null default true
);

create table if not exists public.ai_calls (
  id bigserial primary key,
  user_id uuid not null,
  kind text not null,
  at timestamptz not null default now()
);

create index if not exists signals_status_idx on public.signals (status, severity, detected_at desc);
create index if not exists instructions_status_idx on public.instructions (status, due_date);
create index if not exists instructions_executor_idx on public.instructions (executor_id);
create index if not exists instruction_events_instruction_idx on public.instruction_events (instruction_id, at);
create index if not exists agenda_items_day_idx on public.agenda_items (day);
create index if not exists ask_log_user_idx on public.ask_log (user_id, at desc);
create index if not exists ai_calls_user_idx on public.ai_calls (user_id, kind, at desc);
create index if not exists user_roles_user_idx on public.user_roles (user_id);

------------------------------------------------------------------------------
-- 4. Доступы (RLS)
------------------------------------------------------------------------------

alter table public.app_settings enable row level security;
alter table public.municipalities enable row level security;
alter table public.executors enable row level security;
alter table public.signals enable row level security;
alter table public.promises enable row level security;
alter table public.instructions enable row level security;
alter table public.instruction_events enable row level security;
alter table public.agenda_items enable row level security;
alter table public.comms_settings enable row level security;
alter table public.trust_index enable row level security;
alter table public.daily_briefs enable row level security;
alter table public.ask_log enable row level security;
alter table public.ai_calls enable row level security;
alter table public.profiles enable row level security;

-- Читают губернатор, команда и администратор; меняют команда и администратор.
-- Губернатор меняет данные только через функции ниже.
do $$
declare t text;
begin
  foreach t in array array['municipalities', 'executors', 'signals', 'promises', 'instructions', 'instruction_events',
                           'agenda_items', 'comms_settings', 'trust_index', 'daily_briefs', 'app_settings']
  loop
    execute format('drop policy if exists gov_read on public.%I', t);
    execute format('drop policy if exists team_write on public.%I', t);
    execute format($p$create policy gov_read on public.%I for select to authenticated
      using (public.has_any_role(auth.uid(), array['governor','team','admin']::public.app_role[]))$p$, t);
    execute format($p$create policy team_write on public.%I for all to authenticated
      using (public.has_any_role(auth.uid(), array['team','admin']::public.app_role[]))
      with check (public.has_any_role(auth.uid(), array['team','admin']::public.app_role[]))$p$, t);
  end loop;
end $$;

-- Настройки системы меняет только администратор.
drop policy if exists team_write on public.app_settings;
drop policy if exists admin_write on public.app_settings;
create policy admin_write on public.app_settings for all to authenticated
  using (public.has_any_role(auth.uid(), array['admin']::public.app_role[]))
  with check (public.has_any_role(auth.uid(), array['admin']::public.app_role[]));

-- Вопросы к ИИ видит только автор (и администратор). Пишет их функция gov_log_ask.
drop policy if exists own_read on public.ask_log;
create policy own_read on public.ask_log for select to authenticated
  using (user_id = auth.uid() or public.has_any_role(auth.uid(), array['admin']::public.app_role[]));

-- ai_calls: только служебный счётчик, доступа из приложения нет.

-- Профили: свой профиль; администратор и команда видят все.
drop policy if exists own_profile_read on public.profiles;
drop policy if exists own_profile_update on public.profiles;
drop policy if exists staff_profile_read on public.profiles;
create policy own_profile_read on public.profiles for select to authenticated
  using (user_id = auth.uid());
create policy staff_profile_read on public.profiles for select to authenticated
  using (public.has_any_role(auth.uid(), array['team','admin']::public.app_role[]));
create policy own_profile_update on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

------------------------------------------------------------------------------
-- 5. Сборка данных для экранов
------------------------------------------------------------------------------

create or replace function public._severity_rank(_s text)
returns int
language sql
immutable
as $$
  select case _s when 'critical' then 3 when 'high' then 2 else 1 end;
$$;

create or replace function public._signal_json(s public.signals)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', s.id,
    'kind', s.kind,
    'severity', s.severity,
    'title', s.title,
    'summary', s.summary,
    'municipality', (select jsonb_build_object('id', m.id, 'name', m.name) from public.municipalities m where m.id = s.municipality_id),
    'source', s.source,
    'mentions', s.mentions,
    'detected_at', s.detected_at,
    'ai_cause', s.ai_cause,
    'ai_forecast', s.ai_forecast,
    'ai_recommendation', s.ai_recommendation,
    'suggested_title', s.suggested_title,
    'suggested_executor', (select jsonb_build_object('id', e.id, 'name', e.name, 'short_name', e.short_name)
                           from public.executors e where e.id = s.suggested_executor_id),
    'suggested_due', s.suggested_due,
    'status', s.status,
    'status_note', s.status_note,
    'updated_at', s.updated_at,
    'instruction', (select jsonb_build_object(
                      'id', i.id, 'title', i.title, 'status', i.status, 'due_date', i.due_date,
                      'executor', (select e2.name from public.executors e2 where e2.id = i.executor_id))
                    from public.instructions i where i.id = s.instruction_id)
  );
$$;

create or replace function public._instruction_json(i public.instructions, _today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', i.id,
    'title', i.title,
    'details', i.details,
    'executor', (select jsonb_build_object('id', e.id, 'name', e.name, 'short_name', e.short_name)
                 from public.executors e where e.id = i.executor_id),
    'municipality', (select jsonb_build_object('id', m.id, 'name', m.name) from public.municipalities m where m.id = i.municipality_id),
    'due_date', i.due_date,
    'status', i.status,
    'source', i.source,
    'overdue_days', case when i.status in ('new', 'in_progress') and i.due_date < _today then _today - i.due_date else 0 end,
    'days_left', case when i.status in ('new', 'in_progress') and i.due_date >= _today then i.due_date - _today else null end,
    'late', case when i.status = 'done' and i.done_at is not null
                 then (i.done_at at time zone 'Europe/Moscow')::date > i.due_date else null end,
    'effect', i.effect,
    'effect_positive', i.effect_positive,
    'reminders', i.reminders,
    'last_reminded_at', i.last_reminded_at,
    'postponed', i.postponed,
    'created_at', i.created_at,
    'done_at', i.done_at,
    'signal', (select jsonb_build_object('id', s.id, 'title', s.title) from public.signals s where s.id = i.signal_id),
    'promise', (select jsonb_build_object('id', p.id, 'text', p.text, 'occasion', p.occasion, 'said_on', p.said_on)
                from public.promises p where p.id = i.promise_id),
    'events', coalesce((select jsonb_agg(jsonb_build_object('at', ev.at, 'kind', ev.kind, 'note', ev.note) order by ev.at)
                        from public.instruction_events ev where ev.instruction_id = i.id), '[]'::jsonb)
  );
$$;

create or replace function public._promise_json(p public.promises, _today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'said_on', p.said_on,
    'occasion', p.occasion,
    'text', p.text,
    'due_date', p.due_date,
    'municipality', (select jsonb_build_object('id', m.id, 'name', m.name) from public.municipalities m where m.id = p.municipality_id),
    'instruction', (select jsonb_build_object(
                      'id', i.id, 'title', i.title, 'status', i.status, 'due_date', i.due_date,
                      'executor', (select e.name from public.executors e where e.id = i.executor_id),
                      'overdue_days', case when i.status in ('new', 'in_progress') and i.due_date < _today then _today - i.due_date else 0 end,
                      'effect', i.effect)
                    from public.instructions i where i.promise_id = p.id and i.status <> 'cancelled'
                    order by i.created_at desc limit 1),
    'state', coalesce((select case
                         when i.status = 'done' then 'kept'
                         when i.due_date < _today then 'at_risk'
                         else 'in_progress' end
                       from public.instructions i where i.promise_id = p.id and i.status <> 'cancelled'
                       order by i.created_at desc limit 1), 'no_instruction')
  );
$$;

create or replace function public._trust_series(_today date, _days int)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('day', t.day, 'value', t.value, 'event_label', t.event_label, 'event_kind', t.event_kind)
                            order by t.day), '[]'::jsonb)
  from public.trust_index t
  where t.day > _today - _days and t.day <= _today;
$$;

create or replace function public._trust_summary(_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cur public.trust_index;
  prev_day numeric;
  prev_week numeric;
begin
  select * into cur from public.trust_index where day <= _today order by day desc limit 1;
  if cur.day is null then
    return null;
  end if;
  select value into prev_day from public.trust_index where day < cur.day order by day desc limit 1;
  select value into prev_week from public.trust_index where day <= cur.day - 7 order by day desc limit 1;
  return jsonb_build_object(
    'day', cur.day,
    'value', cur.value,
    'delta_day', case when prev_day is null then null else round(cur.value - prev_day, 1) end,
    'delta_week', case when prev_week is null then null else round(cur.value - prev_week, 1) end,
    'components', jsonb_build_object(
      'media_tone', cur.media_tone,
      'appeals_resolved', cur.appeals_resolved,
      'response_speed', cur.response_speed,
      'survey', cur.survey),
    'series', public._trust_series(_today, 30)
  );
end;
$$;

create or replace function public._gov_today_payload(_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_brief jsonb;
  v_top jsonb;
  v_sig jsonb;
  v_ag jsonb;
  v_decisions jsonb;
  v_counts jsonb;
begin
  select jsonb_build_object('day', b.day, 'headline', b.headline, 'summary', b.summary, 'source', b.source,
                            'generated_at', b.generated_at, 'items', b.items)
    into v_brief
    from public.daily_briefs b where b.day = _today;

  select coalesce(jsonb_agg(public._signal_json(s) order by public._severity_rank(s.severity) desc, s.detected_at desc), '[]'::jsonb)
    into v_top
    from (select * from public.signals
          where status in ('new', 'watch')
          order by public._severity_rank(severity) desc, detected_at desc
          limit 6) s;

  select coalesce(jsonb_agg(j order by r desc, at desc), '[]'::jsonb)
    into v_sig
    from (
      select jsonb_build_object(
               'type', 'signal',
               'id', s.id,
               'title', s.title,
               'severity', s.severity,
               'subtitle', coalesce((select m.name from public.municipalities m where m.id = s.municipality_id), ''),
               'recommendation', s.ai_recommendation,
               'suggested_title', s.suggested_title,
               'executor', (select jsonb_build_object('id', e.id, 'name', e.name, 'short_name', e.short_name)
                            from public.executors e where e.id = s.suggested_executor_id),
               'due', s.suggested_due) as j,
             public._severity_rank(s.severity) as r,
             s.detected_at as at
      from public.signals s
      where s.status = 'new' and s.suggested_executor_id is not null
      order by public._severity_rank(s.severity) desc, s.detected_at desc
      limit 2
    ) q;

  select coalesce(jsonb_agg(j order by day), '[]'::jsonb)
    into v_ag
    from (
      select jsonb_build_object(
               'type', 'agenda',
               'id', a.id,
               'title', a.title,
               'channel', a.channel,
               'day', a.day,
               'subtitle', coalesce((select m.name from public.municipalities m where m.id = a.municipality_id), ''),
               'expected_effect', a.expected_effect) as j,
             a.day
      from public.agenda_items a
      where a.status = 'proposed' and a.day between _today and _today + 6
      -- Сначала то, что требует личного участия: выезды и мероприятия, потом GR, СМИ и PR.
      order by case a.channel when 'event' then 0 when 'gr' then 1 when 'media' then 2 else 3 end, a.day, a.created_at
      limit 1
    ) q;

  v_decisions := v_sig || v_ag;

  select jsonb_build_object(
    'signals_open', (select count(*) from public.signals where status in ('new', 'watch')),
    'signals_new', (select count(*) from public.signals where status = 'new'),
    'signals_critical', (select count(*) from public.signals where status in ('new', 'watch') and severity = 'critical'),
    'instructions_overdue', (select count(*) from public.instructions where status in ('new', 'in_progress') and due_date < _today),
    'instructions_active', (select count(*) from public.instructions where status in ('new', 'in_progress')),
    'instructions_done_week', (select count(*) from public.instructions
                               where status = 'done' and (done_at at time zone 'Europe/Moscow')::date > _today - 7),
    'agenda_pending', (select count(*) from public.agenda_items where status = 'proposed' and day >= _today),
    'promises_at_risk', (select count(*) from public.promises p
                         where (public._promise_json(p, _today)->>'state') in ('at_risk', 'no_instruction'))
  ) into v_counts;

  return jsonb_build_object(
    'date', _today,
    'region', (select coalesce(region_name, city_name) from public.app_settings where id = 1),
    'demo', coalesce((select demo_mode from public.app_settings where id = 1), false),
    'brief', v_brief,
    'trust', public._trust_summary(_today),
    'top', v_top,
    'decisions', v_decisions,
    'counts', v_counts
  );
end;
$$;

create or replace function public._gov_signals_payload(_today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(public._signal_json(s) order by
               case s.status when 'new' then 0 when 'watch' then 1 when 'assigned' then 2 when 'resolved' then 3 else 4 end,
               public._severity_rank(s.severity) desc,
               s.detected_at desc)
      from public.signals s
      where s.status in ('new', 'watch', 'assigned')
         or (s.status in ('resolved', 'dismissed') and s.updated_at > now() - interval '10 days')), '[]'::jsonb),
    'executors', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'short_name', e.short_name, 'kind', e.kind)
                       order by e.kind, e.name)
      from public.executors e), '[]'::jsonb)
  );
$$;

create or replace function public._gov_instructions_payload(_today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(public._instruction_json(i, _today) order by i.due_date, i.created_at)
      from public.instructions i
      where i.status in ('new', 'in_progress')
         or (i.status = 'done' and i.done_at > now() - interval '30 days')), '[]'::jsonb),
    'executors', coalesce((
      select jsonb_agg(x)
      from (
        select jsonb_build_object(
          'id', e.id,
          'name', e.name,
          'short_name', e.short_name,
          'active', count(*) filter (where i.status in ('new', 'in_progress')),
          'overdue', count(*) filter (where i.status in ('new', 'in_progress') and i.due_date < _today),
          'done_on_time', count(*) filter (where i.status = 'done' and (i.done_at at time zone 'Europe/Moscow')::date <= i.due_date),
          'done_late', count(*) filter (where i.status = 'done' and (i.done_at at time zone 'Europe/Moscow')::date > i.due_date),
          'on_time_rate', case
            when count(*) filter (where i.status = 'done' or (i.status in ('new', 'in_progress') and i.due_date < _today)) = 0 then null
            else round(100.0 * count(*) filter (where i.status = 'done' and (i.done_at at time zone 'Europe/Moscow')::date <= i.due_date)
                       / count(*) filter (where i.status = 'done' or (i.status in ('new', 'in_progress') and i.due_date < _today)))
          end
        ) as x
        from public.executors e
        join public.instructions i on i.executor_id = e.id and i.status <> 'cancelled'
        group by e.id, e.name, e.short_name
      ) q), '[]'::jsonb),
    'promises', coalesce((
      select jsonb_agg(public._promise_json(p, _today) order by p.said_on desc)
      from public.promises p), '[]'::jsonb),
    'executor_options', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'short_name', e.short_name) order by e.kind, e.name)
      from public.executors e), '[]'::jsonb)
  );
$$;

-- Повестка: прошедшая неделя и три недели вперёд одним списком.
drop function if exists public._gov_agenda_payload(date, date);
create or replace function public._gov_agenda_payload(_today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'today', _today,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id,
               'day', a.day,
               'channel', a.channel,
               'title', a.title,
               'description', a.description,
               'municipality', (select jsonb_build_object('id', m.id, 'name', m.name) from public.municipalities m where m.id = a.municipality_id),
               'expected_effect', a.expected_effect,
               'status', a.status,
               'decision_note', a.decision_note,
               'decided_at', a.decided_at) order by a.day, a.created_at)
      from public.agenda_items a
      where a.day between _today - 7 and _today + 21), '[]'::jsonb),
    'tone', (select jsonb_build_object('tone', c.tone, 'avoid', c.avoid) from public.comms_settings c where c.id = 1),
    'trust', public._trust_series(_today, 120),
    'trust_summary', public._trust_summary(_today) - 'series'
  );
$$;

-- Сводка данных для ИИ: коротко, только то, что нужно для ответа.
create or replace function public._gov_context_payload(_today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'today', _today,
    'region', (select coalesce(region_name, city_name) from public.app_settings where id = 1),
    'trust', (public._trust_summary(_today) - 'series')
             || jsonb_build_object('last14', coalesce((
                  select jsonb_agg(jsonb_build_object('day', t.day, 'value', t.value, 'event', t.event_label) order by t.day)
                  from public.trust_index t where t.day > _today - 14 and t.day <= _today), '[]'::jsonb)),
    'signals', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id, 'title', s.title, 'kind', s.kind, 'severity', s.severity, 'status', s.status,
               'where', m.name, 'summary', s.summary, 'cause', s.ai_cause, 'forecast', s.ai_forecast,
               'recommendation', s.ai_recommendation, 'mentions', s.mentions,
               'detected', to_char(s.detected_at at time zone 'Europe/Moscow', 'DD.MM HH24:MI'),
               'suggested_executor_id', s.suggested_executor_id, 'suggested_title', s.suggested_title,
               'suggested_due', s.suggested_due, 'municipality_id', s.municipality_id)
             order by public._severity_rank(s.severity) desc, s.detected_at desc)
      from public.signals s left join public.municipalities m on m.id = s.municipality_id
      where s.status in ('new', 'watch', 'assigned')
         or (s.status = 'resolved' and s.updated_at > now() - interval '14 days')), '[]'::jsonb),
    'instructions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i.id, 'title', i.title, 'executor', e.name, 'executor_id', e.id, 'where', m.name,
               'due', i.due_date, 'status', i.status,
               'overdue_days', case when i.status in ('new', 'in_progress') and i.due_date < _today then _today - i.due_date else 0 end,
               'reminders', i.reminders, 'effect', i.effect)
             order by i.due_date)
      from public.instructions i
      join public.executors e on e.id = i.executor_id
      left join public.municipalities m on m.id = i.municipality_id
      where i.status in ('new', 'in_progress') or (i.status = 'done' and i.done_at > now() - interval '21 days')), '[]'::jsonb),
    'agenda', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'day', a.day, 'channel', a.channel, 'title', a.title, 'status', a.status, 'where', m.name)
             order by a.day)
      from public.agenda_items a left join public.municipalities m on m.id = a.municipality_id
      where a.day between _today - 2 and _today + 10), '[]'::jsonb),
    'promises', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'said_on', p.said_on, 'occasion', p.occasion, 'text', p.text,
               'state', public._promise_json(p, _today)->>'state'))
      from public.promises p), '[]'::jsonb),
    'executors', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'short_name', e.short_name) order by e.name) from public.executors e), '[]'::jsonb),
    'municipalities', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name) order by m.sort, m.name) from public.municipalities m), '[]'::jsonb),
    'tone', (select c.tone from public.comms_settings c where c.id = 1)
  );
$$;

------------------------------------------------------------------------------
-- 6. Функции экранов (вызываются из приложения)
------------------------------------------------------------------------------

create or replace function public.gov_today()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  return public._gov_today_payload(public.msk_today());
end;
$$;

create or replace function public.gov_signals()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  return public._gov_signals_payload(public.msk_today());
end;
$$;

create or replace function public.gov_instructions()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  return public._gov_instructions_payload(public.msk_today());
end;
$$;

drop function if exists public.gov_agenda(date);
create or replace function public.gov_agenda()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  return public._gov_agenda_payload(public.msk_today());
end;
$$;

create or replace function public.gov_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  return public._gov_context_payload(public.msk_today());
end;
$$;

-- Поручить по сигналу: одно касание создаёт поручение с исполнителем и сроком.
create or replace function public.gov_assign_signal(
  _signal_id uuid,
  _executor_id uuid default null,
  _due date default null,
  _title text default null,
  _note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  s public.signals;
  v_exec uuid;
  v_due date;
  v_id uuid;
  v_today date := public.msk_today();
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  select * into s from public.signals where id = _signal_id for update;
  if s.id is null then
    raise exception 'Сигнал не найден' using errcode = 'P0002';
  end if;
  if s.status not in ('new', 'watch') then
    raise exception 'По этому сигналу уже принято решение' using errcode = 'P0001';
  end if;
  v_exec := coalesce(_executor_id, s.suggested_executor_id);
  if v_exec is null or not exists (select 1 from public.executors where id = v_exec) then
    raise exception 'Выберите исполнителя' using errcode = 'P0001';
  end if;
  v_due := coalesce(_due, s.suggested_due, v_today + 3);
  if v_due < v_today then
    raise exception 'Срок не может быть в прошлом' using errcode = 'P0001';
  end if;

  insert into public.instructions (title, details, executor_id, municipality_id, due_date, status, source, signal_id, created_by)
  values (
    coalesce(nullif(btrim(_title), ''), s.suggested_title, 'Принять меры: ' || s.title),
    coalesce(nullif(btrim(_note), ''), s.ai_recommendation),
    v_exec, s.municipality_id, v_due, 'new', 'signal', s.id, auth.uid())
  returning id into v_id;

  insert into public.instruction_events (instruction_id, kind, note, actor)
  values (v_id, 'created', 'Поручено по сигналу «' || s.title || '»', auth.uid());

  update public.signals set status = 'assigned', instruction_id = v_id, updated_at = now() where id = s.id;

  return public._instruction_json((select i from public.instructions i where i.id = v_id), v_today);
end;
$$;

create or replace function public.gov_signal_status(_signal_id uuid, _status text, _note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  if _status not in ('new', 'watch', 'dismissed') then
    raise exception 'Недопустимый статус' using errcode = 'P0001';
  end if;
  update public.signals
     set status = _status, status_note = nullif(btrim(coalesce(_note, '')), ''), updated_at = now()
   where id = _signal_id and status in ('new', 'watch', 'dismissed');
  if not found then
    raise exception 'Сигнал не найден или уже в работе' using errcode = 'P0001';
  end if;
  return public._signal_json((select s from public.signals s where s.id = _signal_id));
end;
$$;

create or replace function public.gov_create_instruction(
  _title text,
  _executor_id uuid,
  _due date,
  _municipality_id uuid default null,
  _details text default null,
  _source text default 'manual',
  _promise_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_today date := public.msk_today();
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  if nullif(btrim(coalesce(_title, '')), '') is null then
    raise exception 'Напишите, что нужно сделать' using errcode = 'P0001';
  end if;
  if _executor_id is null or not exists (select 1 from public.executors where id = _executor_id) then
    raise exception 'Выберите исполнителя' using errcode = 'P0001';
  end if;
  if _due is null or _due < v_today then
    raise exception 'Срок не может быть в прошлом' using errcode = 'P0001';
  end if;
  if _source not in ('signal', 'promise', 'agenda', 'ask', 'manual') then
    raise exception 'Недопустимый источник' using errcode = 'P0001';
  end if;
  if _municipality_id is not null and not exists (select 1 from public.municipalities where id = _municipality_id) then
    _municipality_id := null;
  end if;
  if _promise_id is not null and not exists (select 1 from public.promises where id = _promise_id) then
    _promise_id := null;
  end if;

  insert into public.instructions (title, details, executor_id, municipality_id, due_date, status, source, promise_id, created_by)
  values (left(btrim(_title), 300), nullif(btrim(coalesce(_details, '')), ''), _executor_id, _municipality_id, _due, 'new',
          case when _promise_id is not null then 'promise' else _source end, _promise_id, auth.uid())
  returning id into v_id;

  insert into public.instruction_events (instruction_id, kind, note, actor)
  values (v_id, 'created',
          case
            when _promise_id is not null then 'Поручено по обещанию'
            when _source = 'ask' then 'Поручено из ответа ИИ'
            else 'Поручено'
          end,
          auth.uid());

  return public._instruction_json((select i from public.instructions i where i.id = v_id), v_today);
end;
$$;

-- «Отменить» сразу после поручения: только что созданное поручение удаляется,
-- сигнал возвращается в новые. Через 10 минут отменить уже нельзя.
create or replace function public.gov_cancel_instruction(_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  i public.instructions;
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  select * into i from public.instructions where id = _id for update;
  if i.id is null then
    raise exception 'Поручение не найдено' using errcode = 'P0002';
  end if;
  if i.status <> 'new' or i.created_at < now() - interval '10 minutes'
     or (i.created_by is distinct from auth.uid()
         and not public.has_any_role(auth.uid(), array['team', 'admin']::public.app_role[])) then
    raise exception 'Отменить можно только что созданное поручение' using errcode = 'P0001';
  end if;
  update public.signals set status = 'new', instruction_id = null, updated_at = now()
   where instruction_id = _id and status = 'assigned';
  delete from public.instructions where id = _id;
  return jsonb_build_object('id', _id, 'cancelled', true);
end;
$$;

create or replace function public.gov_remind(_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  i public.instructions;
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  select * into i from public.instructions where id = _id for update;
  if i.id is null or i.status not in ('new', 'in_progress') then
    raise exception 'Поручение не найдено или уже закрыто' using errcode = 'P0001';
  end if;
  if i.last_reminded_at is not null and i.last_reminded_at > now() - interval '10 minutes' then
    raise exception 'Напоминание уже отправлено несколько минут назад' using errcode = 'P0001';
  end if;
  update public.instructions
     set reminders = reminders + 1, last_reminded_at = now(), updated_at = now()
   where id = _id;
  insert into public.instruction_events (instruction_id, kind, note, actor)
  values (_id, 'reminded', 'Напоминание исполнителю', auth.uid());
  return public._instruction_json((select x from public.instructions x where x.id = _id), public.msk_today());
end;
$$;

create or replace function public.gov_postpone(_id uuid, _due date, _note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  i public.instructions;
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  select * into i from public.instructions where id = _id for update;
  if i.id is null or i.status not in ('new', 'in_progress') then
    raise exception 'Поручение не найдено или уже закрыто' using errcode = 'P0001';
  end if;
  if _due is null or _due < public.msk_today() then
    raise exception 'Новый срок не может быть в прошлом' using errcode = 'P0001';
  end if;
  if _due = i.due_date then
    raise exception 'Срок не изменился' using errcode = 'P0001';
  end if;
  update public.instructions
     set due_date = _due, postponed = postponed + 1, updated_at = now()
   where id = _id;
  insert into public.instruction_events (instruction_id, kind, note, actor)
  values (_id, 'postponed',
          'Срок перенесён с ' || to_char(i.due_date, 'DD.MM') || ' на ' || to_char(_due, 'DD.MM')
            || coalesce('. ' || nullif(btrim(coalesce(_note, '')), ''), ''),
          auth.uid());
  return public._instruction_json((select x from public.instructions x where x.id = _id), public.msk_today());
end;
$$;

create or replace function public.gov_call_report(_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  if not exists (select 1 from public.instructions where id = _id and status in ('new', 'in_progress')) then
    raise exception 'Поручение не найдено или уже закрыто' using errcode = 'P0001';
  end if;
  insert into public.instruction_events (instruction_id, kind, note, actor)
  values (_id, 'called', 'Исполнитель вызван на доклад', auth.uid());
  update public.instructions set updated_at = now() where id = _id;
  return public._instruction_json((select x from public.instructions x where x.id = _id), public.msk_today());
end;
$$;

-- Команда отмечает ход и результат поручения.
create or replace function public.team_set_instruction_status(
  _id uuid,
  _status text,
  _effect text default null,
  _effect_positive boolean default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['team', 'admin']::public.app_role[]);
  if _status not in ('new', 'in_progress', 'done', 'cancelled') then
    raise exception 'Недопустимый статус' using errcode = 'P0001';
  end if;
  update public.instructions
     set status = _status,
         done_at = case when _status = 'done' then coalesce(done_at, now()) else null end,
         effect = case when _status = 'done' then coalesce(nullif(btrim(coalesce(_effect, '')), ''), effect) else effect end,
         effect_positive = case when _status = 'done' then coalesce(_effect_positive, effect_positive) else effect_positive end,
         updated_at = now()
   where id = _id;
  if not found then
    raise exception 'Поручение не найдено' using errcode = 'P0002';
  end if;
  insert into public.instruction_events (instruction_id, kind, note, actor)
  values (_id, 'status',
          case _status
            when 'in_progress' then 'Взято в работу'
            when 'done' then 'Выполнено' || coalesce(': ' || nullif(btrim(coalesce(_effect, '')), ''), '')
            when 'cancelled' then 'Отменено'
            else 'Возвращено в новые'
          end,
          auth.uid());
  -- Закрытое поручение закрывает и сигнал, из которого оно появилось.
  if _status = 'done' then
    update public.signals set status = 'resolved', updated_at = now()
     where instruction_id = _id and status = 'assigned';
  end if;
  return public._instruction_json((select x from public.instructions x where x.id = _id), public.msk_today());
end;
$$;

create or replace function public.gov_agenda_decide(_id uuid, _decision text, _note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  a public.agenda_items;
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  if _decision not in ('approved', 'returned', 'proposed') then
    raise exception 'Недопустимое решение' using errcode = 'P0001';
  end if;
  update public.agenda_items
     set status = _decision,
         decision_note = case when _decision = 'proposed' then null else nullif(btrim(coalesce(_note, '')), '') end,
         decided_at = case when _decision = 'proposed' then null else now() end,
         decided_by = case when _decision = 'proposed' then null else auth.uid() end
   where id = _id and status in ('proposed', 'approved', 'returned')
  returning * into a;
  if a.id is null then
    raise exception 'Пункт повестки не найден или уже прошёл' using errcode = 'P0001';
  end if;
  return jsonb_build_object('id', a.id, 'status', a.status, 'decision_note', a.decision_note, 'decided_at', a.decided_at);
end;
$$;

-- Лимит обращений к ИИ: защита от случайных и намеренных повторов.
create or replace function public.gov_ai_quota(_kind text, _limit int)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  n int;
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  if _kind not in ('ask', 'brief') then
    raise exception 'Недопустимый тип запроса' using errcode = 'P0001';
  end if;
  select count(*) into n from public.ai_calls
   where user_id = auth.uid() and kind = _kind and at > now() - interval '1 hour';
  if n >= least(greatest(coalesce(_limit, 1), 1), 60) then
    return false;
  end if;
  if (select count(*) from public.ai_calls where at > now() - interval '1 day') >= 600 then
    return false;
  end if;
  insert into public.ai_calls (user_id, kind) values (auth.uid(), _kind);
  return true;
end;
$$;

create or replace function public.gov_store_brief(_headline text, _summary text, _items jsonb, _source text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  d date := public.msk_today();
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  if _source not in ('ai', 'rules') then
    raise exception 'Недопустимый источник' using errcode = 'P0001';
  end if;
  if nullif(btrim(coalesce(_headline, '')), '') is null or nullif(btrim(coalesce(_summary, '')), '') is null then
    raise exception 'Пустая сводка' using errcode = 'P0001';
  end if;
  insert into public.daily_briefs (day, generated_at, source, headline, summary, items)
  values (d, now(), _source, left(btrim(_headline), 300), left(btrim(_summary), 2000),
          case when jsonb_typeof(_items) = 'array' then _items else '[]'::jsonb end)
  on conflict (day) do update
    set generated_at = excluded.generated_at, source = excluded.source, headline = excluded.headline,
        summary = excluded.summary, items = excluded.items;
  return (select jsonb_build_object('day', b.day, 'headline', b.headline, 'summary', b.summary, 'source', b.source,
                                    'generated_at', b.generated_at, 'items', b.items)
          from public.daily_briefs b where b.day = d);
end;
$$;

create or replace function public.gov_log_ask(_question text, _answer jsonb, _ok boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['governor', 'team', 'admin']::public.app_role[]);
  insert into public.ask_log (user_id, question, answer, ok)
  values (auth.uid(), left(coalesce(_question, ''), 2000), _answer, coalesce(_ok, false));
end;
$$;

-- Пользователи и роли (только администратор).
create or replace function public.admin_list_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['admin']::public.app_role[]);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', u.id,
             'email', u.email,
             'full_name', p.full_name,
             'role', (select r.role::text from public.user_roles r
                      where r.user_id = u.id and r.role in ('admin', 'governor', 'team')
                      order by case r.role when 'admin' then 1 when 'governor' then 2 else 3 end limit 1),
             'last_sign_in_at', u.last_sign_in_at,
             'created_at', u.created_at)
           order by u.created_at)
    from auth.users u
    left join public.profiles p on p.user_id = u.id), '[]'::jsonb);
end;
$$;

create or replace function public.admin_set_role(_user_id uuid, _role text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['admin']::public.app_role[]);
  if _role is not null and _role not in ('admin', 'governor', 'team') then
    raise exception 'Недопустимая роль' using errcode = 'P0001';
  end if;
  if _user_id = auth.uid() and coalesce(_role, '') <> 'admin' then
    raise exception 'Нельзя снять роль администратора с самого себя' using errcode = 'P0001';
  end if;
  delete from public.user_roles where user_id = _user_id and role in ('admin', 'governor', 'team');
  if _role is not null then
    insert into public.user_roles (user_id, role) values (_user_id, _role::public.app_role);
  end if;
end;
$$;

------------------------------------------------------------------------------
-- 7. Права на вызов функций
------------------------------------------------------------------------------

do $$
declare f record;
begin
  -- Внутренние функции: только для самой базы.
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('_signal_json', '_instruction_json', '_promise_json', '_trust_series', '_trust_summary',
                        '_gov_today_payload', '_gov_signals_payload', '_gov_instructions_payload',
                        '_gov_agenda_payload', '_gov_context_payload')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;

  -- Функции приложения: только для вошедших пользователей (роль проверяется внутри).
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('gov_today', 'gov_signals', 'gov_instructions', 'gov_agenda', 'gov_context',
                        'gov_assign_signal', 'gov_signal_status', 'gov_create_instruction', 'gov_cancel_instruction', 'gov_remind',
                        'gov_postpone', 'gov_call_report', 'team_set_instruction_status', 'gov_agenda_decide',
                        'gov_ai_quota', 'gov_store_brief', 'gov_log_ask', 'admin_list_users', 'admin_set_role',
                        'gov_my_role', 'has_any_role', 'gov_require')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
