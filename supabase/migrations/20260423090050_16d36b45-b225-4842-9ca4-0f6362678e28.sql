
-- Настройки приложения (одна строка): город пилота
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY CHECK (id = 1),
  city_name TEXT NOT NULL DEFAULT 'Реутов',
  city_lat DOUBLE PRECISION,
  city_lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id, city_name, city_lat, city_lng)
VALUES (1, 'Реутов', 55.7611, 37.8589);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read app_settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mayor manages app_settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

-- Погодные алерты
CREATE TYPE public.weather_alert_type AS ENUM ('heavy_rain', 'heavy_snow', 'extreme_heat', 'extreme_cold', 'storm');
CREATE TYPE public.weather_alert_severity AS ENUM ('info', 'warning', 'danger');

CREATE TABLE public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  alert_type public.weather_alert_type NOT NULL,
  severity public.weather_alert_severity NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  peak_value NUMERIC,
  peak_unit TEXT,
  raw_forecast JSONB,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weather_alerts_active ON public.weather_alerts (created_at DESC) WHERE acknowledged = false;
CREATE UNIQUE INDEX uniq_weather_alert_window ON public.weather_alerts (city_name, alert_type, starts_at);

ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read weather_alerts"
  ON public.weather_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mayor/Deputy ack weather_alerts"
  ON public.weather_alerts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Текущий снимок прогноза (для виджета на дашборде)
CREATE TABLE public.weather_snapshot (
  id INT PRIMARY KEY CHECK (id = 1),
  city_name TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current JSONB NOT NULL DEFAULT '{}'::jsonb,
  forecast_72h JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_alerts INT NOT NULL DEFAULT 0
);

INSERT INTO public.weather_snapshot (id, city_name) VALUES (1, 'Реутов');

ALTER TABLE public.weather_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read weather_snapshot"
  ON public.weather_snapshot FOR SELECT TO authenticated USING (true);

-- Realtime для виджета и алертов
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_snapshot;
