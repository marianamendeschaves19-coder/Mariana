-- SCRIPT DE CONFIGURAÇÃO DA AGENDA AQUARELA
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela de Usuários
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text unique not null,
  role text not null,
  password text,
  function text
);

-- 2. Tabela de Turmas
create table if not exists public.classes (
  id text primary key,
  name text not null,
  teacher_id text references public.users(id) on delete set null
);

-- 3. Tabela de Alunos
create table if not exists public.students (
  id text primary key,
  name text not null,
  class_id text references public.classes(id) on delete cascade,
  guardian_ids text[]
);

-- 4. Tabela de Diários/Rotinas
create table if not exists public.routines (
  id text primary key,
  student_id text references public.students(id) on delete cascade,
  date date not null,
  attendance text,
  colacao text,
  almoco text,
  lanche text,
  janta text,
  banho text,
  agua text,
  evacuacao text,
  fralda text,
  sleep text,
  activities text,
  observations text,
  mood text,
  author_id text
);

-- 5. Tabela de Planos de Aula
create table if not exists public.lesson_plans (
  id text primary key,
  teacher_id text references public.users(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  date date not null,
  lesson_number text,
  grade text,
  shift text,
  objective text,
  content text,
  materials text,
  bncc_codes text,
  structure text,
  assessment text,
  status text default 'pending',
  manager_feedback text,
  created_at timestamp with time zone default now()
);

-- 6. Tabela de Postagens (Mural)
create table if not exists public.posts (
  id text primary key,
  author_id text references public.users(id) on delete cascade,
  author_name text,
  author_role text,
  title text,
  content text,
  type text,
  attachments jsonb,
  likes text[] default '{}',
  created_at timestamp with time zone default now()
);

-- 7. Tabela de Eventos
create table if not exists public.events (
  id text primary key,
  title text not null,
  date date not null,
  description text,
  location text
);

-- 8. Tabela de Cardápios
create table if not exists public.menus (
  id text primary key,
  date date unique not null,
  colacao text,
  almoco text,
  lanche text,
  janta text
);

-- 9. Tabela de Mensagens (Chat)
create table if not exists public.messages (
  id text primary key,
  sender_id text references public.users(id) on delete cascade,
  receiver_id text references public.users(id) on delete cascade,
  content text,
  timestamp timestamp with time zone default now()
);

-- Habilitar acesso público simplificado (Para desenvolvimento)
-- Nota: Em produção, você deve configurar RLS (Row Level Security)
alter table public.users disable row level security;
alter table public.classes disable row level security;
alter table public.students disable row level security;
alter table public.routines disable row level security;
alter table public.lesson_plans disable row level security;
alter table public.posts disable row level security;
alter table public.events disable row level security;
alter table public.menus disable row level security;
alter table public.messages disable row level security;