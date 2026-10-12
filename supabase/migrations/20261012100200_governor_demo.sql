-- Планшет губернатора: демо-данные Тверской области.
-- Места настоящие, события и цифры придуманы. Имён реальных людей нет.
-- Все даты считаются от сегодняшнего дня, поэтому демо всегда выглядит свежим.
-- В демо-режиме данные пересобираются каждую ночь (03:30 по Москве).

create or replace function public._demo_bump(_k int, _c int, _a double precision, _w double precision)
returns double precision
language sql
immutable
as $$
  select _a * exp(greatest(-60, -((_k - _c) ^ 2) / (2 * _w ^ 2)));
$$;

-- Провал после события: только с дня события и дальше.
-- Показатель экспоненты ограничен, иначе exp() даёт ошибку переполнения снизу.
create or replace function public._demo_after(_k int, _c int, _a double precision, _w double precision)
returns double precision
language sql
immutable
as $$
  select case when _k >= _c then _a * exp(greatest(-60, -((_k - _c) ^ 2) / (2 * _w ^ 2))) else 0 end;
$$;

-- Устойчивый эффект: после события показатель остаётся выше.
create or replace function public._demo_step(_k int, _c int, _a double precision)
returns double precision
language sql
immutable
as $$
  select _a / (1 + exp(least(60, greatest(-60, -(_k - _c)))));
$$;

create or replace function public._demo_num(_v numeric, _signed boolean default false)
returns text
language sql
immutable
as $$
  select case when _signed and _v > 0 then '+' when _v < 0 then '−' else '' end
         || replace(to_char(abs(_v), 'FM990.0'), '.', ',');
$$;

create or replace function public._demo_seed()
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  d date := public.msk_today();
  -- Авария в Удомле случилась ночью: около 02:40 по Москве, но не позже чем час назад.
  night timestamptz := least(now() - interval '1 hour', (public.msk_today() + time '02:40') at time zone 'Europe/Moscow');
  m_tver uuid; m_udomlya uuid; m_rzhev uuid; m_kimry uuid; m_konakovo uuid; m_vvol uuid; m_torzhok uuid;
  m_bezheck uuid; m_ostashkov uuid; m_kalinin uuid; m_staritsa uuid; m_likhoslavl uuid; m_kashin uuid; m_nelidovo uuid;
  e_zhkh uuid; e_trans uuid; e_health uuid; e_edu uuid; e_build uuid; e_social uuid; e_eco uuid; e_info uuid;
  e_heritage uuid; e_tver uuid; e_udomlya uuid; e_rzhev uuid; e_vvol uuid; e_konakovo uuid; e_kimry uuid; e_kashin uuid;
  s1 uuid := gen_random_uuid(); s2 uuid := gen_random_uuid(); s3 uuid := gen_random_uuid(); s4 uuid := gen_random_uuid();
  s5 uuid := gen_random_uuid(); s6 uuid := gen_random_uuid(); s7 uuid := gen_random_uuid(); s8 uuid := gen_random_uuid();
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid(); p4 uuid := gen_random_uuid();
  p5 uuid := gen_random_uuid();
  i1 uuid := gen_random_uuid(); i2 uuid := gen_random_uuid(); i3 uuid := gen_random_uuid(); i4 uuid := gen_random_uuid();
  i5 uuid := gen_random_uuid(); i6 uuid := gen_random_uuid(); i7 uuid := gen_random_uuid(); i8 uuid := gen_random_uuid();
  i9 uuid := gen_random_uuid(); i10 uuid := gen_random_uuid(); i11 uuid := gen_random_uuid(); i12 uuid := gen_random_uuid();
  i13 uuid := gen_random_uuid(); i14 uuid := gen_random_uuid();
  k int;
  x double precision;
  v_tone double precision; v_appeals double precision; v_speed double precision; v_survey double precision;
  v_value numeric;
  v_today numeric; v_yday numeric; v_week numeric;
begin
  if not coalesce((select demo_mode from public.app_settings where id = 1), false) then
    raise exception 'Демо-режим выключен: пересборка данных запрещена' using errcode = 'P0001';
  end if;

  -- Чистим всё, кроме справочника округов.
  delete from public.instruction_events;
  update public.signals set instruction_id = null;
  delete from public.instructions;
  delete from public.signals;
  delete from public.promises;
  delete from public.agenda_items;
  delete from public.trust_index;
  delete from public.daily_briefs;
  delete from public.executors;
  delete from public.ask_log;
  delete from public.ai_calls where at < now() - interval '1 day';

  insert into public.municipalities (name, center, sort) values
    ('Тверь', 'Тверь', 1),
    ('Андреапольский округ', 'Андреаполь', 10), ('Бежецкий округ', 'Бежецк', 10), ('Бельский округ', 'Белый', 10),
    ('Бологовский округ', 'Бологое', 10), ('Весьегонский округ', 'Весьегонск', 10), ('Вышневолоцкий округ', 'Вышний Волочёк', 10),
    ('Жарковский округ', 'Жарковский', 10), ('Западнодвинский округ', 'Западная Двина', 10), ('Зубцовский округ', 'Зубцов', 10),
    ('Калининский округ', 'Тверь', 10), ('Калязинский округ', 'Калязин', 10), ('Кашинский округ', 'Кашин', 10),
    ('Кесовогорский округ', 'Кесова Гора', 10), ('Кимрский округ', 'Кимры', 10), ('Конаковский округ', 'Конаково', 10),
    ('Краснохолмский округ', 'Красный Холм', 10), ('Кувшиновский округ', 'Кувшиново', 10), ('Лесной округ', 'Лесное', 10),
    ('Лихославльский округ', 'Лихославль', 10), ('Максатихинский округ', 'Максатиха', 10), ('Молоковский округ', 'Молоково', 10),
    ('Нелидовский округ', 'Нелидово', 10), ('Оленинский округ', 'Оленино', 10), ('Осташковский округ', 'Осташков', 10),
    ('Пеновский округ', 'Пено', 10), ('Рамешковский округ', 'Рамешки', 10), ('Ржевский округ', 'Ржев', 10),
    ('Сандовский округ', 'Сандово', 10), ('Селижаровский округ', 'Селижарово', 10), ('Сонковский округ', 'Сонково', 10),
    ('Спировский округ', 'Спирово', 10), ('Старицкий округ', 'Старица', 10), ('Торжок', 'Торжок', 10),
    ('Торопецкий округ', 'Торопец', 10), ('Удомельский округ', 'Удомля', 10), ('Фировский округ', 'Фирово', 10),
    ('ЗАТО Озёрный', 'Озёрный', 20), ('ЗАТО Солнечный', 'Солнечный', 20)
  on conflict (name) do nothing;

  select id into m_tver from public.municipalities where name = 'Тверь';
  select id into m_udomlya from public.municipalities where name = 'Удомельский округ';
  select id into m_rzhev from public.municipalities where name = 'Ржевский округ';
  select id into m_kimry from public.municipalities where name = 'Кимрский округ';
  select id into m_konakovo from public.municipalities where name = 'Конаковский округ';
  select id into m_vvol from public.municipalities where name = 'Вышневолоцкий округ';
  select id into m_torzhok from public.municipalities where name = 'Торжок';
  select id into m_bezheck from public.municipalities where name = 'Бежецкий округ';
  select id into m_ostashkov from public.municipalities where name = 'Осташковский округ';
  select id into m_kalinin from public.municipalities where name = 'Калининский округ';
  select id into m_staritsa from public.municipalities where name = 'Старицкий округ';
  select id into m_likhoslavl from public.municipalities where name = 'Лихославльский округ';
  select id into m_kashin from public.municipalities where name = 'Кашинский округ';
  select id into m_nelidovo from public.municipalities where name = 'Нелидовский округ';

  -- Исполнители: ведомства и главы округов (должности, без имён).
  insert into public.executors (name, short_name, kind) values ('Министерство ЖКХ и энергетики', 'ЖКХ и энергетика', 'ministry') returning id into e_zhkh;
  insert into public.executors (name, short_name, kind) values ('Министерство транспорта', 'Транспорт', 'ministry') returning id into e_trans;
  insert into public.executors (name, short_name, kind) values ('Министерство здравоохранения', 'Здравоохранение', 'ministry') returning id into e_health;
  insert into public.executors (name, short_name, kind) values ('Министерство образования', 'Образование', 'ministry') returning id into e_edu;
  insert into public.executors (name, short_name, kind) values ('Министерство строительства', 'Строительство', 'ministry') returning id into e_build;
  insert into public.executors (name, short_name, kind) values ('Министерство социальной защиты', 'Соцзащита', 'ministry') returning id into e_social;
  insert into public.executors (name, short_name, kind) values ('Министерство природных ресурсов и экологии', 'Экология', 'ministry') returning id into e_eco;
  insert into public.executors (name, short_name, kind) values ('Управление информационной политики', 'Информполитика', 'service') returning id into e_info;
  insert into public.executors (name, short_name, kind) values ('Управление охраны объектов культурного наследия', 'Культурное наследие', 'service') returning id into e_heritage;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Администрация Твери', 'Администрация Твери', 'municipality', m_tver) returning id into e_tver;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Глава Удомельского округа', 'Глава Удомельского округа', 'municipality', m_udomlya) returning id into e_udomlya;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Глава Ржевского округа', 'Глава Ржевского округа', 'municipality', m_rzhev) returning id into e_rzhev;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Глава Вышневолоцкого округа', 'Глава Вышневолоцкого округа', 'municipality', m_vvol) returning id into e_vvol;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Глава Конаковского округа', 'Глава Конаковского округа', 'municipality', m_konakovo) returning id into e_konakovo;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Глава Кимрского округа', 'Глава Кимрского округа', 'municipality', m_kimry) returning id into e_kimry;
  insert into public.executors (name, short_name, kind, municipality_id) values ('Глава Кашинского округа', 'Глава Кашинского округа', 'municipality', m_kashin) returning id into e_kashin;

  -- Обещания губернатора с прямых линий и выездов.
  insert into public.promises (id, said_on, occasion, text, municipality_id, due_date) values
    (p1, d - 40, 'Прямая линия', 'Подключить к газу 40 домов в Бежецке до конца года', m_bezheck, make_date(extract(year from d - 40)::int, 12, 31)),
    (p2, d - 36, 'Выезд в Ржев', 'Открыть школу № 3 после ремонта кровли', m_rzhev, d + 19),
    (p3, d - 30, 'Встреча с жителями Кимр', 'Решить вопрос с очередями в поликлинике', m_kimry, null),
    (p4, d - 26, 'Прямая линия', 'Наладить вывоз мусора в Калининском округе', m_kalinin, d - 5),
    (p5, d - 14, 'Выезд в Вышний Волочёк', 'Отремонтировать дорогу к районной больнице до заморозков', m_vvol, d + 18);

  -- Сигналы: что ИИ собрал из ЕДДС, ЦУР, соцсетей, СМИ и контроля поручений.
  insert into public.signals (id, kind, severity, title, summary, municipality_id, source, mentions, detected_at,
                              ai_cause, ai_forecast, ai_recommendation, suggested_title, suggested_executor_id, suggested_due,
                              status, created_at, updated_at) values
    (s1, 'incident', 'critical',
     'Удомля: три дома без отопления после аварии на теплосети',
     'Ночью на участке теплосети произошла авария. Без тепла три многоквартирных дома, около 410 жителей, и детский сад. Бригада работает, срок восстановления пока не назван.',
     m_udomlya, 'ЕДДС и ЦУР', 46, night,
     'Изношенный участок сети: в прошлом году на нём было две аварии, капремонт перенесли на 2027 год.',
     'Если до вечера не назвать срок, жалобы уйдут в федеральные каналы, а детский сад завтра придётся закрыть.',
     'Поручить министерству ЖКХ назвать срок восстановления до 12:00, обогреть детский сад и сообщить жителям план работ.',
     'Восстановить отопление в трёх домах Удомли и сообщить жителям срок',
     e_zhkh, d + 1, 'new', night, night),
    (s2, 'negative', 'high',
     'Тверь: втрое больше жалоб на вывоз мусора в Заволжском районе',
     'За сутки 128 сообщений в соцсетях и ЦУР при обычных 40. Жители пишут о переполненных площадках во дворах.',
     m_tver, 'Соцсети и ЦУР', 128, now() - interval '11 hours',
     'Регоператор сменил график после ремонта техники и не предупредил жителей.',
     'К выходным тема станет главной в городских пабликах.',
     'Поручить администрации Твери вместе с регоператором вернуть прежний график и сегодня же опубликовать его.',
     'Вернуть график вывоза мусора в Заволжском районе и сообщить его жителям',
     e_tver, d + 2, 'new', now() - interval '11 hours', now() - interval '11 hours'),
    (s3, 'deadline', 'high',
     'Ржев: ремонт школы № 3 отстаёт от графика на 12 дней',
     'Поручение по ремонту кровли просрочено. Открыть школу после ремонта обещали на выезде в Ржев, родители уже спрашивают в школьном чате.',
     m_rzhev, 'Контроль поручений', 19, now() - interval '1 day',
     'Подрядчик вовремя не получил окна, аванс задержали на девять дней.',
     'Открытие школы сорвётся, а это обещание с выезда в Ржев.',
     'Вызвать министерство образования на доклад и публично назвать новую дату открытия.',
     'Доложить о новом сроке ремонта школы № 3 в Ржеве и сообщить его родителям',
     e_edu, d + 2, 'new', now() - interval '1 day', now() - interval '1 day'),
    (s4, 'complaints', 'medium',
     'Кимры: очередь к терапевту до 14 дней',
     '37 обращений за неделю на платформе обратной связи, вдвое больше обычного.',
     m_kimry, 'Платформа обратной связи', 37, now() - interval '28 hours',
     'Два терапевта в отпуске, замену не организовали.',
     'Через одну-две недели пойдут жалобы в прокуратуру и вопросы на прямой линии.',
     'Поручить министерству здравоохранения организовать выездной приём врачей из Твери на две недели.',
     'Организовать выездной приём терапевтов в Кимрах на две недели',
     e_health, d + 5, 'new', now() - interval '28 hours', now() - interval '28 hours'),
    (s5, 'media', 'medium',
     'Торжок: федеральное издание пишет о разрушении исторического здания',
     'Публикацию перепечатали 12 ресурсов. Тон негативный, власти упрекают в бездействии.',
     m_torzhok, 'СМИ', 12, now() - interval '6 hours',
     'Здание принадлежит частному владельцу, предписания по сохранению не выполнены.',
     'Тему подхватят региональные СМИ, возможен вопрос на ближайшей прямой линии.',
     'Подготовить комментарий о мерах к владельцу и план консервации здания.',
     'Подготовить комментарий и план консервации здания в Торжке',
     e_heritage, d + 2, 'watch', now() - interval '6 hours', now() - interval '5 hours'),
    (s6, 'incident', 'high',
     'Вышний Волочёк: подтопление подвалов в шести домах',
     'После ливней вода стоит в подвалах, жители жалуются на запах и сырость.',
     m_vvol, 'ЕДДС', 23, now() - interval '2 days',
     'Ливнёвку не чистили два сезона.',
     'Без откачки появится плесень, под угрозой электрощитовые.',
     'Поручить главе округа откачать воду и прочистить ливнёвку.',
     'Откачать воду из подвалов и прочистить ливнёвку в Вышнем Волочке',
     e_vvol, d + 2, 'assigned', now() - interval '2 days', now() - interval '2 days'),
    (s7, 'negative', 'medium',
     'Конаково: школьные автобусы опаздывают из-за ремонта дороги',
     'Родители жалуются, что дети уже неделю опаздывают к первому уроку.',
     m_konakovo, 'Соцсети', 31, now() - interval '26 hours',
     'Объезд на время ремонта удлинил маршрут на 20 минут, а расписание не поменяли.',
     'Недовольство перейдёт с подрядчика на власти округа.',
     'Поручить министерству образования сдвинуть расписание автобусов на время ремонта.',
     'Сдвинуть расписание школьных автобусов в Конаково на время ремонта',
     e_edu, d + 3, 'assigned', now() - interval '26 hours', now() - interval '1 day'),
    (s8, 'incident', 'high',
     'Бежецк: перебои с водой в центре города',
     'Без воды больше суток оставались 14 домов и поликлиника.',
     m_bezheck, 'ЦУР', 64, now() - interval '9 days',
     'Порыв на водоводе 1970-х годов.',
     'Рост жалоб и вопросы к главе округа.',
     'Поручить министерству ЖКХ восстановить водоснабжение и подвезти воду.',
     'Восстановить водоснабжение в центре Бежецка',
     e_zhkh, d - 8, 'resolved', now() - interval '9 days', now() - interval '7 days');

  -- Поручения: просроченные, в работе и выполненные с результатом.
  insert into public.instructions (id, title, details, executor_id, municipality_id, due_date, status, source, signal_id, promise_id,
                                   effect, effect_positive, reminders, last_reminded_at, postponed, done_at, created_at, updated_at) values
    (i1, 'Восстановить освещение на трассе Тверь — Лихославль', 'Тёмный участок 6 км, после ДТП жители просили фонари.',
     e_trans, m_likhoslavl, d - 6, 'in_progress', 'manual', null, null, null, null,
     1, ((d - 2)::timestamp + interval '10 hours') at time zone 'Europe/Moscow', 0, null,
     ((d - 20)::timestamp + interval '11 hours') at time zone 'Europe/Moscow', now() - interval '2 days'),
    (i2, 'Утвердить график газификации 40 домов в Бежецке', 'Обещание с прямой линии: подключить дома до конца года.',
     e_zhkh, m_bezheck, d - 3, 'in_progress', 'promise', null, p1, null, null,
     0, null, 0, null,
     ((d - 38)::timestamp + interval '16 hours') at time zone 'Europe/Moscow', now() - interval '5 days'),
    (i3, 'Завершить ремонт кровли школы № 3 в Ржеве', 'Обещание с выезда в Ржев: открыть школу после ремонта кровли.',
     e_edu, m_rzhev, d - 12, 'in_progress', 'promise', null, p2, null, null,
     2, ((d - 3)::timestamp + interval '9 hours') at time zone 'Europe/Moscow', 1, null,
     ((d - 35)::timestamp + interval '15 hours') at time zone 'Europe/Moscow', now() - interval '3 days'),
    (i4, 'Откачать воду из подвалов и прочистить ливнёвку в Вышнем Волочке', 'Поручить главе округа откачать воду и прочистить ливнёвку.',
     e_vvol, m_vvol, d + 2, 'in_progress', 'signal', s6, null, null, null,
     0, null, 0, null, now() - interval '2 days', now() - interval '1 day'),
    (i5, 'Сдвинуть расписание школьных автобусов в Конаково на время ремонта', 'Поручить министерству образования сдвинуть расписание автобусов на время ремонта.',
     e_edu, m_konakovo, d + 3, 'new', 'signal', s7, null, null, null,
     0, null, 0, null, now() - interval '1 day', now() - interval '1 day'),
    (i6, 'Подготовить проект ремонта поликлиники в Осташкове', null,
     e_health, m_ostashkov, d + 14, 'in_progress', 'manual', null, null, null, null,
     0, null, 0, null, ((d - 10)::timestamp + interval '12 hours') at time zone 'Europe/Moscow', now() - interval '4 days'),
    (i7, 'Принять отремонтированный мост в Старице', 'Открытие моста стоит в повестке на этой неделе.',
     e_trans, m_staritsa, d + 3, 'in_progress', 'manual', null, null, null, null,
     0, null, 0, null, ((d - 25)::timestamp + interval '12 hours') at time zone 'Europe/Moscow', now() - interval '1 day'),
    (i8, 'Наладить вывоз мусора в Калининском округе', 'Обещание с прямой линии.',
     e_eco, m_kalinin, d - 5, 'done', 'promise', null, p4,
     'Жалобы на вывоз мусора −58% за неделю', true,
     0, null, 0, ((d - 6)::timestamp + interval '17 hours') at time zone 'Europe/Moscow',
     ((d - 24)::timestamp + interval '12 hours') at time zone 'Europe/Moscow', ((d - 6)::timestamp + interval '17 hours') at time zone 'Europe/Moscow'),
    (i9, 'Восстановить водоснабжение в центре Бежецка', 'Поручить министерству ЖКХ восстановить водоснабжение и подвезти воду.',
     e_zhkh, m_bezheck, d - 8, 'done', 'signal', s8, null,
     'Обращения по воде −81%, индекс доверия в округе +0,9', true,
     1, ((d - 8)::timestamp + interval '18 hours') at time zone 'Europe/Moscow', 0, ((d - 7)::timestamp + interval '14 hours') at time zone 'Europe/Moscow',
     ((d - 9)::timestamp + interval '9 hours') at time zone 'Europe/Moscow', ((d - 7)::timestamp + interval '14 hours') at time zone 'Europe/Moscow'),
    (i10, 'Отремонтировать освещение в городском парке Кашина', null,
     e_kashin, m_kashin, d - 4, 'done', 'manual', null, null,
     'Пост о ремонте: 1 200 просмотров, 94% положительных реакций', true,
     0, null, 0, ((d - 5)::timestamp + interval '16 hours') at time zone 'Europe/Moscow',
     ((d - 15)::timestamp + interval '11 hours') at time zone 'Europe/Moscow', ((d - 5)::timestamp + interval '16 hours') at time zone 'Europe/Moscow'),
    (i11, 'Ответить жителям Нелидово по тарифам на тепло', null,
     e_zhkh, m_nelidovo, d - 10, 'done', 'manual', null, null,
     'Ответ вышел на два дня позже, жалобы не снизились', false,
     1, ((d - 10)::timestamp + interval '12 hours') at time zone 'Europe/Moscow', 0, ((d - 8)::timestamp + interval '18 hours') at time zone 'Europe/Moscow',
     ((d - 16)::timestamp + interval '10 hours') at time zone 'Europe/Moscow', ((d - 8)::timestamp + interval '18 hours') at time zone 'Europe/Moscow'),
    (i12, 'Отремонтировать дорогу к районной больнице в Вышнем Волочке', 'Обещание с выезда: успеть до заморозков.',
     e_trans, m_vvol, d + 18, 'in_progress', 'promise', null, p5, null, null,
     0, null, 0, null, ((d - 13)::timestamp + interval '15 hours') at time zone 'Europe/Moscow', now() - interval '6 days'),
    (i13, 'Запустить отопление во всех социальных объектах Твери', null,
     e_zhkh, m_tver, d - 14, 'done', 'manual', null, null,
     'Все 214 соцобъектов с теплом к началу сезона', true,
     0, null, 0, ((d - 15)::timestamp + interval '18 hours') at time zone 'Europe/Moscow',
     ((d - 28)::timestamp + interval '10 hours') at time zone 'Europe/Moscow', ((d - 15)::timestamp + interval '18 hours') at time zone 'Europe/Moscow'),
    (i14, 'Обновить разметку у школ после ремонта дорог', null,
     e_trans, m_tver, d - 11, 'done', 'manual', null, null,
     'Жалоб на разметку у школ не поступало', true,
     0, null, 0, ((d - 12)::timestamp + interval '15 hours') at time zone 'Europe/Moscow',
     ((d - 26)::timestamp + interval '10 hours') at time zone 'Europe/Moscow', ((d - 12)::timestamp + interval '15 hours') at time zone 'Europe/Moscow');

  update public.signals set instruction_id = i4 where id = s6;
  update public.signals set instruction_id = i5 where id = s7;
  update public.signals set instruction_id = i9 where id = s8;

  insert into public.instruction_events (instruction_id, at, kind, note)
  select id, created_at, 'created',
         case source
           when 'signal' then 'Поручено по сигналу'
           when 'promise' then 'Поручено по обещанию'
           else 'Поручено на совещании'
         end
  from public.instructions;

  insert into public.instruction_events (instruction_id, at, kind, note) values
    (i1, ((d - 2)::timestamp + interval '10 hours') at time zone 'Europe/Moscow', 'reminded', 'Напоминание исполнителю'),
    (i3, ((d - 20)::timestamp + interval '11 hours') at time zone 'Europe/Moscow', 'postponed',
         'Срок перенесён с ' || to_char(d - 19, 'DD.MM') || ' на ' || to_char(d - 12, 'DD.MM') || '. Подрядчик не получил окна'),
    (i3, ((d - 8)::timestamp + interval '9 hours') at time zone 'Europe/Moscow', 'reminded', 'Напоминание исполнителю'),
    (i3, ((d - 3)::timestamp + interval '9 hours') at time zone 'Europe/Moscow', 'reminded', 'Напоминание исполнителю'),
    (i4, now() - interval '1 day', 'status', 'Взято в работу'),
    (i8, ((d - 6)::timestamp + interval '17 hours') at time zone 'Europe/Moscow', 'status', 'Выполнено: жалобы на вывоз мусора −58% за неделю'),
    (i9, ((d - 8)::timestamp + interval '18 hours') at time zone 'Europe/Moscow', 'reminded', 'Напоминание исполнителю'),
    (i9, ((d - 7)::timestamp + interval '14 hours') at time zone 'Europe/Moscow', 'status', 'Выполнено: обращения по воде −81%'),
    (i10, ((d - 5)::timestamp + interval '16 hours') at time zone 'Europe/Moscow', 'status', 'Выполнено'),
    (i11, ((d - 10)::timestamp + interval '12 hours') at time zone 'Europe/Moscow', 'reminded', 'Напоминание исполнителю'),
    (i11, ((d - 8)::timestamp + interval '18 hours') at time zone 'Europe/Moscow', 'status', 'Выполнено с опозданием'),
    (i13, ((d - 15)::timestamp + interval '18 hours') at time zone 'Europe/Moscow', 'status', 'Выполнено'),
    (i14, ((d - 12)::timestamp + interval '15 hours') at time zone 'Europe/Moscow', 'status', 'Выполнено');

  -- Повестка: два прошедших пункта и две недели вперёд от сегодняшнего дня.
  insert into public.agenda_items (day, channel, title, description, municipality_id, expected_effect, status) values
    (d - 5, 'pr', 'Видео о том, как в Бежецке вернули воду',
     'Как бригады работали двое суток, слова жителей.', m_bezheck,
     'Закрыть тему с благодарностью бригадам', 'done'),
    (d - 2, 'gr', 'Совещание с газовой компанией о графике газификации Бежецка',
     'Сроки подключения 40 домов, обещанных на прямой линии.', m_bezheck,
     'Удержать обещание прямой линии', 'done'),
    (d, 'media', 'Интервью региональному телевидению о подготовке к зиме',
     'Отопление, дороги и снег: что сделано и что впереди.', null,
     'Ответить на главные вопросы по отоплению до холодов', 'approved'),
    (d + 1, 'pr', 'Старт рубрики «Округ за неделю» в соцсетях',
     'Короткие видео о сделанном в округах. Первый выпуск — Удомля.', m_udomlya,
     'Регулярный позитивный повод из округов', 'proposed'),
    (d + 2, 'gr', 'Встреча с пригородным перевозчиком о расписании электричек Тверь — Москва',
     'Жители просят сохранить утренние рейсы.', null,
     'Снять вопрос о сокращении рейсов до публикаций', 'proposed'),
    (d + 3, 'event', 'Открытие отремонтированного моста в Старице',
     'Мост закрывали на ремонт на четыре месяца.', m_staritsa,
     'Позитивный повод для округа', 'approved'),
    (d + 4, 'media', 'Комментарий о здании в Торжке: меры к владельцу и план консервации',
     'Ответ на публикацию федерального издания.', m_torzhok,
     'Закрыть тему до вопросов на прямой линии', 'proposed'),
    (d + 5, 'event', 'Выезд в Удомлю: встреча с жителями после аварии на теплосети',
     'Показать, что проблема на личном контроле.', m_udomlya,
     'Снизить напряжение в округе', 'proposed'),
    (d + 7, 'pr', 'Отчёт об обещаниях прямой линии: что сделано за месяц',
     'Короткий ролик и карточки по каждому обещанию.', null,
     'Показать выполненные обещания', 'proposed'),
    (d + 8, 'gr', 'Совещание с главами округов о готовности к зиме',
     'Отопление, запас топлива, снегоуборочная техника.', null,
     'Единая картина по всем округам', 'approved'),
    (d + 9, 'event', 'Выезд в Кимры: поликлиника и очереди к врачам',
     'Встреча с врачами и жителями.', m_kimry,
     'Ответ на обещание с встречи в Кимрах', 'proposed');

  insert into public.comms_settings (id, tone, avoid, updated_at) values (1,
    '["Спокойно и по делу: сначала факт, потом действие", "Всегда с цифрой и сроком: «до пятницы», «410 жителей»", "Признаём проблему раньше, чем о ней напишут", "Говорим «сделаем», только когда есть поручение и срок"]'::jsonb,
    '["Обещания без сроков", "Канцелярит вроде «в рамках реализации мероприятий»", "Оправдания вместо плана"]'::jsonb,
    now())
  on conflict (id) do update set tone = excluded.tone, avoid = excluded.avoid, updated_at = now();

  -- Индекс доверия за 120 дней: тон СМИ и соцсетей, решённые обращения, скорость ответа, опросы.
  for k in 0..119 loop
    x := k / 119.0;
    v_tone := 55 + 4 * x + 1.0 * sin(k * 0.55) + 0.45 * sin(k * 1.7)
              + public._demo_step(k, 14, 0.8) + public._demo_step(k, 47, 1.0) + public._demo_step(k, 79, 1.2)
              + public._demo_step(k, 94, 0.6) + public._demo_step(k, 113, 0.8)
              + public._demo_bump(k, 31, -3.0, 3) + public._demo_bump(k, 63, -2.4, 3)
              + public._demo_after(k, 110, -2.6, 2) + public._demo_after(k, 119, -1.6, 1)
              + public._demo_bump(k, 14, 1.2, 2) + public._demo_bump(k, 79, 1.5, 3) + public._demo_bump(k, 105, 0.8, 2);
    v_appeals := 66 + 3 * x + 0.6 * sin(k * 0.33 + 1) + public._demo_step(k, 113, 2.0)
                 + public._demo_after(k, 110, -3.0, 2) + public._demo_bump(k, 31, -2.0, 3) + public._demo_bump(k, 79, 1.0, 4);
    v_speed := 58 + 5 * x + 0.5 * sin(k * 0.41 + 2);
    v_survey := 40 + 3 * x + 0.3 * sin(k * 0.2) + public._demo_step(k, 79, 1.5);
    v_value := round((0.35 * v_tone + 0.25 * v_appeals + 0.2 * v_speed + 0.2 * v_survey)::numeric, 1);
    insert into public.trust_index (day, value, media_tone, appeals_resolved, response_speed, survey, event_label, event_kind)
    values (d - (119 - k), v_value,
            round(v_tone::numeric, 1), round(v_appeals::numeric, 1), round(v_speed::numeric, 1), round(v_survey::numeric, 1),
            case k
              when 14 then 'День города в Твери'
              when 31 then 'Тарифы на тепло'
              when 47 then 'Открытие ФАПов в округах'
              when 63 then 'Дороги после ремонта'
              when 79 then 'Прямая линия'
              when 94 then 'Медиапроект «Сделано за 100 дней»'
              when 105 then 'Выезд в Вышний Волочёк'
              when 110 then 'Бежецк без воды'
              when 113 then 'Воду в Бежецке вернули'
              when 119 then 'Авария в Удомле'
              else null
            end,
            case k
              when 14 then 'event' when 31 then 'incident' when 47 then 'project' when 63 then 'media'
              when 79 then 'pr' when 94 then 'media' when 105 then 'event' when 110 then 'incident'
              when 113 then 'project' when 119 then 'incident'
              else null
            end);
  end loop;

  select value into v_today from public.trust_index where day = d;
  select value into v_yday from public.trust_index where day = d - 1;
  select value into v_week from public.trust_index where day = d - 7;

  insert into public.daily_briefs (day, generated_at, source, headline, summary, items) values (
    d, now(), 'seed',
    'Главное сегодня — Удомля: три дома без отопления с ночи',
    'Индекс доверия ' || public._demo_num(v_today) || ': за сутки ' || public._demo_num(v_today - v_yday, true)
      || ' из-за аварии в Удомле, за неделю ' || public._demo_num(v_today - v_week, true)
      || ', когда в Бежецке вернули воду. В Твери втрое выросли жалобы на вывоз мусора в Заволжском районе. '
      || 'Решения ждут три вопроса: срок по отоплению в Удомле, мусор в Твери и выезд к жителям Удомли.',
    jsonb_build_array(
      jsonb_build_object('signal_id', s1, 'text', 'Удомля: три дома без отопления, 410 жителей и детский сад'),
      jsonb_build_object('signal_id', s2, 'text', 'Тверь: втрое больше жалоб на вывоз мусора'),
      jsonb_build_object('signal_id', s3, 'text', 'Ржев: ремонт школы № 3 отстаёт на 12 дней'))
  );
end;
$$;

-- Сброс демо-данных из кабинета команды.
create or replace function public.demo_reset()
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform public.gov_require(array['team', 'admin']::public.app_role[]);
  perform public._demo_seed();
end;
$$;

revoke execute on function public._demo_seed() from public, anon, authenticated;
revoke execute on function public.demo_reset() from public, anon;
grant execute on function public.demo_reset() to authenticated;

-- Демо-входы: губернатор и команда. Пароль случайный и нигде не хранится,
-- вход в демо выдаёт функция demo-login.
do $$
declare
  acc record;
  uid uuid;
begin
  for acc in select * from (values
      ('governor.demo@neurasystems.pro', 'Губернатор (демо)', 'governor'),
      ('team.demo@neurasystems.pro', 'Аппарат губернатора (демо)', 'team')) v(email, full_name, role)
  loop
    select id into uid from auth.users where email = acc.email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', acc.email,
              extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
              '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', acc.full_name),
              now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text,
              jsonb_build_object('sub', uid::text, 'email', acc.email, 'email_verified', true),
              'email', now(), now(), now());
    end if;
    insert into public.profiles (user_id, full_name)
    select uid, acc.full_name where not exists (select 1 from public.profiles where user_id = uid);
    update public.profiles set full_name = acc.full_name where user_id = uid;
    delete from public.user_roles where user_id = uid;
    insert into public.user_roles (user_id, role) values (uid, acc.role::public.app_role);
  end loop;
end $$;

-- Ночная пересборка демо (03:30 по Москве).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'governor-demo-reset') then
    perform cron.unschedule('governor-demo-reset');
  end if;
  perform cron.schedule('governor-demo-reset', '30 0 * * *',
    $cron$do $b$ begin if coalesce((select demo_mode from public.app_settings where id = 1), false) then perform public._demo_seed(); end if; end $b$;$cron$);
end $$;

select public._demo_seed();
