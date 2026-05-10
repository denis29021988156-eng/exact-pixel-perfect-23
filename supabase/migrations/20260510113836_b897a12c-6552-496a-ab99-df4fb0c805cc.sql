-- Возвращаем EXECUTE на security-definer хелперы, которые используются в RLS-политиках.
-- Без этого RLS падает и пользователи (включая mayor/deputy) видят 0 строк
-- в таблицах incidents, tasks, contracts, projects, escalations и т.д.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_deputy_of_department(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_department(uuid) TO authenticated, anon;