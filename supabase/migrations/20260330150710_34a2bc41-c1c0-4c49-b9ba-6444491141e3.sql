
-- E007: Benchmarks table
CREATE TABLE public.benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  norm_value numeric NOT NULL DEFAULT 0,
  city_name text DEFAULT 'Наш город',
  period text DEFAULT 'month',
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read benchmarks"
  ON public.benchmarks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Mayor/Deputy manage benchmarks"
  ON public.benchmarks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role))
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Public read for public dashboard
CREATE POLICY "Public read benchmarks"
  ON public.benchmarks FOR SELECT TO anon
  USING (true);

CREATE TRIGGER set_benchmarks_updated_at
  BEFORE UPDATE ON public.benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- E009: Media mentions table
CREATE TABLE public.media_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  url text,
  title text NOT NULL,
  sentiment text NOT NULL DEFAULT 'neutral',
  topic text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read media_mentions"
  ON public.media_mentions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Mayor/Deputy manage media_mentions"
  ON public.media_mentions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role))
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- E010: Public view for aggregated metrics (accessible without auth)
CREATE OR REPLACE VIEW public.public_metrics AS
SELECT
  (SELECT count(*) FROM incidents WHERE status IN ('new', 'in_progress')) AS active_incidents,
  (SELECT count(*) FROM incidents WHERE severity = 'high' AND status IN ('new', 'in_progress')) AS critical_incidents,
  (SELECT count(*) FROM tasks WHERE status IN ('new', 'in_progress')) AS active_tasks,
  (SELECT count(*) FROM projects WHERE status IN ('on_track', 'risk', 'overdue')) AS active_projects,
  (SELECT count(*) FROM projects WHERE status IN ('risk', 'overdue')) AS risk_projects,
  (SELECT COALESCE(sum(budget_total), 0) FROM projects) AS total_budget,
  (SELECT COALESCE(sum(budget_spent), 0) FROM projects) AS spent_budget;

-- Allow anonymous read on public_metrics
GRANT SELECT ON public.public_metrics TO anon;
GRANT SELECT ON public.public_metrics TO authenticated;

-- Allow anon to read incidents/tasks/projects count (view depends on these)
-- No direct table access for anon — view handles it via SECURITY INVOKER default
