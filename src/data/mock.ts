// Mock data for Mayor's Tablet

export interface Incident {
  id: string;
  type: 'heat' | 'water' | 'electric' | 'sewage' | 'roads' | 'other';
  title: string;
  address: string;
  district: string;
  severity: 'low' | 'medium' | 'high';
  scale: string;
  department: string;
  responsible: string;
  slaDeadline: string;
  status: 'new' | 'in_progress' | 'localized' | 'closed' | 'pending';
  slaOverdue: boolean;
  socialObject: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  department: string;
  responsible: string;
  plannedEnd: string;
  status: 'in_progress' | 'on_track' | 'risk' | 'overdue' | 'completed';
  blockers: string[];
  progress: number;
}

export interface Contract {
  id: string;
  name: string;
  contractor: string;
  projectId?: string;
  amount: string;
  status: 'tender' | 'signed' | 'execution' | 'closed';
  risk: 'normal' | 'risk' | 'red';
  deadline: string;
  comment: string;
}

export interface Task {
  id: string;
  title: string;
  department: string;
  responsible: string;
  status: 'new' | 'in_progress' | 'on_control' | 'completed';
  deadline: string;
  overdue: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CheatsheetSector {
  id: string;
  name: string;
  icon: string;
  metrics: { label: string; value: string; unit: string }[];
}

export const departments = [
  'Управление дорожного хозяйства и транспорта',
  'Управление ЖКХ и энергетики',
  'Управление благоустройства и экологии',
  'Управление капитального строительства и нацпроектов',
  'Финансовое управление',
  'Управление образования и социальной политики',
  'Управление экономики и инвестиций',
];

export const incidentTypes: Record<Incident['type'], string> = {
  heat: 'Теплоснабжение',
  water: 'Водоснабжение',
  electric: 'Электроснабжение',
  sewage: 'Канализация',
  roads: 'Дороги',
  other: 'Другое',
};

export const incidents: Incident[] = [
  { id: 'INC-001', type: 'heat', title: 'Прорыв теплотрассы на ул. Ленина', address: 'ул. Ленина, 45', district: 'Центральный', severity: 'high', scale: '120 домов', department: departments[1], responsible: 'Иванов А.В.', slaDeadline: '2026-02-20T18:00:00', status: 'in_progress', slaOverdue: true, socialObject: true, createdAt: '2026-02-19T08:30:00', updatedAt: '2026-02-20T09:15:00' },
  { id: 'INC-002', type: 'water', title: 'Утечка водопровода пер. Мира', address: 'пер. Мира, 12', district: 'Ленинский', severity: 'medium', scale: '15 домов', department: departments[1], responsible: 'Петров С.И.', slaDeadline: '2026-02-21T12:00:00', status: 'in_progress', slaOverdue: false, socialObject: false, createdAt: '2026-02-20T06:00:00', updatedAt: '2026-02-20T08:00:00' },
  { id: 'INC-003', type: 'electric', title: 'Обрыв ЛЭП район Северный', address: 'ул. Северная, 78', district: 'Северный', severity: 'high', scale: '2000 жителей', department: departments[1], responsible: 'Сидоров К.П.', slaDeadline: '2026-02-20T14:00:00', status: 'new', slaOverdue: true, socialObject: true, createdAt: '2026-02-20T07:00:00', updatedAt: '2026-02-20T07:00:00' },
  { id: 'INC-004', type: 'roads', title: 'Провал дорожного покрытия', address: 'пр. Победы, 33', district: 'Октябрьский', severity: 'high', scale: 'перекрыта полоса', department: departments[0], responsible: 'Козлов Д.А.', slaDeadline: '2026-02-20T20:00:00', status: 'localized', slaOverdue: false, socialObject: false, createdAt: '2026-02-20T05:30:00', updatedAt: '2026-02-20T10:00:00' },
  { id: 'INC-005', type: 'sewage', title: 'Засор канализации ЖК "Лесной"', address: 'ЖК Лесной, корп. 3', district: 'Заводской', severity: 'medium', scale: '1 подъезд', department: departments[1], responsible: 'Новиков Е.С.', slaDeadline: '2026-02-21T08:00:00', status: 'in_progress', slaOverdue: false, socialObject: false, createdAt: '2026-02-20T09:00:00', updatedAt: '2026-02-20T09:30:00' },
  { id: 'INC-006', type: 'heat', title: 'Отключение отопления в школе №14', address: 'ул. Школьная, 14', district: 'Центральный', severity: 'high', scale: '1 соцобъект', department: departments[1], responsible: 'Иванов А.В.', slaDeadline: '2026-02-20T12:00:00', status: 'in_progress', slaOverdue: true, socialObject: true, createdAt: '2026-02-20T07:30:00', updatedAt: '2026-02-20T08:45:00' },
  { id: 'INC-007', type: 'water', title: 'Низкое давление воды мкр. Южный', address: 'мкр. Южный', district: 'Ленинский', severity: 'low', scale: '50 домов', department: departments[1], responsible: 'Петров С.И.', slaDeadline: '2026-02-22T18:00:00', status: 'new', slaOverdue: false, socialObject: false, createdAt: '2026-02-20T10:00:00', updatedAt: '2026-02-20T10:00:00' },
  { id: 'INC-008', type: 'other', title: 'Упавшее дерево на детской площадке', address: 'парк Культуры', district: 'Центральный', severity: 'medium', scale: 'площадка закрыта', department: departments[2], responsible: 'Лебедев М.О.', slaDeadline: '2026-02-20T16:00:00', status: 'closed', slaOverdue: false, socialObject: false, createdAt: '2026-02-19T16:00:00', updatedAt: '2026-02-20T08:00:00' },
];

export const projects: Project[] = [
  { id: 'PRJ-001', name: 'Строительство школы №25', department: departments[3], responsible: 'Морозов И.Н.', plannedEnd: '2026-09-01', status: 'risk', blockers: ['Задержка поставки стройматериалов', 'Нехватка рабочей силы'], progress: 42 },
  { id: 'PRJ-002', name: 'Реконструкция моста через р. Быстрая', department: departments[0], responsible: 'Козлов Д.А.', plannedEnd: '2026-06-15', status: 'on_track', blockers: [], progress: 67 },
  { id: 'PRJ-003', name: 'Капремонт теплосетей Северного района', department: departments[1], responsible: 'Иванов А.В.', plannedEnd: '2026-04-30', status: 'overdue', blockers: ['Не согласован проект', 'Бюджет превышен на 12%'], progress: 28 },
  { id: 'PRJ-004', name: 'Благоустройство набережной', department: departments[2], responsible: 'Лебедев М.О.', plannedEnd: '2026-08-01', status: 'in_progress', blockers: [], progress: 55 },
  { id: 'PRJ-005', name: 'Строительство детского сада мкр. Солнечный', department: departments[3], responsible: 'Морозов И.Н.', plannedEnd: '2026-12-01', status: 'on_track', blockers: [], progress: 15 },
  { id: 'PRJ-006', name: 'Ремонт дороги пр. Победы', department: departments[0], responsible: 'Козлов Д.А.', plannedEnd: '2026-03-15', status: 'risk', blockers: ['Погодные условия'], progress: 78 },
];

export const contracts: Contract[] = [
  { id: 'CTR-001', name: 'Поставка труб для теплосетей', contractor: 'ООО "ТеплоСнаб"', projectId: 'PRJ-003', amount: '45 млн ₽', status: 'execution', risk: 'red', deadline: '2026-03-01', comment: 'Срыв сроков поставки' },
  { id: 'CTR-002', name: 'Строительство школы №25 — основной подряд', contractor: 'АО "Строймонтаж"', projectId: 'PRJ-001', amount: '380 млн ₽', status: 'execution', risk: 'risk', deadline: '2026-08-01', comment: 'Отставание от графика на 2 недели' },
  { id: 'CTR-003', name: 'Благоустройство набережной — ландшафт', contractor: 'ИП Зелёный город', projectId: 'PRJ-004', amount: '12 млн ₽', status: 'signed', risk: 'normal', deadline: '2026-05-15', comment: '' },
  { id: 'CTR-004', name: 'Ремонт моста — проектирование', contractor: 'ООО "ПроектИнжиниринг"', projectId: 'PRJ-002', amount: '8 млн ₽', status: 'closed', risk: 'normal', deadline: '2026-01-15', comment: 'Завершён в срок' },
  { id: 'CTR-005', name: 'Асфальтирование пр. Победы', contractor: 'ООО "ДорСтрой"', projectId: 'PRJ-006', amount: '95 млн ₽', status: 'execution', risk: 'risk', deadline: '2026-03-10', comment: 'Зависит от погоды' },
];

export const tasks: Task[] = [
  { id: 'TSK-001', title: 'Подготовить отчёт по аварийному жилфонду', department: departments[1], responsible: 'Иванов А.В.', status: 'in_progress', deadline: '2026-02-20', overdue: true, createdBy: 'Мэр', createdAt: '2026-02-18' },
  { id: 'TSK-002', title: 'Согласовать схему объезда пр. Победы', department: departments[0], responsible: 'Козлов Д.А.', status: 'completed', deadline: '2026-02-19', overdue: false, createdBy: 'Мэр', createdAt: '2026-02-17' },
  { id: 'TSK-003', title: 'Провести совещание по строительству школы №25', department: departments[3], responsible: 'Морозов И.Н.', status: 'new', deadline: '2026-02-21', overdue: false, createdBy: 'Мэр', createdAt: '2026-02-20' },
  { id: 'TSK-004', title: 'Подготовить данные по износу теплосетей для доклада', department: departments[1], responsible: 'Петров С.И.', status: 'on_control', deadline: '2026-02-20', overdue: true, createdBy: 'Зам. по ЖКХ', createdAt: '2026-02-15' },
  { id: 'TSK-005', title: 'Обеспечить вывоз снега с центральных улиц', department: departments[2], responsible: 'Лебедев М.О.', status: 'in_progress', deadline: '2026-02-20', overdue: false, createdBy: 'Мэр', createdAt: '2026-02-19' },
  { id: 'TSK-006', title: 'Направить претензию подрядчику ООО "ТеплоСнаб"', department: departments[3], responsible: 'Морозов И.Н.', status: 'new', deadline: '2026-02-22', overdue: false, createdBy: 'Зам. по строительству', createdAt: '2026-02-20' },
];

export const cheatsheetSectors: CheatsheetSector[] = [
  {
    id: '1', name: 'Дороги и транспорт', icon: 'road',
    metrics: [
      { label: 'Дороги всего', value: '1 240', unit: 'км' },
      { label: 'В нормативе', value: '876 (71%)', unit: 'км' },
      { label: 'Ремонт в этом году', value: '48', unit: 'км' },
      { label: 'Выполнено', value: '12', unit: 'км' },
      { label: 'Проблемных участков', value: '34', unit: 'шт' },
    ],
  },
  {
    id: '2', name: 'Жилищный фонд', icon: 'building',
    metrics: [
      { label: 'МКД всего', value: '2 480', unit: 'ед' },
      { label: 'Аварийных', value: '47', unit: 'ед' },
      { label: 'Капремонт план/факт', value: '120 / 38', unit: 'домов' },
      { label: 'Лифтов всего', value: '3 150', unit: 'шт' },
      { label: 'Замена лифтов', value: '42', unit: 'шт' },
    ],
  },
  {
    id: '3', name: 'Инфраструктура ЖКХ', icon: 'wrench',
    metrics: [
      { label: 'Теплосети', value: '580 км / износ 62%', unit: '' },
      { label: 'Водосети', value: '720 км / износ 54%', unit: '' },
      { label: 'Аварий за сутки', value: '7', unit: 'шт' },
      { label: 'Просрочено SLA', value: '3', unit: 'шт' },
      { label: 'Соцобъектов под риском', value: '2', unit: 'шт' },
    ],
  },
  {
    id: '4', name: 'Благоустройство и экология', icon: 'trees',
    metrics: [
      { label: 'Контейнерных площадок', value: '890', unit: 'ед' },
      { label: 'Проблемных площадок', value: '23', unit: 'ед' },
      { label: 'Жалоб за сутки', value: '14', unit: 'шт' },
      { label: 'Просрочено', value: '5', unit: 'шт' },
      { label: 'Озеленение план', value: '2 500', unit: 'деревьев' },
    ],
  },
  {
    id: '5', name: 'Социальная сфера', icon: 'users',
    metrics: [
      { label: 'Школ', value: '68', unit: 'шт' },
      { label: 'Детсадов', value: '95', unit: 'шт' },
      { label: 'Очередь в детсады', value: '1 240', unit: 'детей' },
      { label: 'Ремонтов соцобъектов', value: '12', unit: 'шт' },
      { label: 'Охват мерами/льготами', value: '34 500', unit: 'чел' },
    ],
  },
  {
    id: '6', name: 'Нацпроекты и стройки', icon: 'crane',
    metrics: [
      { label: 'Объектов в работе', value: '18', unit: 'шт' },
      { label: 'В риске', value: '4', unit: 'шт' },
      { label: 'Просрочено', value: '2', unit: 'шт' },
      { label: 'Ввод до конца года', value: '6', unit: 'шт' },
      { label: 'Освоение средств', value: '34%', unit: '' },
    ],
  },
  {
    id: '7', name: 'Экономика и бюджет', icon: 'wallet',
    metrics: [
      { label: 'Доходы план', value: '18.4 млрд ₽ / 14%', unit: '' },
      { label: 'Расходы план', value: '19.2 млрд ₽ / 12%', unit: '' },
      { label: 'Долг', value: '3.1 млрд ₽', unit: '' },
      { label: 'Инвестпроектов', value: '24', unit: 'шт' },
      { label: 'Рабочих мест план/факт', value: '1 200 / 430', unit: 'шт' },
    ],
  },
];

export const chartDataDay = [
  { time: '00:00', new: 0, closed: 0 },
  { time: '03:00', new: 1, closed: 0 },
  { time: '06:00', new: 3, closed: 1 },
  { time: '09:00', new: 2, closed: 2 },
  { time: '12:00', new: 4, closed: 3 },
  { time: '15:00', new: 1, closed: 4 },
  { time: '18:00', new: 2, closed: 2 },
  { time: '21:00', new: 0, closed: 1 },
];

export const chartDataWeek = [
  { time: '14 фев', new: 8, closed: 6 },
  { time: '15 фев', new: 12, closed: 9 },
  { time: '16 фев', new: 5, closed: 7 },
  { time: '17 фев', new: 9, closed: 8 },
  { time: '18 фев', new: 15, closed: 11 },
  { time: '19 фев', new: 7, closed: 10 },
  { time: '20 фев', new: 13, closed: 5 },
];
