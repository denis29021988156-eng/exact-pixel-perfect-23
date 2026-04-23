
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;

SELECT cron.schedule(
  'weather-check-6h',
  '0 */6 * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://ackkitknwdjntrhwasqm.supabase.co/functions/v1/weather-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFja2tpdGtud2RqbnRyaHdhc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzQ1MzIsImV4cCI6MjA4NzM1MDUzMn0.eFhp4q9mp13K0r95lvjb5JRwCv8jRHr6-mpx8angXOE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
