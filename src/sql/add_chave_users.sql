-- Script para adicionar campo chave na tabela users
-- Este campo mapeia para as chaves hierárquicas das lojas

-- 1. Adicionar campo chave na tabela users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TESTE..users') AND name = 'chave')
BEGIN
    ALTER TABLE TESTE..users 
    ADD chave INT NULL;
    PRINT 'Campo chave adicionado à tabela users';
END
ELSE
BEGIN
    PRINT 'Campo chave já existe na tabela users';
END

-- 2. Atualizar usuários existentes com chaves de exemplo baseadas na hierarquia de TB_ESTR_LOJAS

-- Gerentes (CHAVE_GERENCIA_AREA)
UPDATE TESTE..users SET chave = 20001 WHERE role = 'gerente' AND funcional = '54321'; -- SAO PAULO
UPDATE TESTE..users SET chave = 20002 WHERE role = 'gerente' AND name LIKE '%SUL%'; -- SUL
UPDATE TESTE..users SET chave = 20003 WHERE role = 'gerente' AND name LIKE '%NORDESTE%'; -- NORDESTE 1

-- Coordenadores (CHAVE_COORDENACAO)
UPDATE TESTE..users SET chave = 30001 WHERE role = 'coordenador' AND funcional = '67890'; -- COORD LESTE
UPDATE TESTE..users SET chave = 30002 WHERE role = 'coordenador' AND name LIKE '%OESTE%'; -- COORD OESTE
UPDATE TESTE..users SET chave = 30003 WHERE role = 'coordenador' AND name LIKE '%SUL%'; -- COORD SUL
UPDATE TESTE..users SET chave = 30004 WHERE role = 'coordenador' AND name LIKE '%NORDESTE%'; -- COORD NORDESTE

-- Supervisores (CHAVE_SUPERVISAO)
UPDATE TESTE..users SET chave = 40001 WHERE role = 'supervisor' AND funcional = '12345'; -- SUP LESTE
UPDATE TESTE..users SET chave = 40002 WHERE role = 'supervisor' AND funcional = '98765'; -- SUP OESTE
UPDATE TESTE..users SET chave = 40003 WHERE role = 'supervisor' AND name LIKE '%SUL%'; -- SUP SUL
UPDATE TESTE..users SET chave = 40004 WHERE role = 'supervisor' AND name LIKE '%REGIAO%'; -- SUP SUL REGIAO
UPDATE TESTE..users SET chave = 40005 WHERE role = 'supervisor' AND name LIKE '%NORDESTE A%'; -- SUP NORDESTE A
UPDATE TESTE..users SET chave = 40006 WHERE role = 'supervisor' AND name LIKE '%NORDESTE B%'; -- SUP NORDESTE B

-- 3. Inserir usuários de exemplo se não existirem (com as chaves hierárquicas corretas)

-- Verificar se precisa inserir gerentes
IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'gerente' AND chave = 20002)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Maria Gerente SUL', 'GER001', '1', 'gerente', 'maria.sul@example.com', 20002);
    PRINT 'Gerente SUL inserido';
END

IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'gerente' AND chave = 20003)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'João Gerente NORDESTE', 'GER002', '1', 'gerente', 'joao.nordeste@example.com', 20003);
    PRINT 'Gerente NORDESTE inserido';
END

-- Verificar se precisa inserir coordenadores
IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'coordenador' AND chave = 30002)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Ana Coord OESTE', 'COORD001', '1', 'coordenador', 'ana.oeste@example.com', 30002);
    PRINT 'Coordenador OESTE inserido';
END

IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'coordenador' AND chave = 30003)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Carlos Coord SUL', 'COORD002', '1', 'coordenador', 'carlos.sul@example.com', 30003);
    PRINT 'Coordenador SUL inserido';
END

IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'coordenador' AND chave = 30004)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Lucia Coord NORDESTE', 'COORD003', '1', 'coordenador', 'lucia.nordeste@example.com', 30004);
    PRINT 'Coordenador NORDESTE inserido';
END

-- Verificar se precisa inserir supervisores
IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'supervisor' AND chave = 40003)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Roberto Sup SUL', 'SUP001', '1', 'supervisor', 'roberto.sul@example.com', 40003);
    PRINT 'Supervisor SUL inserido';
END

IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'supervisor' AND chave = 40004)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Patricia Sup SUL REGIAO', 'SUP002', '1', 'supervisor', 'patricia.regiao@example.com', 40004);
    PRINT 'Supervisor SUL REGIAO inserido';
END

IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'supervisor' AND chave = 40005)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Fernando Sup NORDESTE A', 'SUP003', '1', 'supervisor', 'fernando.nea@example.com', 40005);
    PRINT 'Supervisor NORDESTE A inserido';
END

IF NOT EXISTS (SELECT 1 FROM TESTE..users WHERE role = 'supervisor' AND chave = 40006)
BEGIN
    INSERT INTO TESTE..users (id, name, funcional, password, role, email, chave) VALUES
    (NEWID(), 'Claudia Sup NORDESTE B', 'SUP004', '1', 'supervisor', 'claudia.neb@example.com', 40006);
    PRINT 'Supervisor NORDESTE B inserido';
END

-- 4. Verificar dados inseridos
PRINT '';
PRINT '=== USUÁRIOS COM CHAVES HIERÁRQUICAS ===';
SELECT 
    name,
    role,
    funcional,
    chave,
    CASE role
        WHEN 'gerente' THEN 'CHAVE_GERENCIA_AREA'
        WHEN 'coordenador' THEN 'CHAVE_COORDENACAO'  
        WHEN 'supervisor' THEN 'CHAVE_SUPERVISAO'
        ELSE 'N/A'
    END as tipo_chave
FROM TESTE..users 
WHERE role IN ('gerente', 'coordenador', 'supervisor')
ORDER BY role, chave;

-- 5. Verificar compatibilidade com lojas
PRINT '';
PRINT '=== VERIFICAÇÃO DE COMPATIBILIDADE COM LOJAS ===';

-- Gerentes
SELECT 
    COUNT(*) as qtd_lojas_gerente,
    'GERENTE - SAO PAULO (20001)' as hierarquia
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
WHERE CHAVE_GERENCIA_AREA = 20001

UNION ALL

SELECT 
    COUNT(*) as qtd_lojas_gerente,
    'GERENTE - SUL (20002)' as hierarquia
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
WHERE CHAVE_GERENCIA_AREA = 20002

UNION ALL

SELECT 
    COUNT(*) as qtd_lojas_gerente,
    'GERENTE - NORDESTE (20003)' as hierarquia
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
WHERE CHAVE_GERENCIA_AREA = 20003;

PRINT 'Script executado com sucesso!'; 