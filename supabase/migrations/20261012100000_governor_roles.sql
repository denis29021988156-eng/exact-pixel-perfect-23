-- Планшет губернатора: новые роли.
-- Отдельный файл: новое значение enum нельзя использовать в той же транзакции, где оно добавлено.
alter type public.app_role add value if not exists 'governor';
alter type public.app_role add value if not exists 'team';
