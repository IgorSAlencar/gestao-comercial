-- Script para diagnosticar e corrigir chaves dos usuários
-- Especialmente para o usuário João Silva (funcional 12345)

PRINT '=== DIAGNÓSTICO DE USUÁRIOS ===';

-- 1. Verificar todos os usuários e suas chaves
SELECT 
    name,
    role,
    funcional,
    chave,
    CASE 
        WHEN chave IS NULL THEN '❌ SEM CHAVE'
        WHEN role = 'admin' THEN '✅ ADMIN (não precisa chave)'
        WHEN role = 'gerente' AND chave IN (20001, 20002, 20003) THEN '✅ CHAVE VÁLIDA'
        WHEN role = 'coordenador' AND chave IN (30001, 30002, 30003, 30004) THEN '✅ CHAVE VÁLIDA'
        WHEN role = 'supervisor' AND chave IN (40001, 40002, 40003, 40004, 40005, 40006) THEN '✅ CHAVE VÁLIDA'
        ELSE '❌ CHAVE INVÁLIDA'
    END as status_chave
FROM TESTE..users 
ORDER BY role, name;

PRINT '';
PRINT '=== CORREÇÃO DE CHAVES ===';

-- 2. Corrigir usuários específicos que podem estar sem chave

-- João Silva (supervisor - funcional 12345)
IF EXISTS (SELECT 1 FROM TESTE..users WHERE funcional = '12345' AND (chave IS NULL OR chave != 40001))
BEGIN
    UPDATE TESTE..users 
    SET chave = 40001 
    WHERE funcional = '12345' AND role = 'supervisor';
    PRINT '✅ João Silva (funcional 12345) atualizado com chave 40001 (SUP LESTE)';
END
ELSE
BEGIN
    PRINT 'ℹ️ João Silva já tem chave correta ou não existe';
END

-- Ana Costa (supervisor - funcional 98765)
IF EXISTS (SELECT 1 FROM TESTE..users WHERE funcional = '98765' AND (chave IS NULL OR chave != 40002))
BEGIN
    UPDATE TESTE..users 
    SET chave = 40002 
    WHERE funcional = '98765' AND role = 'supervisor';
    PRINT '✅ Ana Costa (funcional 98765) atualizado com chave 40002 (SUP OESTE)';
END
ELSE
BEGIN
    PRINT 'ℹ️ Ana Costa já tem chave correta ou não existe';
END

-- Maria Santos (coordenador - funcional 67890)
IF EXISTS (SELECT 1 FROM TESTE..users WHERE funcional = '67890' AND (chave IS NULL OR chave != 30001))
BEGIN
    UPDATE TESTE..users 
    SET chave = 30001 
    WHERE funcional = '67890' AND role = 'coordenador';
    PRINT '✅ Maria Santos (funcional 67890) atualizado com chave 30001 (COORD LESTE)';
END
ELSE
BEGIN
    PRINT 'ℹ️ Maria Santos já tem chave correta ou não existe';
END

-- Carlos Oliveira (gerente - funcional 54321)
IF EXISTS (SELECT 1 FROM TESTE..users WHERE funcional = '54321' AND (chave IS NULL OR chave != 20001))
BEGIN
    UPDATE TESTE..users 
    SET chave = 20001 
    WHERE funcional = '54321' AND role = 'gerente';
    PRINT '✅ Carlos Oliveira (funcional 54321) atualizado com chave 20001 (SAO PAULO)';
END
ELSE
BEGIN
    PRINT 'ℹ️ Carlos Oliveira já tem chave correta ou não existe';
END

-- Igor Alencar (admin - não precisa chave)
IF EXISTS (SELECT 1 FROM TESTE..users WHERE funcional = '9444168' AND role = 'admin')
BEGIN
    PRINT '✅ Igor Alencar (admin) - não precisa chave';
END
ELSE
BEGIN
    PRINT 'ℹ️ Igor Alencar não encontrado ou não é admin';
END

PRINT '';
PRINT '=== VERIFICAÇÃO FINAL ===';

-- 3. Verificar se as correções funcionaram
SELECT 
    name,
    role,
    funcional,
    chave,
    CASE 
        WHEN chave IS NULL AND role != 'admin' THEN '❌ PROBLEMA: Sem chave'
        WHEN role = 'admin' THEN '✅ OK: Admin não precisa chave'
        WHEN role = 'gerente' AND chave IN (20001, 20002, 20003) THEN '✅ OK: Gerente com chave válida'
        WHEN role = 'coordenador' AND chave IN (30001, 30002, 30003, 30004) THEN '✅ OK: Coordenador com chave válida'
        WHEN role = 'supervisor' AND chave IN (40001, 40002, 40003, 40004, 40005, 40006) THEN '✅ OK: Supervisor com chave válida'
        ELSE '❌ PROBLEMA: Chave inválida'
    END as status_final
FROM TESTE..users 
WHERE role IN ('gerente', 'coordenador', 'supervisor', 'admin')
ORDER BY role, name;

PRINT '';
PRINT '=== TESTE DE COMPATIBILIDADE COM LOJAS ===';

-- 4. Verificar se existem lojas para cada hierarquia
SELECT 
    'GERENTE - SAO PAULO (20001)' as hierarquia,
    COUNT(*) as qtd_lojas
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
WHERE CHAVE_GERENCIA_AREA = 20001

UNION ALL

SELECT 
    'COORDENADOR - LESTE (30001)' as hierarquia,
    COUNT(*) as qtd_lojas
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
WHERE CHAVE_COORDENACAO = 30001

UNION ALL

SELECT 
    'SUPERVISOR - LESTE (40001)' as hierarquia,
    COUNT(*) as qtd_lojas
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
WHERE CHAVE_SUPERVISAO = 40001;

PRINT '';
PRINT '=== INSTRUÇÕES PARA TESTE ===';
PRINT '1. Execute este script no SQL Server Management Studio';
PRINT '2. Verifique se João Silva (funcional 12345) tem chave = 40001';
PRINT '3. Teste o login do João Silva no sistema';
PRINT '4. Acesse a página de estratégia comercial';
PRINT '5. Se ainda houver erro, verifique os logs do console do navegador';

PRINT '';
PRINT 'Script de correção executado com sucesso!'; 