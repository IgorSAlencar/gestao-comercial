CREATE TABLE TESTE..USUARIO_ESTRUTURA_RELACAO (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,      -- ID do usuário (supervisor)
    estrutura_id VARCHAR(50) NOT NULL, -- ID da estrutura (agência, PA, etc)
    tipo_estrutura VARCHAR(20) NOT NULL CHECK (tipo_estrutura IN ('agencia', 'pa', 'un', 'praca')),
    tem_be BIT DEFAULT 1,              -- Indica se a estrutura tem BE
    ativo BIT DEFAULT 1,               -- Indica se a relação está ativa
    
    -- Metadados
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),

    -- Índices para busca rápida
    INDEX idx_user_id (user_id),
    INDEX idx_estrutura_id (estrutura_id),
    INDEX idx_tipo (tipo_estrutura),
    
    -- Restrição de unicidade para evitar duplicatas
    CONSTRAINT uk_user_estrutura UNIQUE (user_id, estrutura_id)
);
