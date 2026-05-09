GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_deputy_of_department(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_department(uuid) TO authenticated, anon;