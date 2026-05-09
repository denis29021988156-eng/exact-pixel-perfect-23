-- 1. telegram_messages: restrict SELECT to mayor/deputy
DROP POLICY IF EXISTS "Authenticated read telegram messages" ON public.telegram_messages;
CREATE POLICY "Mayor/Deputy read telegram messages"
ON public.telegram_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 2. staging_raw: restrict SELECT to mayor/deputy
DROP POLICY IF EXISTS "Authenticated read staging_raw" ON public.staging_raw;
CREATE POLICY "Mayor/Deputy read staging_raw"
ON public.staging_raw
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 3. data_sources: restrict SELECT to mayor/deputy (config may contain secrets)
DROP POLICY IF EXISTS "Authenticated read data_sources" ON public.data_sources;
CREATE POLICY "Mayor/Deputy read data_sources"
ON public.data_sources
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- 4. scenario_history: owner-scoped SELECT + mayor/deputy override
DROP POLICY IF EXISTS "Authenticated read scenarios" ON public.scenario_history;
CREATE POLICY "Owner or Mayor/Deputy read scenarios"
ON public.scenario_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'mayor'::app_role)
  OR has_role(auth.uid(), 'deputy'::app_role)
);

-- 5. user_roles: scope "Mayor manages roles" to authenticated only
DROP POLICY IF EXISTS "Mayor manages roles" ON public.user_roles;
CREATE POLICY "Mayor manages roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role))
WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

-- 6. Revoke EXECUTE on SECURITY DEFINER functions from client roles.
--    They remain callable from RLS policies and triggers (definer privileges).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_department(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_deputy_of_department(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_incident_severity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_and_create_escalation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;