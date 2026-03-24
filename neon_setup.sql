-- SCRIPT DE CONFIGURAÇÃO PARA POSTGRESQL PADRÃO (COMPATÍVEL COM NEON)
-- Este script remove dependências específicas do Supabase e foca em uma estrutura SQL pura.

-- 1. Limpeza de Tabelas Existentes (Opcional)
DROP TABLE IF EXISTS mensagens CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS mural CASCADE;
DROP TABLE IF EXISTS planejamento_professor CASCADE;
DROP TABLE IF EXISTS cardapio CASCADE;
DROP TABLE IF EXISTS registros_rotina CASCADE;
DROP TABLE IF EXISTS diario_aluno CASCADE;
DROP TABLE IF EXISTS alunos CASCADE;
DROP TABLE IF EXISTS turmas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. Remoção de Tipos Customizados (Opcional)
DROP TYPE IF EXISTS tipo_usuario CASCADE;
DROP TYPE IF EXISTS tipo_refeicao CASCADE;

-- 3. Criação de Tipos (Enums)
CREATE TYPE tipo_usuario AS ENUM ('gestao', 'professor', 'responsavel');
CREATE TYPE tipo_refeicao AS ENUM ('colacao', 'almoco', 'lanche', 'janta');

-- 4. Tabela de Usuários
-- Nota: Usamos UUID para IDs, que é o padrão moderno. 
-- gen_random_uuid() é nativo no PostgreSQL 13+.
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE, -- ID do Firebase Authentication
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL,
    password TEXT, -- Opcional se usar apenas Firebase, mas mantido para compatibilidade
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Turmas
CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    professor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Alunos
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Diário (Resumo da Rotina Diária)
CREATE TABLE diario_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
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
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_diario_aluno_data UNIQUE (aluno_id, data)
);

-- 8. Tabela de Registros Granulares (Logs de Atividades)
CREATE TABLE registros_rotina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    professor_nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    horario TIME NOT NULL DEFAULT CURRENT_TIME,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabela Mural (Postagens e Avisos)
CREATE TABLE mural (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    author_name TEXT,
    author_role TEXT,
    title TEXT,
    content TEXT,
    type TEXT DEFAULT 'general',
    attachments JSONB DEFAULT '[]',
    likes UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabela Cardápio
CREATE TABLE cardapio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    data DATE NOT NULL, 
    refeicao tipo_refeicao NOT NULL, 
    descricao TEXT,
    CONSTRAINT unique_cardapio_data_refeicao UNIQUE (data, refeicao)
);

-- 11. Planejamento do Professor
CREATE TABLE planejamento_professor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
    data DATE NOT NULL,
    lesson_number TEXT,
    objective TEXT,
    conteudo_trabalhado TEXT,
    materials TEXT,
    bncc_codes TEXT,
    assessment TEXT,
    status TEXT DEFAULT 'pending',
    manager_feedback TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Tabela de Eventos
CREATE TABLE eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    title TEXT NOT NULL, 
    date DATE NOT NULL, 
    description TEXT, 
    location TEXT
);

-- 13. Tabela de Mensagens (Chat)
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    sender_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, 
    receiver_id UUID REFERENCES usuarios(id) ON DELETE CASCADE, 
    content TEXT NOT NULL, 
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Inserção de Dados Iniciais (Administrador Padrão)
INSERT INTO usuarios (nome, email, tipo, password) 
VALUES ('Diretor Aquarela', 'gestor@aquarela.com', 'gestao', '123')
ON CONFLICT (email) DO NOTHING;

-- FIM DO SCRIPT
