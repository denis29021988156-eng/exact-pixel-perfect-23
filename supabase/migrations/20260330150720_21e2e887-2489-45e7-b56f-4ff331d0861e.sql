
-- Fix: recreate view with SECURITY INVOKER (default in PG15+, but explicit for linter)
DROP VIEW IF EXISTS public.public_metrics;
CREATE VIEW public.public_metrics WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM incidents WHERE status IN ('new', 'in_progress')) AS active_incidents,
  (SELECT count(*) FROM incidents WHERE severity = 'high' AND status IN ('new', 'in_progress')) AS critical_incidents,
  (SELECT count(*) FROM tasks WHERE status IN ('new', 'in_progress')) AS active_tasks,
  (SELECT count(*) FROM projects WHERE status IN ('on_track', 'risk', 'overdue')) AS active_projects,
  (SELECT count(*) FROM projects WHERE status IN ('risk', 'overdue')) AS risk_projects,
  (SELECT COALESCE(sum(budget_total), 0) FROM projects) AS total_budget,
  (SELECT COALESCE(sum(budget_spent), 0) FROM projects) AS spent_budget;

GRANT SELECT ON public.public_metrics TO anon;
GRANT SELECT ON public.public_metrics TO authenticated;
