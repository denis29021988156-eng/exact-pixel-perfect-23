-- Cleanup Балашиха-related demo data; keep only Реутов signal

-- Incidents: Balashikha references and DEMO duplicates with Носовиха/Балашиха
DELETE FROM public.incidents
WHERE address ILIKE '%балаш%'
   OR description ILIKE '%балаш%'
   OR title ILIKE '%балаш%'
   OR address ILIKE '%носових%'
   OR address ILIKE '%салтыков%'
   OR title ILIKE '%салтыков%'
   OR address ILIKE '%железнодорож%'
   OR address ILIKE '%пехорк%'
   OR title ILIKE '%пехорк%';

-- Projects: Balashikha-Arena
DELETE FROM public.projects
WHERE name ILIKE '%балаш%'
   OR description ILIKE '%балаш%';

-- Public complaints: Balashikha districts
DELETE FROM public.public_complaints
WHERE district ILIKE '%балаш%'
   OR complaint_text ILIKE '%балаш%'
   OR district ILIKE '%железнодорож%'
   OR district ILIKE '%салтыков%'
   OR complaint_text ILIKE '%носових%'
   OR district ILIKE '%носових%'
   OR complaint_text ILIKE '%пехорк%';

-- Reduce remaining DEMO incidents by half (keep newest half)
WITH demo AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn,
         COUNT(*) OVER () AS total
  FROM public.incidents
  WHERE title ILIKE '[DEMO]%'
)
DELETE FROM public.incidents
WHERE id IN (SELECT id FROM demo WHERE rn > GREATEST(total / 2, 1));

-- Reduce non-DEMO incidents by half too (keep newest half)
WITH real AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn,
         COUNT(*) OVER () AS total
  FROM public.incidents
  WHERE title NOT ILIKE '[DEMO]%'
)
DELETE FROM public.incidents
WHERE id IN (SELECT id FROM real WHERE rn > GREATEST(total / 2, 1));