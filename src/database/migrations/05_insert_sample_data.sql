-- Inserir alguns dados de exemplo
-- Primeiro, vamos criar algumas estruturas para usuários

-- Para o usuário com ID 'user1' (Presumindo que seja um supervisor)
INSERT INTO TESTE.USUARIO_ESTRUTURA_RELACAO 
(user_id, estrutura_id, tipo_estrutura, tem_be, ativo) 
VALUES
('user1', 'ag001', 'agencia', TRUE, TRUE),
('user1', 'ag002', 'agencia', TRUE, TRUE),
('user1', 'ag003', 'agencia', FALSE, TRUE),
('user1', 'pa001', 'pa', TRUE, TRUE),
('user1', 'pa002', 'pa', FALSE, TRUE),
('user1', 'pa003', 'pa', TRUE, TRUE),
('user1', 'pa004', 'pa', TRUE, TRUE),
('user1', 'un001', 'un', TRUE, TRUE);

-- Para o usuário com ID 'user2' (Presumindo que seja outro supervisor)
INSERT INTO TESTE.USUARIO_ESTRUTURA_RELACAO 
(user_id, estrutura_id, tipo_estrutura, tem_be, ativo) 
VALUES
('user2', 'ag004', 'agencia', TRUE, TRUE),
('user2', 'ag005', 'agencia', FALSE, TRUE),
('user2', 'pa005', 'pa', TRUE, TRUE),
('user2', 'pa006', 'pa', FALSE, TRUE),
('user2', 'pa007', 'pa', TRUE, TRUE),
('user2', 'pa008', 'pa', TRUE, TRUE),
('user2', 'un002', 'un', FALSE, TRUE),
('user2', 'praca001', 'praca', TRUE, TRUE);

-- Para o usuário com ID 'user3' (Presumindo que seja outro supervisor)
INSERT INTO TESTE.USUARIO_ESTRUTURA_RELACAO 
(user_id, estrutura_id, tipo_estrutura, tem_be, ativo) 
VALUES
('user3', 'ag006', 'agencia', TRUE, TRUE),
('user3', 'ag007', 'agencia', TRUE, TRUE),
('user3', 'ag008', 'agencia', TRUE, TRUE),
('user3', 'pa009', 'pa', TRUE, TRUE),
('user3', 'pa010', 'pa', FALSE, TRUE),
('user3', 'pa011', 'pa', TRUE, TRUE),
('user3', 'pa012', 'pa', TRUE, TRUE);

-- Executar a procedure para atualizar as contagens para cada usuário
CALL TESTE.atualizar_contagem_estruturas('user1');
CALL TESTE.atualizar_contagem_estruturas('user2');
CALL TESTE.atualizar_contagem_estruturas('user3'); 