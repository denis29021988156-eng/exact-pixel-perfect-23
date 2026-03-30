
-- Escalation status enum
CREATE TYPE public.escalation_status AS ENUM ('active', 'acknowledged', 'resolved');

-- Escalations table
CREATE TABLE public.escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'incident',
  severity integer NOT NULL DEFAULT 4,
  source_type text NOT NULL DEFAULT 'incident',
  source_id uuid,
  message text NOT NULL,
  suggested_action text,
  status escalation_status NOT NULL DEFAULT 'active',
  channels jsonb DEFAULT '["in_app"]'::jsonb,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

-- All authenticated can read
CREATE POLICY "Authenticated read escalations"
  ON public.escalations FOR SELECT TO authenticated
  USING (true);

-- Mayor/Deputy can update (acknowledge/resolve)
CREATE POLICY "Mayor/Deputy update escalations"
  ON public.escalations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- System insert (via trigger, service role)
CREATE POLICY "Service insert escalations"
  ON public.escalations FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Allow service role inserts from triggers
CREATE POLICY "Trigger insert escalations"
  ON public.escalations FOR INSERT TO postgres
  WITH CHECK (true);

-- updated_at trigger
CREATE TRIGGER set_escalations_updated_at
  BEFORE UPDATE ON public.escalations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-create escalation from incidents
CREATE OR REPLACE FUNCTION public.check_and_create_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.severity = 'high' AND NEW.sla_overdue = true THEN
    INSERT INTO public.escalations (type, severity, source_type, source_id, message, suggested_action)
    VALUES (
      'sla_breach',
      5,
      'incident',
      NEW.id,
      'Критический инцидент с нарушением SLA: ' || NEW.title,
      'Требуется немедленное внимание. Проверьте ответственного и сроки.'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on incidents
CREATE TRIGGER escalation_check_on_incident
  AFTER INSERT OR UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION check_and_create_escalation();

-- Enable realtime for escalations
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalations;
