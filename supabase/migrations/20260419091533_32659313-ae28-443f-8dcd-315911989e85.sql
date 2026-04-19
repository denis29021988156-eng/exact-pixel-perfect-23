-- Telegram polling state (singleton)
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mayor/Deputy read bot state"
ON public.telegram_bot_state FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Telegram messages
CREATE TABLE public.telegram_messages (
  update_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  chat_title TEXT,
  from_username TEXT,
  text TEXT,
  raw_update JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  staging_raw_id UUID REFERENCES public.staging_raw(id) ON DELETE SET NULL,
  extracted_payload JSONB,
  confidence NUMERIC NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages (chat_id);
CREATE INDEX idx_telegram_messages_created_at ON public.telegram_messages (created_at DESC);
CREATE INDEX idx_telegram_messages_processed ON public.telegram_messages (processed) WHERE processed = false;

ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read telegram messages"
ON public.telegram_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Mayor/Deputy update telegram messages"
ON public.telegram_messages FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_messages;
ALTER TABLE public.telegram_messages REPLICA IDENTITY FULL;

-- Register Telegram as a data source
INSERT INTO public.data_sources (name, type, status, reliability, latency_minutes, success_rate, config)
VALUES ('Telegram — городской чат', 'telegram', 'active', 60, 1, 100, '{"description": "Жалобы и сообщения из Telegram-чата"}'::jsonb)
ON CONFLICT DO NOTHING;