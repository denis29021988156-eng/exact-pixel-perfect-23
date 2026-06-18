UPDATE public.incidents SET address = regexp_replace(address, 'г\.\s*Реутов,?\s*', '', 'gi') WHERE address ILIKE '%реутов%';
UPDATE public.incidents SET address = regexp_replace(address, '(г\.\s*)?Балаших[аыеу]+,?\s*', '', 'gi') WHERE address ILIKE '%балаших%';
UPDATE public.incidents SET title = regexp_replace(title, '\s*(в|во|г\.?)\s*(Реутове?|Балашихе?)', '', 'gi'), description = regexp_replace(description, '(Реутове?|Балашихе?)', 'городе', 'gi') WHERE title ILIKE '%реутов%' OR title ILIKE '%балаших%' OR description ILIKE '%реутов%' OR description ILIKE '%балаших%';
UPDATE public.weather_snapshot SET city_name = 'Город' WHERE city_name ILIKE '%реутов%' OR city_name ILIKE '%балаших%';
UPDATE public.app_settings SET city_name = 'Город' WHERE city_name ILIKE '%реутов%' OR city_name ILIKE '%балаших%';
ALTER TABLE public.app_settings ALTER COLUMN city_name SET DEFAULT 'Город';
ALTER TABLE public.weather_snapshot ALTER COLUMN city_name SET DEFAULT 'Город';