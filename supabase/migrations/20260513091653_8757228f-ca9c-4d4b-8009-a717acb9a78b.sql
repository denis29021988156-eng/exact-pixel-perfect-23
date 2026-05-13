REVOKE EXECUTE ON FUNCTION public.refresh_public_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_public_metrics() TO service_role;