-- Tighten INSERT policy on incidents
DROP POLICY IF EXISTS "Incidents insert own" ON public.incidents;

CREATE POLICY "Incidents insert privileged"
ON public.incidents
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'mayor'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (department IS NOT NULL AND is_deputy_of_department(department))
  )
);

CREATE POLICY "Incidents insert employee limited"
ON public.incidents
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND department IS NOT NULL
  AND department = get_user_department(auth.uid())
  AND severity <> 'high'::incident_severity
  AND political_sensitivity <> 'high'
);