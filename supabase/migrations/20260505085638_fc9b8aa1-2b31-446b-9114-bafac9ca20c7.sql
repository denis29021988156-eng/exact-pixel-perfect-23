UPDATE public.incidents SET lat = 55.7589, lng = 37.8567 WHERE title = 'Прорыв теплотрассы на ул. Ленина' AND lat > 55.78;
UPDATE public.incidents SET lat = 55.7634, lng = 37.8589 WHERE title = 'Отключение отопления школа №14' AND lat > 55.78;
UPDATE public.incidents SET lat = 55.7672, lng = 37.8612 WHERE title = 'Утечка водопровода пер. Мира' AND lat > 55.78;
UPDATE public.incidents SET lat = 55.7556, lng = 37.8689 WHERE title = 'Провал дорожного покрытия пр. Победы' AND lat > 55.78;
UPDATE public.incidents SET lat = 55.7712, lng = 37.8523 WHERE title = 'Обрыв ЛЭП район Северный' AND lat > 55.78;
UPDATE public.incidents SET lat = 55.7613, lng = 37.8617
WHERE lat IS NOT NULL
  AND (lat NOT BETWEEN 55.747 AND 55.782 OR lng NOT BETWEEN 37.842 AND 37.890);