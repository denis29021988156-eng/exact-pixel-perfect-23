-- ============================================================
-- A2: department-scoped RLS for deputy
-- ============================================================

-- ---------- INCIDENTS ----------
DROP POLICY IF EXISTS "Authenticated insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Authenticated read incidents"   ON public.incidents;
DROP POLICY IF EXISTS "Mayor/Deputy update incidents"  ON public.incidents;

CREATE POLICY "Incidents read"
ON public.incidents FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
  OR created_by = auth.uid()
);

CREATE POLICY "Incidents insert own"
ON public.incidents FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Incidents update mayor or deputy of dept"
ON public.incidents FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
)
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

-- ---------- TASKS ----------
DROP POLICY IF EXISTS "Authenticated read tasks"  ON public.tasks;
DROP POLICY IF EXISTS "Mayor/Deputy insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor/Deputy update tasks" ON public.tasks;
-- "Assignee updates own task" intentionally kept

CREATE POLICY "Tasks read"
ON public.tasks FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
  OR assigned_to = auth.uid()
);

CREATE POLICY "Tasks insert mayor or deputy of dept"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

CREATE POLICY "Tasks update mayor or deputy of dept"
ON public.tasks FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
)
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

-- ---------- PROJECTS ----------
DROP POLICY IF EXISTS "Authenticated insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated read projects"   ON public.projects;
DROP POLICY IF EXISTS "Mayor/Deputy update projects"  ON public.projects;

CREATE POLICY "Projects read"
ON public.projects FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
  OR (department IS NOT NULL AND department = public.get_user_department(auth.uid()))
);

CREATE POLICY "Projects insert mayor or deputy of dept"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

CREATE POLICY "Projects update mayor or deputy of dept"
ON public.projects FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
)
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

-- ---------- CONTRACTS ----------
DROP POLICY IF EXISTS "Authenticated insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Mayor/Deputy read contracts"    ON public.contracts;
DROP POLICY IF EXISTS "Mayor/Deputy update contracts"  ON public.contracts;

CREATE POLICY "Contracts read mayor or deputy of dept"
ON public.contracts FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

CREATE POLICY "Contracts insert mayor or deputy of dept"
ON public.contracts FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);

CREATE POLICY "Contracts update mayor or deputy of dept"
ON public.contracts FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
)
WITH CHECK (
  has_role(auth.uid(),'mayor'::app_role)
  OR (department IS NOT NULL AND public.is_deputy_of_department(department))
);