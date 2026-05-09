
-- USERS / ROLES: только admin
DROP POLICY IF EXISTS "Mayor manages roles" ON public.user_roles;
CREATE POLICY "Admin manages roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- SLA MATRIX DRAFT: только admin
DROP POLICY IF EXISTS "Mayor/Deputy manage sla_matrix_draft" ON public.sla_matrix_draft;
DROP POLICY IF EXISTS "Mayor/Deputy read sla_matrix_draft" ON public.sla_matrix_draft;
CREATE POLICY "Admin manage sla_matrix_draft"
  ON public.sla_matrix_draft FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin read sla_matrix_draft"
  ON public.sla_matrix_draft FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- AUDIT LOG: только admin
DROP POLICY IF EXISTS "Mayor read audit_log" ON public.audit_log;
CREATE POLICY "Admin read audit_log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- FEATURE FLAGS: только admin
DROP POLICY IF EXISTS "Mayor manage feature_flags" ON public.feature_flags;
CREATE POLICY "Admin manage feature_flags"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- DATA SOURCES: добавляем admin
DROP POLICY IF EXISTS "Mayor manage data_sources" ON public.data_sources;
DROP POLICY IF EXISTS "Mayor/Deputy read data_sources" ON public.data_sources;
CREATE POLICY "Admin/Mayor/Deputy manage data_sources"
  ON public.data_sources FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));
CREATE POLICY "Admin/Mayor/Deputy read data_sources"
  ON public.data_sources FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));

-- STAGING RAW: добавляем admin
DROP POLICY IF EXISTS "Mayor manage staging_raw" ON public.staging_raw;
DROP POLICY IF EXISTS "Mayor/Deputy read staging_raw" ON public.staging_raw;
CREATE POLICY "Admin/Mayor/Deputy manage staging_raw"
  ON public.staging_raw FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));
CREATE POLICY "Admin/Mayor/Deputy read staging_raw"
  ON public.staging_raw FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));

-- INGESTION LOG: добавляем admin к insert
DROP POLICY IF EXISTS "Mayor insert ingestion_log" ON public.ingestion_log;
CREATE POLICY "Admin/Mayor/Deputy insert ingestion_log"
  ON public.ingestion_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));

-- TELEGRAM MESSAGES: добавляем admin
DROP POLICY IF EXISTS "Mayor/Deputy read telegram messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Mayor/Deputy update telegram messages" ON public.telegram_messages;
CREATE POLICY "Admin/Mayor/Deputy read telegram messages"
  ON public.telegram_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));
CREATE POLICY "Admin/Mayor/Deputy update telegram messages"
  ON public.telegram_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'mayor'::app_role) OR public.has_role(auth.uid(), 'deputy'::app_role));
