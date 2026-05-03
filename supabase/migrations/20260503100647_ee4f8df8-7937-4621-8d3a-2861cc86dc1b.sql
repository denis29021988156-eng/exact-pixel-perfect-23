
CREATE TABLE public.ai_status_state (
  id integer PRIMARY KEY DEFAULT 1,
  current_state text NOT NULL DEFAULT 'active',  -- 'active' | 'degraded' | 'down'
  last_changed_at timestamptz NOT NULL DEFAULT now(),
  last_alert_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0,
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO public.ai_status_state (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.ai_status_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ai_status"
  ON public.ai_status_state FOR SELECT TO authenticated USING (true);
