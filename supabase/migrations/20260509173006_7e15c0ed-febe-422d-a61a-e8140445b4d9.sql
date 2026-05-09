DROP POLICY IF EXISTS "Contracts read mayor or deputy of dept" ON public.contracts;
CREATE POLICY "Contracts read by role and department"
ON public.contracts FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'mayor'::app_role)
  OR (department IS NOT NULL AND is_deputy_of_department(department))
  OR (department IS NOT NULL AND department = get_user_department(auth.uid()))
);

DROP POLICY IF EXISTS "Incidents read" ON public.incidents;
CREATE POLICY "Incidents read"
ON public.incidents FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'mayor'::app_role)
  OR (department IS NOT NULL AND is_deputy_of_department(department))
  OR (department IS NOT NULL AND department = get_user_department(auth.uid()))
  OR created_by = auth.uid()
);