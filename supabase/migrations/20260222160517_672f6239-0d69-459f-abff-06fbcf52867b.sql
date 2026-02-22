
-- Ужесточаем INSERT инцидентов: пользователь должен указать себя как создателя
DROP POLICY "Authenticated insert incidents" ON public.incidents;
CREATE POLICY "Authenticated insert incidents" ON public.incidents 
  FOR INSERT TO authenticated 
  WITH CHECK (created_by = auth.uid());
