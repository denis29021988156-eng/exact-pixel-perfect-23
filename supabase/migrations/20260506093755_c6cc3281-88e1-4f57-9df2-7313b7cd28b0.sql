-- Allow assigned employees to update status of their own tasks
CREATE POLICY "Assignee updates own task"
ON public.tasks
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- Enable realtime for tasks so mayor dashboard reflects status changes live
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Auto-mark overdue when deadline passed and not completed
CREATE OR REPLACE FUNCTION public.tasks_set_overdue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline IS NOT NULL
     AND NEW.deadline < CURRENT_DATE
     AND NEW.status NOT IN ('completed','cancelled') THEN
    NEW.overdue := true;
  ELSE
    NEW.overdue := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_set_overdue ON public.tasks;
CREATE TRIGGER trg_tasks_set_overdue
BEFORE INSERT OR UPDATE OF deadline, status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_set_overdue();