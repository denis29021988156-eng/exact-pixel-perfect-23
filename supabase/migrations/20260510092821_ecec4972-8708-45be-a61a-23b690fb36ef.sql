
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_conversations_user_created ON public.ai_conversations (user_id, created_at DESC);
CREATE INDEX idx_ai_conversations_session ON public.ai_conversations (session_id, created_at);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversations" ON public.ai_conversations
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Users insert own conversations" ON public.ai_conversations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own conversations" ON public.ai_conversations
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('decision','preference','context_note')),
  key text NOT NULL,
  value text NOT NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','extracted','system')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, key)
);
CREATE INDEX idx_ai_memory_user ON public.ai_memory (user_id);
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memory" ON public.ai_memory
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "Users insert own memory" ON public.ai_memory
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own memory" ON public.ai_memory
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own memory" ON public.ai_memory
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_ai_memory_updated
  BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
