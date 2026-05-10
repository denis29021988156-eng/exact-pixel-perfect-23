CREATE POLICY "Admin reads all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin reads all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Incidents read" ON public.incidents;
CREATE POLICY "Incidents read" ON public.incidents FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'mayor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (department IS NOT NULL AND is_deputy_of_department(department))
  OR (department IS NOT NULL AND department = get_user_department(auth.uid()))
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Tasks read" ON public.tasks;
CREATE POLICY "Tasks read" ON public.tasks FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'mayor'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (department IS NOT NULL AND is_deputy_of_department(department))
  OR assigned_to = auth.uid()
);