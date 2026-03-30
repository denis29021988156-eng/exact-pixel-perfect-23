
-- Add political_sensitivity to incidents, projects, contracts
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS political_sensitivity text NOT NULL DEFAULT 'low';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS political_sensitivity text NOT NULL DEFAULT 'low';

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS political_sensitivity text NOT NULL DEFAULT 'low';
