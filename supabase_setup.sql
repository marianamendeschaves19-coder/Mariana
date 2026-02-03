
-- 1. LIMPEZA TOTAL (OPCIONAL - CUIDADO: APAGA DADOS EXISTENTES)
DROP TABLE IF EXISTS public.mensagens CASCADE;
DROP TABLE IF EXISTS public.eventos CASCADE;
DROP TABLE IF EXISTS public.mural CASCADE;
DROP TABLE IF EXISTS public.planejamento_professor CASCADE;
DROP TABLE IF EXISTS public.cardapio CASCADE;
DROP TABLE IF EXISTS public.diario_aluno CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.turmas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.escolas CASCADE;
DROP TYPE IF EXISTS tipo_usuario CASCADE;
DROP TYPE IF EXISTS tipo_refeicao CASCADE;

-- 2. CRIAÇÃO DE TIPOS
CREATE TYPE tipo_usuario AS ENUM ('gestor', 'professor', 'responsavel');
CREATE TYPE tipo_refeicao AS ENUM ('colacao', 'almoco', 'lanche', 'janta');

-- 3. TABELA DE USUÁRIOS (COM COLUNA PASSWORD)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL,
    password TEXT NOT NULL DEFAULT '123',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE TURMAS
CREATE TABLE public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE ALUNOS
CREATE TABLE public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE DIÁRIO (ROTINA)
CREATE TABLE public.diario_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    humor TEXT,
    observacoes_professor TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_diario_aluno_data UNIQUE (aluno_id, data)
);

-- 7. TABELA DE MURAL (POSTS)
CREATE TABLE public.mural (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT,
    title TEXT,
    content TEXT,
    likes UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. OUTRAS TABELAS AUXILIARES
CREATE TABLE public.eventos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, date DATE, description TEXT, location TEXT);
CREATE TABLE public.cardapio (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data DATE, refeicao tipo_refeicao, descricao TEXT);
CREATE TABLE public.mensagens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID REFERENCES public.usuarios(id), receiver_id UUID REFERENCES public.usuarios(id), content TEXT, timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE public.planejamento_professor (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), professor_id UUID REFERENCES public.usuarios(id), turma_id UUID REFERENCES public.turmas(id), data DATE, objetivo_do_dia TEXT, conteudo_trabalhado TEXT, status TEXT DEFAULT 'pending', manager_feedback TEXT);

-- 9. DESABILITAR RLS EM TUDO (REQUISITO)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_aluno DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_professor DISABLE ROW LEVEL SECURITY;

-- 10. USUÁRIO DE TESTE
INSERT INTO public.usuarios (nome, email, tipo, password) 
VALUES ('Diretor Aquarela', 'gestor@aquarela.com', 'gestor', '123');

-- 11. RECARREGAR CACHE DO SCHEMA (RESOLVE O ERRO DE COLUNA NÃO ENCONTRADA)
NOTIFY pgrst, 'reload schema';
