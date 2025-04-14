-- Criação da tabela ACAO_DIARIA_CONTAS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ACAO_DIARIA_CONTAS' AND schema_id = SCHEMA_ID('teste'))
BEGIN
    CREATE TABLE teste..ACAO_DIARIA_CONTAS (
        ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        CHAVE_LOJA NVARCHAR(20) NOT NULL,
        NOME_LOJA NVARCHAR(100) NOT NULL,
        TELEFONE NVARCHAR(20),
        CONTATO NVARCHAR(100),
        USER_ID UNIQUEIDENTIFIER NOT NULL,  -- Usuário responsável pela ação
        QTD_CONTAS_PLATAFORMA INT DEFAULT 0,  -- Quantidade de contas na plataforma nova
        QTD_CONTAS_LEGADO INT DEFAULT 0,  -- Quantidade de contas no sistema legado
        AGENCIA NVARCHAR(20),  -- Código da agência vinculada
        SITUACAO NVARCHAR(30) NOT NULL DEFAULT 'Pendente' CHECK (SITUACAO IN ('Pendente', 'Em Andamento', 'Concluída', 'Atrasada')),
        DESCRIACAO_SITUACAO NVARCHAR(200),  -- Descrição detalhada da situação
        DATA_LIMITE DATETIME NOT NULL,  -- Data limite para a ação
        DATA_CRIACAO DATETIME DEFAULT GETDATE(),
        DATA_ATUALIZACAO DATETIME DEFAULT GETDATE(),
        DATA_CONCLUSAO DATETIME,  -- Data de conclusão da ação (se concluída)
        OBSERVACOES NVARCHAR(MAX),  -- Observações adicionais
        PRIORIDADE NVARCHAR(10) DEFAULT 'Media' CHECK (PRIORIDADE IN ('Alta', 'Media', 'Baixa')),
        TIPO_ACAO NVARCHAR(50) DEFAULT 'Migração de Contas' CHECK (TIPO_ACAO IN ('Migração de Contas', 'Regularização', 'Ativação de PDV', 'Outro')),
        OUTRO_TIPO_DESCRICAO NVARCHAR(100),  -- Descrição quando TIPO_ACAO = 'Outro'
        PRECISA_VISITA BIT DEFAULT 0,  -- Se a ação requer visita presencial
        STATUS_TABLET NVARCHAR(20),  -- Status do tablet no PDV
        ENDERECO NVARCHAR(200),  -- Endereço do PDV
        TRATATIVA NVARCHAR(MAX),  -- Detalhes da tratativa realizada
        CREATED_AT DATETIME DEFAULT GETDATE(),
        UPDATED_AT DATETIME DEFAULT GETDATE()
    );
    
    PRINT 'Tabela ACAO_DIARIA_CONTAS criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela ACAO_DIARIA_CONTAS já existe.';
END

-- Inserir dados de exemplo para a tabela ACAO_DIARIA_CONTAS
IF NOT EXISTS (SELECT TOP 1 * FROM teste..ACAO_DIARIA_CONTAS)
BEGIN
    -- Obter o ID do usuário admin para associar às ações
    DECLARE @AdminUserId UNIQUEIDENTIFIER;
    SELECT @AdminUserId = id FROM teste..users WHERE funcional = '9444168'; -- ID do usuário admin (Igor Alencar)
    
    -- Ação 1: Migração de contas da Loja Centro
    INSERT INTO teste..ACAO_DIARIA_CONTAS (
        CHAVE_LOJA, NOME_LOJA, TELEFONE, CONTATO, USER_ID, 
        QTD_CONTAS_PLATAFORMA, QTD_CONTAS_LEGADO, AGENCIA, 
        SITUACAO, DESCRIACAO_SITUACAO, DATA_LIMITE, 
        PRIORIDADE, TIPO_ACAO, ENDERECO
    )
    VALUES (
        '5001', 'Loja Centro', '(11) 3456-7890', 'João Silva', @AdminUserId,
        2, 5, '0001',
        'Pendente', '5 contas abertas no sistema legado precisam ser migradas para a nova plataforma', DATEADD(day, 3, GETDATE()),
        'Alta', 'Migração de Contas', 'Av. Paulista, 1000 - Centro, São Paulo/SP'
    );
    
    -- Ação 2: Regularização na Loja Shopping Vila Olímpia
    INSERT INTO teste..ACAO_DIARIA_CONTAS (
        CHAVE_LOJA, NOME_LOJA, TELEFONE, CONTATO, USER_ID, 
        QTD_CONTAS_PLATAFORMA, QTD_CONTAS_LEGADO, AGENCIA, 
        SITUACAO, DESCRIACAO_SITUACAO, DATA_LIMITE, 
        PRIORIDADE, TIPO_ACAO, ENDERECO
    )
    VALUES (
        '5002', 'Loja Shopping Vila Olímpia', '(11) 3456-7891', 'Maria Santos', @AdminUserId,
        8, 0, '0002',
        'Em Andamento', 'Regularização de documentação pendente para 3 contas', DATEADD(day, 5, GETDATE()),
        'Media', 'Regularização', 'Shopping Vila Olímpia, Loja 42 - São Paulo/SP'
    );
    
    -- Ação 3: Ativação de PDV da Loja Campinas Shopping
    INSERT INTO teste..ACAO_DIARIA_CONTAS (
        CHAVE_LOJA, NOME_LOJA, TELEFONE, CONTATO, USER_ID, 
        QTD_CONTAS_PLATAFORMA, QTD_CONTAS_LEGADO, AGENCIA, 
        SITUACAO, DESCRIACAO_SITUACAO, DATA_LIMITE, 
        PRIORIDADE, TIPO_ACAO, ENDERECO, PRECISA_VISITA, STATUS_TABLET
    )
    VALUES (
        '5003', 'Loja Campinas Shopping', '(19) 3456-7892', 'Pedro Almeida', @AdminUserId,
        0, 0, '0015',
        'Pendente', 'PDV com tablet inativo, precisa ser configurado', DATEADD(day, 2, GETDATE()),
        'Alta', 'Ativação de PDV', 'Campinas Shopping, Loja 67 - Campinas/SP',
        1, 'Instalado'
    );
    
    -- Ação 4: Ação já concluída
    INSERT INTO teste..ACAO_DIARIA_CONTAS (
        CHAVE_LOJA, NOME_LOJA, TELEFONE, CONTATO, USER_ID, 
        QTD_CONTAS_PLATAFORMA, QTD_CONTAS_LEGADO, AGENCIA, 
        SITUACAO, DESCRIACAO_SITUACAO, DATA_LIMITE, DATA_CONCLUSAO,
        PRIORIDADE, TIPO_ACAO, ENDERECO, TRATATIVA
    )
    VALUES (
        '5006', 'Loja Belo Horizonte', '(31) 3456-7895', 'Ricardo Souza', @AdminUserId,
        12, 0, '0056',
        'Concluída', 'Migração de 10 contas do sistema legado', DATEADD(day, -5, GETDATE()), DATEADD(day, -1, GETDATE()),
        'Media', 'Migração de Contas', 'Av. Afonso Pena, 1500 - Centro, Belo Horizonte/MG',
        'Todas as contas foram migradas com sucesso. Confirmado com o responsável do PDV.'
    );
    
    PRINT 'Dados de exemplo inseridos para ACAO_DIARIA_CONTAS.';
END
ELSE
BEGIN
    PRINT 'Já existem dados na tabela ACAO_DIARIA_CONTAS. Nenhum dado inserido.';
END

-- Criar índices para melhorar performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ACAO_DIARIA_CONTAS_USER_ID' AND object_id = OBJECT_ID('teste..ACAO_DIARIA_CONTAS'))
BEGIN
    CREATE INDEX IX_ACAO_DIARIA_CONTAS_USER_ID ON teste..ACAO_DIARIA_CONTAS (USER_ID);
    PRINT 'Índice para USER_ID criado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ACAO_DIARIA_CONTAS_CHAVE_LOJA' AND object_id = OBJECT_ID('teste..ACAO_DIARIA_CONTAS'))
BEGIN
    CREATE INDEX IX_ACAO_DIARIA_CONTAS_CHAVE_LOJA ON teste..ACAO_DIARIA_CONTAS (CHAVE_LOJA);
    PRINT 'Índice para CHAVE_LOJA criado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ACAO_DIARIA_CONTAS_SITUACAO' AND object_id = OBJECT_ID('teste..ACAO_DIARIA_CONTAS'))
BEGIN
    CREATE INDEX IX_ACAO_DIARIA_CONTAS_SITUACAO ON teste..ACAO_DIARIA_CONTAS (SITUACAO);
    PRINT 'Índice para SITUACAO criado.';
END 