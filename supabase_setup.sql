-- SCRIPT DE CONFIGURAÇÃO FINAL AGENDA AQUARELA
-- Execute este script no SQL Editor do Supabase para criar as tabelas ausentes.

-- 1. Usuários
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    password TEXT,
    function TEXT
);

-- 2. Turmas
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_id TEXT REFERENCES public.users(id) ON DELETE SET NULL
);

-- 3. Alunos
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    guardian_ids TEXT[] -- Array de IDs de usuários (responsáveis)
);

-- 4. Rotinas (Diários)
CREATE TABLE IF NOT EXISTS public.routines (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    attendance TEXT,
    colacao TEXT,
    almoco TEXT,
    lanche TEXT,
    janta TEXT,
    banho TEXT,
    agua TEXT,
    evacuacao TEXT,
    fralda TEXT,
    sleep TEXT,
    activities TEXT,
    observations TEXT,
    mood TEXT,
    author_id TEXT REFERENCES public.users(id)
);

-- 5. Planos de Aula
CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    lesson_number TEXT,
    grade TEXT,
    shift TEXT,
    objective TEXT,
    content TEXT,
    materials TEXT,
    bncc_codes TEXT,
    structure TEXT,
    assessment TEXT,
    status TEXT DEFAULT 'pending',
    manager_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Mural (Postagens)
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    author_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT,
    title TEXT,
    content TEXT,
    type TEXT,
    attachments JSONB,
    likes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Eventos
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    location TEXT
);

-- 8. Cardápios
CREATE TABLE IF NOT EXISTS public.menus (
    id TEXT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    colacao TEXT,
    almoco TEXT,
    lanche TEXT,
    janta TEXT
);

-- 9. Mensagens (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de Acesso (Desabilitar RLS para desenvolvimento)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Notificar o PostgREST para recarregar o cache (Isso acontece automaticamente, mas forçamos se necessário)
NOTIFY pgrst, 'reload schema';