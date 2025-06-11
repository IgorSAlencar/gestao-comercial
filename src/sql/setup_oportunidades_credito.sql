-- Criação da tabela oportunidades_contas
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'oportunidades_credito' AND schema_id = SCHEMA_ID('teste'))
BEGIN
    CREATE TABLE teste..oportunidades_credito (
        ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        COD_DR NVARCHAR(20),
        DIR_REGIONAL NVARCHAR(100),
        COD_GR NVARCHAR(20),
        GER_REGIONAL NVARCHAR(100),
        LOCALIZACAO NVARCHAR(200),
        CONTATO NVARCHAR(100),
        TELEFONE NVARCHAR(20),
        DATA_CERTIFICACAO DATETIME,
        STATUS_TABLET NVARCHAR(20) CHECK (STATUS_TABLET IN ('Instalado', 'Retirado', 'S.Tablet')),
        HABILITADO_CONSIGNADO BIT DEFAULT 0,
        HABILITADO_LIME BIT DEFAULT 0,
        HABILITADO_MICROSSEGURO BIT DEFAULT 0,
        COD_AG NVARCHAR(20),
        NOME_AGENCIA NVARCHAR(100),
        CHAVE_PAA NVARCHAR(20),
        NOME_PAA NVARCHAR(100),
        SITUACAO NVARCHAR(30) CHECK (SITUACAO IN ('ativa', 'bloqueada', 'em processo de encerramento')),
        ULT_TRX_CONTABIL DATETIME,
        ULT_TRX_NEGOCIO DATETIME,
        TENDENCIA NVARCHAR(20) CHECK (TENDENCIA IN ('queda', 'atencao', 'estavel', 'comecando')),
        CHAVE_LOJA NVARCHAR(20) NOT NULL,
        CNPJ NVARCHAR(20),
        NOME_LOJA NVARCHAR(100),
        MES_M3 INT DEFAULT 0,
        MES_M2 INT DEFAULT 0,
        MES_M1 INT DEFAULT 0,
        MES_M0 INT DEFAULT 0,
        DATA_BLOQUEIO DATETIME,
        MOTIVO_BLOQUEIO NVARCHAR(MAX),
        DATA_INAUGURACAO DATETIME,
        CREATED_AT DATETIME DEFAULT GETDATE(),
        UPDATED_AT DATETIME DEFAULT GETDATE(),
        USER_ID UNIQUEIDENTIFIER,
        MULTIPLICADOR_RESPONSAVEL NVARCHAR(100),
        NOME_PDV NVARCHAR(100),
        TIPO_ESTRATEGIA NVARCHAR(50) NOT NULL
    );
    
    PRINT 'Tabela oportunidades_contas criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela oportunidades_contas já existe.';
END

-- Inserir dados de exemplo para credito
-- Verificar se já existem dados para não duplicar
IF NOT EXISTS (SELECT TOP 1 * FROM teste..oportunidades_credito WHERE TIPO_ESTRATEGIA = 'credito')
BEGIN
    -- Inserir dados de exemplo com USER_ID associado ao usuário admin
    DECLARE @AdminUserId UNIQUEIDENTIFIER;
    SELECT @AdminUserId = id FROM teste..users WHERE funcional = '9444168'; -- ID do usuário admin (Igor Alencar)
    
    -- Loja 1
    INSERT INTO teste..oportunidades_credito (
        COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
        DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
        COD_AG, NOME_AGENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA, MES_M3, MES_M2, MES_M1, MES_M0,
        SITUACAO, ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, DATA_INAUGURACAO,
        USER_ID, MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
    )
    VALUES (
        'DR001', 'Sudeste', 'GR001', 'São Paulo Centro', 'Av. Paulista, 1000 - Centro, São Paulo/SP',
        'João Silva', '(11) 3456-7890', '2022-10-05', 'Instalado', 1, 0, 1,
        '0001', 'Agência Centro', '5001', '12.345.678/0001-99', 'Loja Centro', 12, 10, 15, 14,
        'ativa', '2023-03-25', '2023-03-27', 'estavel', '2020-05-15',
        @AdminUserId, 'Carlos Oliveira', 'Centro SP', 'credito'
    );
    
    -- Loja 2
    INSERT INTO teste..oportunidades_credito (
        COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
        DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
        COD_AG, NOME_AGENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA, MES_M3, MES_M2, MES_M1, MES_M0,
        SITUACAO, ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, DATA_INAUGURACAO,
        USER_ID, MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
    )
    VALUES (
        'DR001', 'Sudeste', 'GR002', 'São Paulo Zona Sul', 'Shopping Vila Olímpia, Loja 42 - São Paulo/SP',
        'Maria Santos', '(11) 3456-7891', '2022-09-15', 'Instalado', 1, 1, 0,
        '0002', 'Agência Vila Olímpia', '5002', '23.456.789/0001-88', 'Loja Shopping Vila Olímpia', 8, 6, 4, 5,
        'ativa', '2023-03-26', '2023-03-28', 'queda', '2021-11-20',
        @AdminUserId, 'Ana Pereira', 'Vila Olímpia', 'credito'
    );
    
    -- Loja 3
    INSERT INTO teste..oportunidades_credito (
        COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
        DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
        COD_AG, NOME_AGENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA, MES_M3, MES_M2, MES_M1, MES_M0,
        SITUACAO, ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, DATA_INAUGURACAO,
        USER_ID, MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
    )
    VALUES (
        'DR002', 'Interior SP', 'GR003', 'Campinas', 'Campinas Shopping, Loja 67 - Campinas/SP',
        'Pedro Almeida', '(19) 3456-7892', '2022-11-20', 'Instalado', 1, 1, 1,
        '0015', 'Agência Campinas', '5003', '34.567.890/0001-77', 'Loja Campinas Shopping', 5, 7, 9, 13,
        'ativa', '2023-03-25', '2023-03-25', 'comecando', '2019-03-10',
        @AdminUserId, 'Roberto Costa', 'Campinas Shop', 'credito'
    );
    
    -- Loja 4 (bloqueada)
    INSERT INTO teste..oportunidades_credito (
        COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
        DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
        COD_AG, NOME_AGENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA, MES_M3, MES_M2, MES_M1, MES_M0,
        SITUACAO, ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, DATA_INAUGURACAO,
        DATA_BLOQUEIO, MOTIVO_BLOQUEIO, USER_ID, MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
    )
    VALUES (
        'DR003', 'Rio de Janeiro', 'GR004', 'Rio de Janeiro Centro', 'Av. Rio Branco, 156 - Centro, Rio de Janeiro/RJ',
        'Fernanda Lima', '(21) 3456-7893', '2021-05-10', 'Retirado', 0, 0, 0,
        '0032', 'Agência Rio Branco', '5004', '45.678.901/0001-66', 'Loja Rio Branco', 10, 8, 6, 5,
        'bloqueada', '2023-03-01', '2023-03-01', 'queda', '2018-06-05',
        '2023-03-02', 'Bloqueio temporário devido a irregularidades na documentação. Necessário regularização com a gerência regional.',
        @AdminUserId, 'Paulo Mendes', 'Rio Branco', 'credito'
    );
    
    -- Loja 5 (em processo de encerramento)
    INSERT INTO teste..oportunidades_credito (
        COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
        DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
        COD_AG, NOME_AGENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA, MES_M3, MES_M2, MES_M1, MES_M0,
        SITUACAO, ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, DATA_INAUGURACAO,
        USER_ID, MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
    )
    VALUES (
        'DR004', 'Nordeste', 'GR005', 'Salvador', 'Salvador Shopping, Loja 33 - Salvador/BA',
        'Luciana Costa', '(71) 3456-7894', '2020-11-05', 'S.Tablet', 0, 0, 1,
        '0048', 'Agência Salvador', '5005', '56.789.012/0001-55', 'Loja Salvador Shopping', 7, 7, 8, 6,
        'em processo de encerramento', '2023-03-10', '2023-03-15', 'queda', '2017-09-22',
        @AdminUserId, 'Marcos Vieira', 'Salvador Shop', 'credito'
    );
    
    -- Loja 6
    INSERT INTO teste..oportunidades_credito (
        COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
        DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
        COD_AG, NOME_AGENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA, MES_M3, MES_M2, MES_M1, MES_M0,
        SITUACAO, ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, DATA_INAUGURACAO,
        USER_ID, MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
    )
    VALUES (
        'DR005', 'Minas Gerais', 'GR006', 'Belo Horizonte', 'Av. Afonso Pena, 1500 - Centro, Belo Horizonte/MG',
        'Ricardo Souza', '(31) 3456-7895', '2022-07-15', 'Instalado', 1, 1, 1,
        '0056', 'Agência BH Centro', '5006', '67.890.123/0001-44', 'Loja Belo Horizonte', 9, 11, 10, 12,
        'ativa', '2023-03-29', '2023-03-29', 'estavel', '2019-12-10',
        @AdminUserId, 'Camila Rocha', 'BH Centro', 'credito'
    );
    
    PRINT 'Dados de exemplo inseridos para credito.';
END
ELSE
BEGIN
    PRINT 'Já existem dados para credito. Nenhum dado inserido.';
END

-- Criar índices para melhorar performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_oportunidades_contas_tipo_estrategia' AND object_id = OBJECT_ID('teste..oportunidades_credito'))
BEGIN
    CREATE INDEX IX_oportunidades_contas_tipo_estrategia ON teste..oportunidades_credito (TIPO_ESTRATEGIA);
    PRINT 'Índice para TIPO_ESTRATEGIA criado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_oportunidades_contas_user_id' AND object_id = OBJECT_ID('teste..oportunidades_credito'))
BEGIN
    CREATE INDEX IX_oportunidades_contas_user_id ON teste..oportunidades_credito (USER_ID);
    PRINT 'Índice para USER_ID criado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_oportunidades_contas_chave_loja' AND object_id = OBJECT_ID('teste..oportunidades_credito'))
BEGIN
    CREATE INDEX IX_oportunidades_contas_chave_loja ON teste..oportunidades_credito (CHAVE_LOJA);
    PRINT 'Índice para CHAVE_LOJA criado.';
END 