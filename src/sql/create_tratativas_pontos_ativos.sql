-- Script para criar tabela de tratativas de pontos ativos
-- Execute este script no seu banco de dados

-- Criação da tabela de tratativas de pontos ativos
IF NOT EXISTS (
    SELECT 1
    FROM sysobjects
    WHERE name = 'tratativas_pontos_ativos'
      AND xtype = 'U'
)
BEGIN
    CREATE TABLE TESTE..tratativas_pontos_ativos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        chave_loja VARCHAR(50) NOT NULL,
        usuario_id VARCHAR(100) NOT NULL,
        nome_usuario VARCHAR(200) NOT NULL,
        data_contato DATE NOT NULL,
        foi_tratado CHAR(3) NOT NULL CHECK (foi_tratado IN ('sim', 'nao')),
        descricao_tratativa VARCHAR(MAX) NOT NULL,
        quando_volta_operar DATE NOT NULL,
        situacao VARCHAR(20) DEFAULT 'tratada' CHECK (situacao IN ('tratada', 'pendente')),
        tipo VARCHAR(50) NOT NULL DEFAULT 'pontos-ativos',
        data_registro DATETIME NOT NULL DEFAULT GETDATE(),
        data_atualizacao DATETIME DEFAULT GETDATE(),
        ativo BIT NOT NULL DEFAULT 1
    );
END;



-- Inserir dados de exemplo (opcional - remover em produção)
/*
INSERT INTO TESTE..tratativas_pontos_ativos (
    chave_loja, 
    usuario_id, 
    nome_usuario, 
    data_contato, 
    foi_tratado, 
    descricao_tratativa, 
    quando_volta_operar,
    tipo
) VALUES 
(
    '5001', 
    'user123', 
    'João Silva', 
    '2024-01-15', 
    'sim', 
    'Contato realizado com sucesso. Cliente informou problemas técnicos no sistema.', 
    '2024-01-25',
    'pontos-ativos'
);
*/

PRINT 'Tabela TESTE..tratativas_pontos_ativos criada com sucesso!';
