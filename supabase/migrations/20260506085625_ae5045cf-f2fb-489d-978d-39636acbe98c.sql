-- Fix ai_logs: remove public access
DROP POLICY IF EXISTS "Public read ai_logs" ON public.ai_logs;
CREATE POLICY "Mayor/Deputy read ai_logs"
ON public.ai_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));

-- Fix user_roles: users see own role only; mayor sees all (already covered by Mayor manages roles)
DROP POLICY IF EXISTS "Authenticated read roles" ON public.user_roles;
CREATE POLICY "Users read own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix contracts: restrict to mayor/deputy
DROP POLICY IF EXISTS "Authenticated read contracts" ON public.contracts;
CREATE POLICY "Mayor/Deputy read contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'deputy'::app_role));