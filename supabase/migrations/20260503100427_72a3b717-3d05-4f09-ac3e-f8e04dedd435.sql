
-- ===== Migration 1: baseline tables =====

CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  enabled_for_roles text[] NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL DEFAULT '{}',
  enabled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  description text
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read feature_flags"
  ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor manage feature_flags"
  ON public.feature_flags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

INSERT INTO public.feature_flags (key, enabled, enabled_at, description) VALUES
  ('risk_engine_v2', false, NULL, 'New Risk Engine with saturation curve. Requires 30+ daily snapshots before enabling.'),
  ('sla_matrix_active', false, NULL, 'Use sla_matrix table to compute deadlines on incident insert.'),
  ('moderation_thresholds_v2', false, NULL, 'Auto-approve >=0.9 confidence, except high/critical severity.'),
  ('copilot_token_budget', false, NULL, 'Token-budget conversation window with pinnedContext.'),
  ('escalation_dedup', false, NULL, 'Dedup key + suppression window for escalations.'),
  ('audit_enabled', true, now(), 'Mutation audit logging on critical entities. Enabled at start.'),
  ('public_aggregation_v2', false, NULL, 'Per-type public visibility (exact/aggregated/hidden).'),
  ('excel_strict_validation', false, NULL, 'Strict Excel ingestion: size limits, type normalization, formula stripping.'),
  ('ai_fallback_briefing', false, NULL, 'Deterministic briefing when AI is unavailable.');

CREATE TABLE public.risk_index_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  index_value integer NOT NULL,
  level text NOT NULL,
  components jsonb NOT NULL DEFAULT '{}',
  formula_version text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_snapshots_date ON public.risk_index_snapshots(snapshot_date DESC);
ALTER TABLE public.risk_index_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read risk_snapshots"
  ON public.risk_index_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor insert risk_snapshots"
  ON public.risk_index_snapshots FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

CREATE TABLE public.metrics_baseline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric text NOT NULL,
  value numeric NOT NULL,
  context jsonb NOT NULL DEFAULT '{}',
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_metrics_baseline_metric ON public.metrics_baseline(metric, captured_at DESC);
ALTER TABLE public.metrics_baseline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read metrics_baseline"
  ON public.metrics_baseline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor insert metrics_baseline"
  ON public.metrics_baseline FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

CREATE TABLE public.incidents_severity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL,
  severity text NOT NULL,
  previous_severity text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  source text NOT NULL DEFAULT 'trigger'
);
CREATE INDEX idx_severity_log_incident ON public.incidents_severity_log(incident_id, changed_at DESC);
ALTER TABLE public.incidents_severity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read severity_log"
  ON public.incidents_severity_log FOR SELECT TO authenticated USING (true);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mayor read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role));

-- ===== Migration 2: functions, baseline seed, triggers =====

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before jsonb;
  v_after jsonb;
  v_diff jsonb;
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
    v_diff := v_before;
    v_id := (OLD).id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    SELECT jsonb_object_agg(key, jsonb_build_object('from', v_before->key, 'to', v_after->key))
      INTO v_diff
      FROM jsonb_object_keys(v_after) AS key
      WHERE v_before->key IS DISTINCT FROM v_after->key;
    v_id := (NEW).id;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
    v_diff := v_after;
    v_id := (NEW).id;
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, before_data, after_data, diff)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_id, v_before, v_after, v_diff);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_incident_severity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.severity IS DISTINCT FROM NEW.severity) THEN
    INSERT INTO public.incidents_severity_log (incident_id, severity, previous_severity, changed_by, source)
    VALUES (
      NEW.id,
      NEW.severity::text,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.severity::text ELSE NULL END,
      auth.uid(),
      'trigger'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Baseline seed BEFORE creating triggers (avoids duplicate writes from new INSERT trigger)
INSERT INTO public.incidents_severity_log (incident_id, severity, previous_severity, changed_at, source)
SELECT id, severity::text, NULL, created_at, 'baseline_seed'
FROM public.incidents;

CREATE TRIGGER trg_audit_incidents
  AFTER INSERT OR UPDATE OR DELETE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER trg_severity_log_incidents
  AFTER INSERT OR UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.log_incident_severity();
