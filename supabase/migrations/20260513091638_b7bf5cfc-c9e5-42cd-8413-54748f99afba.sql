
-- 1. Snapshot table
CREATE TABLE IF NOT EXISTS public.public_metrics_snapshot (
  id integer PRIMARY KEY DEFAULT 1,
  active_incidents integer NOT NULL DEFAULT 0,
  critical_incidents integer NOT NULL DEFAULT 0,
  active_tasks integer NOT NULL DEFAULT 0,
  active_projects integer NOT NULL DEFAULT 0,
  risk_projects integer NOT NULL DEFAULT 0,
  total_budget numeric NOT NULL DEFAULT 0,
  spent_budget numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_metrics_snapshot_singleton CHECK (id = 1)
);

ALTER TABLE public.public_metrics_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon read public_metrics_snapshot" ON public.public_metrics_snapshot;
CREATE POLICY "Anon read public_metrics_snapshot"
  ON public.public_metrics_snapshot FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated read public_metrics_snapshot" ON public.public_metrics_snapshot;
CREATE POLICY "Authenticated read public_metrics_snapshot"
  ON public.public_metrics_snapshot FOR SELECT TO authenticated USING (true);

-- Seed singleton row
INSERT INTO public.public_metrics_snapshot (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- 2. Refresh function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.refresh_public_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_metrics_snapshot AS s (
    id, active_incidents, critical_incidents, active_tasks,
    active_projects, risk_projects, total_budget, spent_budget, updated_at
  )
  VALUES (
    1,
    (SELECT count(*) FROM public.incidents WHERE status IN ('new','in_progress')),
    (SELECT count(*) FROM public.incidents WHERE severity = 'high' AND status IN ('new','in_progress')),
    (SELECT count(*) FROM public.tasks WHERE status IN ('new','in_progress')),
    (SELECT count(*) FROM public.projects WHERE status IN ('on_track','risk','overdue')),
    (SELECT count(*) FROM public.projects WHERE status IN ('risk','overdue')),
    (SELECT COALESCE(sum(budget_total), 0) FROM public.projects),
    (SELECT COALESCE(sum(budget_spent), 0) FROM public.projects),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    active_incidents = EXCLUDED.active_incidents,
    critical_incidents = EXCLUDED.critical_incidents,
    active_tasks = EXCLUDED.active_tasks,
    active_projects = EXCLUDED.active_projects,
    risk_projects = EXCLUDED.risk_projects,
    total_budget = EXCLUDED.total_budget,
    spent_budget = EXCLUDED.spent_budget,
    updated_at = EXCLUDED.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_public_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_public_metrics() TO authenticated, service_role;

-- 3. Replace view to read from snapshot (contract preserved)
DROP VIEW IF EXISTS public.public_metrics CASCADE;
CREATE VIEW public.public_metrics
WITH (security_invoker = true) AS
SELECT
  active_incidents,
  critical_incidents,
  active_tasks,
  active_projects,
  risk_projects,
  total_budget,
  spent_budget
FROM public.public_metrics_snapshot
WHERE id = 1;

GRANT SELECT ON public.public_metrics TO anon, authenticated;

-- 4. Initial snapshot fill
SELECT public.refresh_public_metrics();

-- 5. Defense-in-depth REVOKE on benchmarks for anon only
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.benchmarks FROM anon;

-- 6. Schedule cron job (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('refresh-public-metrics')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-public-metrics');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'refresh-public-metrics',
  '*/15 * * * *',
  'SELECT public.refresh_public_metrics();'
);
