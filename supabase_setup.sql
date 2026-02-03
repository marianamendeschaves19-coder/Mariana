
-- SCRIPT DE REPARO: AGENDA AQUARELA
-- Execute este bloco no SQL Editor do Supabase para corrigir o erro de Schema Cache

-- 1. Garantir que o tipo ENUM existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
        CREATE TYPE tipo_usuario AS ENUM ('professor', 'gestor', 'responsavel');
    END IF;
END $$;

-- 2. Criar ou Atualizar a tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL,
    escola_id UUID,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FORÇAR a criação da coluna password se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='usuarios' AND column_name='password') THEN
        ALTER TABLE public.usuarios ADD COLUMN password TEXT NOT NULL DEFAULT '123';
    END IF;
END $$;

-- 4. Criar as outras tabelas se não existirem
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    professor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    escola_id UUID,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    escola_id UUID,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LIMPANDO O CACHE DO SCHEMA (MUITO IMPORTANTE)
-- Isso resolve o erro "Could not find column... in schema cache"
NOTIFY pgrst, 'reload schema';

-- 6. Desabilitar RLS temporariamente para facilitar o desenvolvimento
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos DISABLE ROW LEVEL SECURITY;
