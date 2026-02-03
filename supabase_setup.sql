
-- SCRIPT SQL: AGENDA ESCOLAR AQUARELA (SUPABASE/POSTGRESQL)
-- Especialista em Sistemas Educacionais

-- 1. DEFINIÇÃO DE ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
        CREATE TYPE tipo_usuario AS ENUM ('professor', 'gestor', 'responsavel');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_alimentacao') THEN
        CREATE TYPE tipo_alimentacao AS ENUM ('comeu', 'nao_comeu', 'comeu_pouco');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_troca_fralda') THEN
        CREATE TYPE tipo_troca_fralda AS ENUM ('sim', 'nao', 'nao_usou');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_sim_nao') THEN
        CREATE TYPE tipo_sim_nao AS ENUM ('sim', 'nao');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_humor') THEN
        CREATE TYPE tipo_humor AS ENUM ('tranquilo', 'agitado', 'choroso');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_interacao') THEN
        CREATE TYPE tipo_interacao AS ENUM ('boa', 'regular', 'dificil');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_refeicao') THEN
        CREATE TYPE tipo_refeicao AS ENUM ('colacao', 'almoco', 'lanche', 'janta');
    END IF;
END $$;

-- 2. TABELAS
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL,
    password TEXT, -- Para o mock de login do app
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    faixa_etaria TEXT,
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL, -- FK para vincular professor à turma
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    data_nascimento DATE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agenda_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes_gerais TEXT,
    recados_para_familia TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_agenda_aluno_data UNIQUE (aluno_id, data)
);

CREATE TABLE IF NOT EXISTS public.diario_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    colacao tipo_alimentacao DEFAULT 'comeu',
    almoco tipo_alimentacao DEFAULT 'comeu',
    lanche tipo_alimentacao DEFAULT 'comeu',
    janta tipo_alimentacao DEFAULT 'comeu',
    troca_fralda tipo_troca_fralda DEFAULT 'nao_usou',
    evacuacao tipo_sim_nao DEFAULT 'nao',
    xixi tipo_sim_nao DEFAULT 'sim',
    dormiu tipo_sim_nao DEFAULT 'sim',
    horario_inicio_sono TIME,
    horario_fim_sono TIME,
    humor tipo_humor DEFAULT 'tranquilo',
    interacao tipo_interacao DEFAULT 'boa',
    febre BOOLEAN DEFAULT FALSE,
    medicacao TEXT,
    observacoes_saude TEXT,
    observacoes_professor TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_diario_aluno_data UNIQUE (aluno_id, data)
);

CREATE TABLE IF NOT EXISTS public.cardapio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    refeicao tipo_refeicao NOT NULL,
    descricao TEXT NOT NULL,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.planejamento_professor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    objetivo_do_dia TEXT,
    conteudo_trabalhado TEXT,
    atividades_desenvolvidas TEXT,
    recursos_utilizados TEXT,
    metodologia TEXT,
    avaliacao_do_dia TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'pending',
    manager_feedback TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas auxiliares para o app atual
CREATE TABLE IF NOT EXISTS public.mural (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT,
    title TEXT,
    content TEXT,
    type TEXT,
    attachments JSONB,
    likes UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    location TEXT
);

CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    content TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DESABILITAR RLS PARA DEV
ALTER TABLE public.escolas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_diaria DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_aluno DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_professor DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
