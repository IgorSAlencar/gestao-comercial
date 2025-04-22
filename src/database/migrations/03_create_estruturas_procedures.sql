-- Procedure para calcular e atualizar as contagens de estruturas para um usuário
DELIMITER //
CREATE PROCEDURE TESTE.atualizar_contagem_estruturas(IN p_user_id VARCHAR(50))
BEGIN
    DECLARE v_qtd_total INT;
    DECLARE v_qtd_agencias INT;
    DECLARE v_qtd_pas INT;
    DECLARE v_qtd_uns INT;
    DECLARE v_qtd_pracas INT;
    DECLARE v_qtd_agencias_sem_be INT;
    DECLARE v_qtd_pas_sem_be INT;
    DECLARE v_qtd_uns_sem_be INT;
    DECLARE v_qtd_pracas_sem_be INT;
    
    -- Conta estruturas por tipo
    SELECT 
        COUNT(*) INTO v_qtd_total
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_agencias
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'agencia' AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_pas
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'pa' AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_uns
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'un' AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_pracas
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'praca' AND ativo = TRUE;
    
    -- Conta estruturas sem BE
    SELECT 
        COUNT(*) INTO v_qtd_agencias_sem_be
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'agencia' AND tem_be = FALSE AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_pas_sem_be
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'pa' AND tem_be = FALSE AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_uns_sem_be
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'un' AND tem_be = FALSE AND ativo = TRUE;
    
    SELECT 
        COUNT(*) INTO v_qtd_pracas_sem_be
    FROM TESTE.USUARIO_ESTRUTURA_RELACAO 
    WHERE user_id = p_user_id AND tipo_estrutura = 'praca' AND tem_be = FALSE AND ativo = TRUE;
    
    -- Atualiza ou insere na tabela de resumo
    INSERT INTO TESTE.ESTRUTURAS_USER (
        user_id, 
        qtd_total, 
        qtd_agencias, 
        qtd_pas, 
        qtd_uns, 
        qtd_pracas, 
        qtd_agencias_sem_be, 
        qtd_pas_sem_be, 
        qtd_uns_sem_be, 
        qtd_pracas_sem_be
    ) 
    VALUES (
        p_user_id,
        v_qtd_total,
        v_qtd_agencias,
        v_qtd_pas,
        v_qtd_uns,
        v_qtd_pracas,
        v_qtd_agencias_sem_be,
        v_qtd_pas_sem_be,
        v_qtd_uns_sem_be,
        v_qtd_pracas_sem_be
    )
    ON DUPLICATE KEY UPDATE
        qtd_total = v_qtd_total,
        qtd_agencias = v_qtd_agencias,
        qtd_pas = v_qtd_pas,
        qtd_uns = v_qtd_uns,
        qtd_pracas = v_qtd_pracas,
        qtd_agencias_sem_be = v_qtd_agencias_sem_be,
        qtd_pas_sem_be = v_qtd_pas_sem_be,
        qtd_uns_sem_be = v_qtd_uns_sem_be,
        qtd_pracas_sem_be = v_qtd_pracas_sem_be;
END //
DELIMITER ;

-- Procedure para obter as estruturas com base no papel do usuário
DELIMITER //
CREATE PROCEDURE TESTE.get_estruturas_por_usuario(IN p_user_id VARCHAR(50))
BEGIN
    DECLARE v_role VARCHAR(20);
    
    -- Busca o papel do usuário
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    
    -- Com base no papel, retorna as estatísticas apropriadas
    IF v_role = 'admin' THEN
        -- Retorna estatísticas globais
        SELECT 
            COUNT(DISTINCT estrutura_id) as qtd_total,
            SUM(CASE WHEN tipo_estrutura = 'agencia' THEN 1 ELSE 0 END) as qtd_agencias,
            SUM(CASE WHEN tipo_estrutura = 'pa' THEN 1 ELSE 0 END) as qtd_pas,
            SUM(CASE WHEN tipo_estrutura = 'un' THEN 1 ELSE 0 END) as qtd_uns,
            SUM(CASE WHEN tipo_estrutura = 'praca' THEN 1 ELSE 0 END) as qtd_pracas,
            SUM(CASE WHEN tipo_estrutura = 'agencia' AND tem_be = FALSE THEN 1 ELSE 0 END) as qtd_agencias_sem_be,
            SUM(CASE WHEN tipo_estrutura = 'pa' AND tem_be = FALSE THEN 1 ELSE 0 END) as qtd_pas_sem_be,
            SUM(CASE WHEN tipo_estrutura = 'un' AND tem_be = FALSE THEN 1 ELSE 0 END) as qtd_uns_sem_be,
            SUM(CASE WHEN tipo_estrutura = 'praca' AND tem_be = FALSE THEN 1 ELSE 0 END) as qtd_pracas_sem_be
        FROM 
            TESTE.USUARIO_ESTRUTURA_RELACAO
        WHERE 
            ativo = TRUE;
    ELSEIF v_role IN ('manager', 'coordinator') THEN
        -- Retorna estatísticas da equipe
        SELECT 
            COUNT(DISTINCT uer.estrutura_id) as qtd_total,
            SUM(CASE WHEN uer.tipo_estrutura = 'agencia' THEN 1 ELSE 0 END) as qtd_agencias,
            SUM(CASE WHEN uer.tipo_estrutura = 'pa' THEN 1 ELSE 0 END) as qtd_pas,
            SUM(CASE WHEN uer.tipo_estrutura = 'un' THEN 1 ELSE 0 END) as qtd_uns,
            SUM(CASE WHEN uer.tipo_estrutura = 'praca' THEN 1 ELSE 0 END) as qtd_pracas,
            SUM(CASE WHEN uer.tipo_estrutura = 'agencia' AND uer.tem_be = FALSE THEN 1 ELSE 0 END) as qtd_agencias_sem_be,
            SUM(CASE WHEN uer.tipo_estrutura = 'pa' AND uer.tem_be = FALSE THEN 1 ELSE 0 END) as qtd_pas_sem_be,
            SUM(CASE WHEN uer.tipo_estrutura = 'un' AND uer.tem_be = FALSE THEN 1 ELSE 0 END) as qtd_uns_sem_be,
            SUM(CASE WHEN uer.tipo_estrutura = 'praca' AND uer.tem_be = FALSE THEN 1 ELSE 0 END) as qtd_pracas_sem_be
        FROM 
            TESTE.USUARIO_ESTRUTURA_RELACAO uer
        JOIN 
            user_relationships ur ON uer.user_id = ur.user_id
        WHERE 
            ur.manager_id = p_user_id
            AND uer.ativo = TRUE;
    ELSE
        -- Retorna estatísticas do usuário individual
        SELECT 
            qtd_total,
            qtd_agencias,
            qtd_pas,
            qtd_uns,
            qtd_pracas,
            qtd_agencias_sem_be,
            qtd_pas_sem_be,
            qtd_uns_sem_be,
            qtd_pracas_sem_be
        FROM 
            TESTE.ESTRUTURAS_USER
        WHERE 
            user_id = p_user_id;
    END IF;
END //
DELIMITER ; 