-- View para buscar estruturas por equipe (incluindo subordinados)
CREATE OR REPLACE VIEW TESTE.vw_estruturas_equipe AS
SELECT 
    u.id as gerente_id,
    u.name as gerente_nome,
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
    users u
JOIN 
    user_relationships ur ON u.id = ur.manager_id
JOIN 
    TESTE.USUARIO_ESTRUTURA_RELACAO uer ON ur.user_id = uer.user_id
WHERE 
    uer.ativo = TRUE
    AND (u.role = 'manager' OR u.role = 'coordinator' OR u.role = 'admin')
GROUP BY 
    u.id, u.name; 