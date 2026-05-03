
CREATE TABLE public.sla_matrix_draft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type incident_type NOT NULL,
  severity incident_severity NOT NULL,
  reaction_hours integer NOT NULL DEFAULT 4,
  resolution_hours integer NOT NULL DEFAULT 48,
  approved boolean NOT NULL DEFAULT false,
  note text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_type, severity)
);

ALTER TABLE public.sla_matrix_draft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mayor/Deputy read sla_matrix_draft"
  ON public.sla_matrix_draft FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

CREATE POLICY "Mayor/Deputy manage sla_matrix_draft"
  ON public.sla_matrix_draft FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role))
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

CREATE TRIGGER sla_matrix_draft_updated
  BEFORE UPDATE ON public.sla_matrix_draft
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed defaults: cartesian (type x severity) with sensible starting values
INSERT INTO public.sla_matrix_draft (incident_type, severity, reaction_hours, resolution_hours)
SELECT t::incident_type, s::incident_severity,
  CASE s WHEN 'high' THEN 1 WHEN 'medium' THEN 4 ELSE 12 END,
  CASE s WHEN 'high' THEN 8 WHEN 'medium' THEN 48 ELSE 168 END
FROM unnest(ARRAY['housing','road','social','ecology','transport','other']) t
CROSS JOIN unnest(ARRAY['low','medium','high']) s
ON CONFLICT DO NOTHING;
