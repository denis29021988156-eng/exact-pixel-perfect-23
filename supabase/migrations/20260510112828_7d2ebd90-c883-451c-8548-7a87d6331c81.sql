
-- 1. incidents_severity_log: restrict reads to mayor/admin/deputy
DROP POLICY IF EXISTS "Authenticated read severity_log" ON public.incidents_severity_log;
CREATE POLICY "Mayor/Admin/Deputy read severity_log"
  ON public.incidents_severity_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 2. ingestion_log: restrict to admin/mayor/deputy
DROP POLICY IF EXISTS "Authenticated read ingestion_log" ON public.ingestion_log;
CREATE POLICY "Admin/Mayor/Deputy read ingestion_log"
  ON public.ingestion_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 3. budget_forecast: restrict to mayor/deputy
DROP POLICY IF EXISTS "Authenticated read budget_forecast" ON public.budget_forecast;
CREATE POLICY "Mayor/Deputy read budget_forecast"
  ON public.budget_forecast FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 4. escalations: restrict to mayor/deputy/admin
DROP POLICY IF EXISTS "Authenticated read escalations" ON public.escalations;
CREATE POLICY "Mayor/Deputy/Admin read escalations"
  ON public.escalations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. sla_matrix_draft: extend to mayor/deputy
CREATE POLICY "Mayor/Deputy read sla_matrix_draft"
  ON public.sla_matrix_draft FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 6. Lock profile.department changes for non-privileged users via trigger
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_department_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.department IS DISTINCT FROM OLD.department
     AND NOT (
       has_role(auth.uid(), 'mayor'::app_role)
       OR has_role(auth.uid(), 'deputy'::app_role)
       OR has_role(auth.uid(), 'admin'::app_role)
     ) THEN
    RAISE EXCEPTION 'Only mayor, deputy, or admin can change the department of a profile';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_department_change ON public.profiles;
CREATE TRIGGER profiles_prevent_department_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_department_change();

-- 7. Drop telegram_messages from realtime publication (sensitive raw data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'telegram_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.telegram_messages';
  END IF;
END $$;

-- 8. Revoke EXECUTE on internal SECURITY DEFINER helpers from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_department(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_deputy_of_department(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_create_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_incident_severity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_unauthorized_department_change() FROM PUBLIC, anon, authenticated;
