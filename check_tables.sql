-- Script para verificar tabelas disponíveis e dados

PRINT '=== VERIFICAÇÃO DE TABELAS DISPONÍVEIS ===';

-- 1. Verificar tabelas no schema DATAWAREHOUSE
PRINT '';
PRINT '--- TABELAS NO SCHEMA DATAWAREHOUSE ---';
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'DATAWAREHOUSE')
BEGIN
    SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME AND TABLE_SCHEMA = t.TABLE_SCHEMA) as num_colunas
    FROM INFORMATION_SCHEMA.TABLES t
    WHERE TABLE_CATALOG = 'DATAWAREHOUSE'
    ORDER BY TABLE_SCHEMA, TABLE_NAME;
END
ELSE
BEGIN
    PRINT '❌ Database DATAWAREHOUSE não existe';
END

-- 2. Verificar tabelas no schema TESTE
PRINT '';
PRINT '--- TABELAS NO SCHEMA TESTE ---';
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME AND TABLE_SCHEMA = t.TABLE_SCHEMA) as num_colunas
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_CATALOG = 'TESTE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- 3. Verificar especificamente as tabelas de estratégia esperadas
PRINT '';
PRINT '--- VERIFICAÇÃO DAS TABELAS DE ESTRATÉGIA ---';

-- TB_ESTR_LOJAS
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TB_ESTR_LOJAS' AND TABLE_CATALOG = 'DATAWAREHOUSE')
BEGIN
    DECLARE @count_lojas INT;
    SELECT @count_lojas = COUNT(*) FROM DATAWAREHOUSE..TB_ESTR_LOJAS;
    PRINT '✅ DATAWAREHOUSE..TB_ESTR_LOJAS existe com ' + CAST(@count_lojas AS VARCHAR) + ' registros';
END
ELSE
BEGIN
    PRINT '❌ DATAWAREHOUSE..TB_ESTR_LOJAS NÃO EXISTE';
END

-- TB_ESTR_CONTAS
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TB_ESTR_CONTAS' AND TABLE_CATALOG = 'DATAWAREHOUSE')
BEGIN
    DECLARE @count_contas INT;
    SELECT @count_contas = COUNT(*) FROM DATAWAREHOUSE..TB_ESTR_CONTAS;
    PRINT '✅ DATAWAREHOUSE..TB_ESTR_CONTAS existe com ' + CAST(@count_contas AS VARCHAR) + ' registros';
END
ELSE
BEGIN
    PRINT '❌ DATAWAREHOUSE..TB_ESTR_CONTAS NÃO EXISTE';
END

-- 4. Verificar tabelas de oportunidades que existem
PRINT '';
PRINT '--- TABELAS DE OPORTUNIDADES DISPONÍVEIS ---';

-- oportunidades_contas
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'oportunidades_contas' AND TABLE_CATALOG = 'TESTE')
BEGIN
    DECLARE @count_opp_contas INT;
    SELECT @count_opp_contas = COUNT(*) FROM TESTE..oportunidades_contas;
    PRINT '✅ TESTE..oportunidades_contas existe com ' + CAST(@count_opp_contas AS VARCHAR) + ' registros';
    
    -- Mostrar tipos de estratégia disponíveis
    SELECT DISTINCT TIPO_ESTRATEGIA, COUNT(*) as qtd FROM TESTE..oportunidades_contas GROUP BY TIPO_ESTRATEGIA;
END
ELSE
BEGIN
    PRINT '❌ TESTE..oportunidades_contas NÃO EXISTE';
END

-- oportunidades_credito  
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'oportunidades_credito' AND TABLE_CATALOG = 'TESTE')
BEGIN
    DECLARE @count_opp_credito INT;
    SELECT @count_opp_credito = COUNT(*) FROM TESTE..oportunidades_credito;
    PRINT '✅ TESTE..oportunidades_credito existe com ' + CAST(@count_opp_credito AS VARCHAR) + ' registros';
    
    -- Mostrar tipos de estratégia disponíveis
    SELECT DISTINCT TIPO_ESTRATEGIA, COUNT(*) as qtd FROM TESTE..oportunidades_credito GROUP BY TIPO_ESTRATEGIA;
END
ELSE
BEGIN
    PRINT '❌ TESTE..oportunidades_credito NÃO EXISTE';
END

-- 5. Verificar usuários com chaves
PRINT '';
PRINT '--- USUÁRIOS COM CHAVES HIERÁRQUICAS ---';
SELECT 
    name,
    role, 
    funcional,
    chave,
    CASE 
        WHEN chave IS NULL AND role != 'admin' THEN '❌ SEM CHAVE'
        WHEN role = 'admin' THEN '✅ ADMIN'
        ELSE '✅ COM CHAVE'
    END as status
FROM TESTE..users 
WHERE role IN ('admin', 'gerente', 'coordenador', 'supervisor')
ORDER BY role, name;

PRINT '';
PRINT '=== RECOMENDAÇÕES ===';
PRINT '';
PRINT 'Se as tabelas DATAWAREHOUSE..TB_ESTR_LOJAS e TB_ESTR_CONTAS não existem:';
PRINT '1. Use as tabelas TESTE..oportunidades_contas e TESTE..oportunidades_credito';
PRINT '2. Ajuste o código da API para usar essas tabelas';
PRINT '3. Execute os scripts setup_oportunidades_*.sql se necessário';
PRINT '';
PRINT 'Para testar:';
PRINT '1. Faça login com um usuário que tenha chave definida';
PRINT '2. Acesse /estrategia/abertura-conta ou /estrategia/credito';
PRINT ''; 