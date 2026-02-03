
-- SCRIPT DE CONFIGURAÇÃO DEFINITIVA - AGENDA AQUARELA
-- Execute este script no SQL Editor do Supabase para limpar erros de cache (PGRST204)

-- 1. Limpeza Total
DROP TABLE IF EXISTS public.mensagens CASCADE;
DROP TABLE IF EXISTS public.eventos CASCADE;
DROP TABLE IF EXISTS public.mural CASCADE;
DROP TABLE IF EXISTS public.planejamento_professor CASCADE;
DROP TABLE IF EXISTS public.cardapio CASCADE;
DROP TABLE IF EXISTS public.diario_aluno CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.turmas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TYPE IF EXISTS tipo_usuario CASCADE;
DROP TYPE IF EXISTS tipo_refeicao CASCADE;

-- 2. Tipos
CREATE TYPE tipo_usuario AS ENUM ('gestor', 'professor', 'responsavel');
CREATE TYPE tipo_refeicao AS ENUM ('colacao', 'almoco', 'lanche', 'janta');

-- 3. Tabela de Usuários
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL,
    password TEXT NOT NULL DEFAULT '123',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Turmas
CREATE TABLE public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Alunos
CREATE TABLE public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Diário (Rotina) - COM COLUNA ATTENDANCE
CREATE TABLE public.diario_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    humor TEXT DEFAULT 'happy',
    attendance TEXT DEFAULT 'present',
    colacao TEXT,
    almoco TEXT,
    lanche TEXT,
    janta TEXT,
    banho TEXT,
    agua TEXT,
    evacuacao TEXT,
    fralda TEXT,
    sleep TEXT,
    atividades TEXT,
    observacoes_professor TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_diario_aluno_data UNIQUE (aluno_id, data)
);

-- 7. Tabela Mural (Visível para todos)
CREATE TABLE public.mural (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT,
    title TEXT,
    content TEXT,
    type TEXT DEFAULT 'general',
    attachments JSONB DEFAULT '[]', -- Armazena array de anexos
    likes UUID[] DEFAULT '{}', -- Array de IDs de usuários que curtiram
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela Cardápio
CREATE TABLE public.cardapio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    data DATE NOT NULL, 
    refeicao tipo_refeicao NOT NULL, 
    descricao TEXT,
    CONSTRAINT unique_cardapio_data_refeicao UNIQUE (data, refeicao)
);

-- 9. Outras Tabelas
CREATE TABLE public.eventos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, date DATE, description TEXT, location TEXT);
CREATE TABLE public.planejamento_professor (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), professor_id UUID REFERENCES public.usuarios(id), turma_id UUID REFERENCES public.turmas(id), data DATE, objective TEXT, conteudo_trabalhado TEXT, status TEXT DEFAULT 'pending', manager_feedback TEXT, lesson_number TEXT);
CREATE TABLE public.mensagens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID REFERENCES public.usuarios(id), receiver_id UUID REFERENCES public.usuarios(id), content TEXT, timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 10. Desabilitar RLS para Protótipo
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_aluno DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_professor DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;

-- 11. Usuários de Teste
INSERT INTO public.usuarios (nome, email, tipo, password) 
VALUES ('Diretor Aquarela', 'gestor@aquarela.com', 'gestor', '123')
ON CONFLICT (email) DO UPDATE SET password = '123';

-- 12. FORÇAR RECARGA DO SCHEMA (Resolve PGRST204)
NOTIFY pgrst, 'reload schema';
