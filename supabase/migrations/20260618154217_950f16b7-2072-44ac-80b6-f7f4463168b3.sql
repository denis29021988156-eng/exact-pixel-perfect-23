
-- =========================================================
-- TRIGGER 1: contract risk escalation
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_contract_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.risk_of_non_execution IS NOT NULL AND NEW.risk_of_non_execution > 70 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.escalations
      WHERE source_type = 'contract' AND source_id = NEW.id AND status = 'active'
    ) THEN
      INSERT INTO public.escalations (type, severity, source_type, source_id, message, suggested_action)
      VALUES (
        'contract_risk',
        4,
        'contract',
        NEW.id,
        'Контракт с высоким риском неисполнения (' || round(NEW.risk_of_non_execution) || '%): ' || NEW.name,
        'Проверьте исполнителя и график. Рассмотрите меры по контракту.'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.check_contract_escalation() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS escalation_check_on_contract ON public.contracts;
CREATE TRIGGER escalation_check_on_contract
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contract_escalation();

-- =========================================================
-- TRIGGER 2 (aggregate): complaint surge detection
-- =========================================================
CREATE OR REPLACE FUNCTION public.detect_complaint_surge()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    WITH last_24h AS (
      SELECT topic, count(*)::int AS cnt_24h
      FROM public.public_complaints
      WHERE created_at >= now() - interval '24 hours'
      GROUP BY topic
    ),
    prev_7d AS (
      SELECT topic, (count(*)::numeric / 7.0) AS avg_prev
      FROM public.public_complaints
      WHERE created_at >= now() - interval '8 days'
        AND created_at <  now() - interval '24 hours'
      GROUP BY topic
    )
    SELECT
      l.topic,
      l.cnt_24h,
      COALESCE(p.avg_prev, 0) AS avg_prev
    FROM last_24h l
    LEFT JOIN prev_7d p USING (topic)
    WHERE l.cnt_24h >= 5
      AND l.cnt_24h > COALESCE(p.avg_prev, 0) * 3
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.escalations
      WHERE source_type = 'complaint_surge'
        AND status = 'active'
        AND message ILIKE '%' || r.topic || '%'
    ) THEN
      INSERT INTO public.escalations (type, severity, source_type, source_id, message, suggested_action)
      VALUES (
        'complaint_surge',
        3,
        'complaint_surge',
        NULL,
        'Аномальный рост обращений по теме «' || r.topic || '»: ' || r.cnt_24h
          || ' за 24ч (норма ~' || round(r.avg_prev, 1) || '/сутки)',
        'Проверьте причину роста обращений по теме. Возможна системная проблема.'
      );
    END IF;
  END LOOP;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.detect_complaint_surge() FROM anon, authenticated, public;

-- =========================================================
-- CRON: run surge detection every 2 hours (idempotent)
-- =========================================================
DO $$
BEGIN
  PERFORM cron.unschedule('detect-complaint-surge')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'detect-complaint-surge');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'detect-complaint-surge',
  '0 */2 * * *',
  'SELECT public.detect_complaint_surge();'
);
