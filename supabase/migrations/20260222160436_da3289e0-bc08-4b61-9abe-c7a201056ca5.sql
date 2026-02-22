
-- Enum для ролей
CREATE TYPE public.app_role AS ENUM ('mayor', 'deputy', 'employee');

-- Enum для статусов инцидентов
CREATE TYPE public.incident_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.incident_type AS ENUM ('housing', 'road', 'social', 'ecology', 'transport', 'other');

-- Enum для статусов задач
CREATE TYPE public.task_status AS ENUM ('new', 'in_progress', 'completed', 'cancelled');

-- Enum для статусов проектов
CREATE TYPE public.project_status AS ENUM ('on_track', 'risk', 'overdue', 'completed');

-- Профили пользователей
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Роли пользователей (отдельная таблица!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE (user_id, role)
);

-- Инциденты
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type incident_type NOT NULL DEFAULT 'other',
  severity incident_severity NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'new',
  address TEXT,
  department TEXT,
  responsible TEXT,
  social_object BOOLEAN DEFAULT false,
  sla_deadline TIMESTAMPTZ,
  sla_overdue BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Проекты
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'on_track',
  department TEXT,
  responsible TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget_total NUMERIC,
  budget_spent NUMERIC,
  planned_start DATE,
  planned_end DATE,
  blocker TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Контракты
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contractor TEXT,
  department TEXT,
  amount NUMERIC,
  deadline DATE,
  status TEXT DEFAULT 'active',
  risk_level TEXT DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Задачи/поручения
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'new',
  department TEXT,
  responsible TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  deadline DATE,
  overdue BOOLEAN DEFAULT false,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS на все таблицы
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Security definer функция для проверки ролей
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles: пользователь видит свой профиль, мэр/замы видят все
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Mayor reads all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'mayor'));
CREATE POLICY "Deputy reads all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'deputy'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: только мэр управляет ролями, все авторизованные читают
CREATE POLICY "Authenticated read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor manages roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'mayor'));

-- Incidents: все авторизованные читают и создают
CREATE POLICY "Authenticated read incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Mayor/Deputy update incidents" ON public.incidents FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);

-- Projects: все авторизованные читают
CREATE POLICY "Authenticated read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);
CREATE POLICY "Mayor/Deputy update projects" ON public.projects FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);

-- Contracts: все авторизованные читают
CREATE POLICY "Authenticated read contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);
CREATE POLICY "Mayor/Deputy update contracts" ON public.contracts FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);

-- Tasks: все авторизованные читают, создают мэр/замы
CREATE POLICY "Authenticated read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mayor/Deputy insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);
CREATE POLICY "Mayor/Deputy update tasks" ON public.tasks FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'mayor') OR public.has_role(auth.uid(), 'deputy')
);

-- Автоматическое создание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- По умолчанию роль employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
