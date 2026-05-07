-- A1.1: CHECK on profiles.department (allowed values)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_department_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_department_check
  CHECK (
    department IS NULL
    OR department IN ('utilities','transport','improvement','social','construction')
  );

-- A1.2: get_user_department(_user_id) -> text
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- A1.3: is_deputy_of_department(_dept) -> boolean
CREATE OR REPLACE FUNCTION public.is_deputy_of_department(_dept text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'deputy'::app_role
      AND p.department IS NOT NULL
      AND p.department = _dept
  )
$$;