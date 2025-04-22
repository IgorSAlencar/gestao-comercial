CREATE TABLE TESTE..ESTRUTURAS_USER (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,  -- ID do usuário
    qtd_total INT DEFAULT 0,       -- Quantidade total de estruturas
    
    -- Quantidades por tipo de estrutura
    qtd_agencias INT DEFAULT 0,
    qtd_pas INT DEFAULT 0,
    qtd_uns INT DEFAULT 0,
    qtd_pracas INT DEFAULT 0,
    
    -- Quantidades de estruturas sem BE (Banco Eletrônico)
    qtd_agencias_sem_be INT DEFAULT 0,
    qtd_pas_sem_be INT DEFAULT 0,
    qtd_uns_sem_be INT DEFAULT 0,
    qtd_pracas_sem_be INT DEFAULT 0,
    
    -- Metadados
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    -- Índice para busca rápida por usuário
    INDEX idx_user_id (user_id)
);
