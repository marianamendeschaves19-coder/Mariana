
-- SCRIPT DEFINITIVO: AGENDA ESCOLAR AQUARELA
-- 1. Limpeza de Ambiente
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

-- 2. Criação de Tipos Customizados
CREATE TYPE tipo_usuario AS ENUM ('gestor', 'professor', 'responsavel');
CREATE TYPE tipo_refeicao AS ENUM ('colacao', 'almoco', 'lanche', 'janta');

-- 3. Tabela de Usuários (Core)
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

-- 6. Tabela de Diário (Rotina Diária)
CREATE TABLE public.diario_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    humor TEXT DEFAULT 'happy',
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

-- 7. Planejamento do Professor
CREATE TABLE public.planejamento_professor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    lesson_number TEXT,
    objective TEXT,
    conteudo_trabalhado TEXT,
    assessment TEXT,
    bncc_codes TEXT,
    status TEXT DEFAULT 'pending',
    manager_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Mural de Avisos (Feed)
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

-- 9. Outras Tabelas
CREATE TABLE public.eventos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, date DATE, description TEXT, location TEXT);
CREATE TABLE public.cardapio (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data DATE, refeicao tipo_refeicao, descricao TEXT);
CREATE TABLE public.mensagens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID REFERENCES public.usuarios(id), receiver_id UUID REFERENCES public.usuarios(id), content TEXT, timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 10. DESABILITAR RLS (REQUISITO: TODAS AS TABELAS)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_aluno DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_professor DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardapio DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens DISABLE ROW LEVEL SECURITY;

-- 11. Inserção de Usuário de Teste (Real)
-- Email: gestor@aquarela.com | Senha: 123
INSERT INTO public.usuarios (nome, email, tipo, password) 
VALUES ('Diretor Aquarela', 'gestor@aquarela.com', 'gestor', '123')
ON CONFLICT (email) DO NOTHING;

-- 12. Atualizar Cache do Esquema para o PostgREST
NOTIFY pgrst, 'reload schema';
