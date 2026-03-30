
-- E002: What-If scenario history
CREATE TABLE public.scenario_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  input_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  predicted_output jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scenario_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read scenarios"
  ON public.scenario_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert scenarios"
  ON public.scenario_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mayor/Deputy update scenarios"
  ON public.scenario_history FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- E004: Budget forecast
CREATE TABLE public.budget_forecast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  planned_payment_date date,
  planned_amount numeric DEFAULT 0,
  actual_payment_date date,
  actual_amount numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_forecast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read budget_forecast"
  ON public.budget_forecast FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Mayor/Deputy insert budget_forecast"
  ON public.budget_forecast FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

CREATE POLICY "Mayor/Deputy update budget_forecast"
  ON public.budget_forecast FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Add execution_rate and risk_of_non_execution to contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS execution_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_of_non_execution numeric DEFAULT 0;

-- E003: Public complaints
CREATE TABLE public.public_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manual',
  topic text NOT NULL,
  district text,
  sentiment text DEFAULT 'neutral',
  complaint_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read complaints"
  ON public.public_complaints FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Mayor/Deputy insert complaints"
  ON public.public_complaints FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

CREATE POLICY "Mayor/Deputy update complaints"
  ON public.public_complaints FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));
