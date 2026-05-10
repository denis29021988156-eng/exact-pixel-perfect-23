
-- 1) Уникальный индекс: одна активная эскалация на источник
CREATE UNIQUE INDEX IF NOT EXISTS escalations_unique_active_source
  ON public.escalations (source_type, source_id)
  WHERE status = 'active';

-- 2) Триггер с явным дедупом (на случай если индекс не сработает / будущие правки)
CREATE OR REPLACE FUNCTION public.check_and_create_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.severity = 'high' AND NEW.sla_overdue = true THEN
    -- не создаём дубль, если уже есть активная эскалация на этот инцидент
    IF NOT EXISTS (
      SELECT 1 FROM public.escalations
      WHERE source_type = 'incident' AND source_id = NEW.id AND status = 'active'
    ) THEN
      INSERT INTO public.escalations (type, severity, source_type, source_id, message, suggested_action)
      VALUES (
        'sla_breach', 5, 'incident', NEW.id,
        'Критический инцидент с нарушением SLA: ' || NEW.title,
        'Требуется немедленное внимание. Проверьте ответственного и сроки.'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
