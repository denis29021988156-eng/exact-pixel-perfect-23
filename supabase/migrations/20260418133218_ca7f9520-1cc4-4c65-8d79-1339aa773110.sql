
-- Phase A: Connectors Layer foundation

-- Enums
DO $$ BEGIN
  CREATE TYPE public.data_source_type AS ENUM ('email','excel','telegram','manual','db','api');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.data_source_status AS ENUM ('active','warning','error','disabled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.ingestion_status AS ENUM ('success','error','partial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.staging_status AS ENUM ('pending','parsed','normalized','rejected','promoted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- data_sources
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.data_source_type NOT NULL,
  status public.data_source_status NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  success_rate NUMERIC NOT NULL DEFAULT 100,
  latency_minutes NUMERIC NOT NULL DEFAULT 0,
  reliability NUMERIC NOT NULL DEFAULT 80,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read data_sources" ON public.data_sources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor manage data_sources" ON public.data_sources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'))
  WITH CHECK (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'));

CREATE TRIGGER data_sources_updated BEFORE UPDATE ON public.data_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ingestion_log
CREATE TABLE IF NOT EXISTS public.ingestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.data_sources(id) ON DELETE CASCADE,
  status public.ingestion_status NOT NULL,
  records_in INTEGER NOT NULL DEFAULT 0,
  records_normalized INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ingestion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ingestion_log" ON public.ingestion_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor insert ingestion_log" ON public.ingestion_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'));

CREATE INDEX IF NOT EXISTS idx_ingestion_log_source ON public.ingestion_log(source_id, created_at DESC);

-- staging_raw
CREATE TABLE IF NOT EXISTS public.staging_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  parsed_payload JSONB,
  status public.staging_status NOT NULL DEFAULT 'pending',
  confidence NUMERIC NOT NULL DEFAULT 0,
  target_table TEXT,
  target_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staging_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read staging_raw" ON public.staging_raw
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor manage staging_raw" ON public.staging_raw
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'))
  WITH CHECK (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'));

CREATE TRIGGER staging_raw_updated BEFORE UPDATE ON public.staging_raw
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_staging_raw_status ON public.staging_raw(status, created_at DESC);

-- address_normalization
CREATE TABLE IF NOT EXISTS public.address_normalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL UNIQUE,
  normalized_address TEXT NOT NULL,
  district TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.address_normalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read addresses" ON public.address_normalization
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor manage addresses" ON public.address_normalization
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'))
  WITH CHECK (public.has_role(auth.uid(),'mayor') OR public.has_role(auth.uid(),'deputy'));

-- Add confidence + provenance to incidents/tasks/public_complaints
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS raw_source_id UUID REFERENCES public.staging_raw(id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS raw_source_id UUID REFERENCES public.staging_raw(id) ON DELETE SET NULL;

ALTER TABLE public.public_complaints
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS raw_source_id UUID REFERENCES public.staging_raw(id) ON DELETE SET NULL;

-- Seed default sources
INSERT INTO public.data_sources (name, type, status, reliability, config) VALUES
  ('Ручной ввод', 'manual', 'active', 100, '{"description":"Прямое создание записей операторами"}'::jsonb),
  ('Excel/CSV загрузка', 'excel', 'active', 85, '{"description":"Импорт из таблиц администрации"}'::jsonb),
  ('Email-обращения', 'email', 'disabled', 70, '{"description":"Forward на webhook (требуется настройка)"}'::jsonb),
  ('Telegram-канал', 'telegram', 'disabled', 50, '{"description":"Жалобы из чатов жителей"}'::jsonb)
ON CONFLICT DO NOTHING;
