
-- Helper function to normalize legacy department values
CREATE OR REPLACE FUNCTION public.normalize_department(_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _raw IS NULL THEN NULL
    WHEN _raw IN ('utilities','transport','improvement','social','construction') THEN _raw
    WHEN _raw ILIKE '%жкх%' OR _raw ILIKE '%энергет%' THEN 'utilities'
    WHEN _raw ILIKE '%транспорт%' OR _raw ILIKE '%дорог%' OR _raw ILIKE '%дорож%' THEN 'transport'
    WHEN _raw ILIKE '%благоустр%' OR _raw ILIKE '%эколог%' THEN 'improvement'
    WHEN _raw ILIKE '%образован%' OR _raw ILIKE '%здравоохран%' OR _raw ILIKE '%спорт%' OR _raw ILIKE '%социальн%' OR _raw ILIKE '%культур%' THEN 'social'
    WHEN _raw ILIKE '%строит%' OR _raw ILIKE '%капремонт%' OR _raw ILIKE '%капитальн%' THEN 'construction'
    ELSE NULL
  END
$$;

-- Normalize existing data
UPDATE public.incidents  SET department = public.normalize_department(department) WHERE department IS NOT NULL;
UPDATE public.tasks      SET department = public.normalize_department(department) WHERE department IS NOT NULL;
UPDATE public.projects   SET department = public.normalize_department(department) WHERE department IS NOT NULL;
UPDATE public.contracts  SET department = public.normalize_department(department) WHERE department IS NOT NULL;
UPDATE public.profiles   SET department = public.normalize_department(department) WHERE department IS NOT NULL;

-- Validation trigger (per instructions: prefer triggers over CHECK)
CREATE OR REPLACE FUNCTION public.validate_department()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.department IS NOT NULL
     AND NEW.department NOT IN ('utilities','transport','improvement','social','construction') THEN
    RAISE EXCEPTION 'Invalid department "%". Allowed: utilities, transport, improvement, social, construction', NEW.department;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_department_trg ON public.incidents;
CREATE TRIGGER validate_department_trg BEFORE INSERT OR UPDATE OF department ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.validate_department();

DROP TRIGGER IF EXISTS validate_department_trg ON public.tasks;
CREATE TRIGGER validate_department_trg BEFORE INSERT OR UPDATE OF department ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_department();

DROP TRIGGER IF EXISTS validate_department_trg ON public.projects;
CREATE TRIGGER validate_department_trg BEFORE INSERT OR UPDATE OF department ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_department();

DROP TRIGGER IF EXISTS validate_department_trg ON public.contracts;
CREATE TRIGGER validate_department_trg BEFORE INSERT OR UPDATE OF department ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.validate_department();

DROP TRIGGER IF EXISTS validate_department_trg ON public.profiles;
CREATE TRIGGER validate_department_trg BEFORE INSERT OR UPDATE OF department ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_department();
