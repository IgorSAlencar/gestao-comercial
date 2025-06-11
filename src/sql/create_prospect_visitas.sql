-- Criar tabela para armazenar as visitas de prospecção
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PROSPECT_VISITAS')
BEGIN
    CREATE TABLE TESTE..PROSPECT_VISITAS (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        evento_id UNIQUEIDENTIFIER NOT NULL,   -- Referência para o evento relacionado
        supervisor_id UNIQUEIDENTIFIER NOT NULL, -- ID do supervisor responsável
        creator_id UNIQUEIDENTIFIER NOT NULL,    -- ID de quem criou o registro
        data_criacao DATETIME2 NOT NULL DEFAULT GETDATE(),
        data_atualizacao DATETIME2 NULL,
        observacao NVARCHAR(MAX) NULL,         -- Campo para observações adicionais
        
        -- Campos para CNPJs (até 20 empresas visitadas)
        cnpj_1 NVARCHAR(18) NULL,
        cnpj_2 NVARCHAR(18) NULL,
        cnpj_3 NVARCHAR(18) NULL,
        cnpj_4 NVARCHAR(18) NULL,
        cnpj_5 NVARCHAR(18) NULL,
        cnpj_6 NVARCHAR(18) NULL,
        cnpj_7 NVARCHAR(18) NULL,
        cnpj_8 NVARCHAR(18) NULL,
        cnpj_9 NVARCHAR(18) NULL,
        cnpj_10 NVARCHAR(18) NULL,
        cnpj_11 NVARCHAR(18) NULL,
        cnpj_12 NVARCHAR(18) NULL,
        cnpj_13 NVARCHAR(18) NULL,
        cnpj_14 NVARCHAR(18) NULL,
        cnpj_15 NVARCHAR(18) NULL,
        cnpj_16 NVARCHAR(18) NULL,
        cnpj_17 NVARCHAR(18) NULL,
        cnpj_18 NVARCHAR(18) NULL,
        cnpj_19 NVARCHAR(18) NULL,
        cnpj_20 NVARCHAR(18) NULL,
        
        -- Registros para auditoria
        ativo BIT NOT NULL DEFAULT 1
    );

    -- Criar índice para pesquisas por evento
    CREATE INDEX IX_PROSPECT_VISITAS_EVENTO_ID ON TESTE..PROSPECT_VISITAS(evento_id);
    
    -- Criar índice para pesquisas por supervisor
    CREATE INDEX IX_PROSPECT_VISITAS_SUPERVISOR_ID ON TESTE..PROSPECT_VISITAS(supervisor_id);
    
    -- Criar índice para auditorias por data de criação
    CREATE INDEX IX_PROSPECT_VISITAS_DATA_CRIACAO ON TESTE..PROSPECT_VISITAS(data_criacao);
    
    PRINT 'Tabela PROSPECT_VISITAS criada com sucesso';
END
ELSE
BEGIN
    PRINT 'Tabela PROSPECT_VISITAS já existe';
END

-- Criação de procedure para inserir visitas de prospecção
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_INSERT_PROSPECT_VISITA')
    DROP PROCEDURE SP_INSERT_PROSPECT_VISITA;
GO

CREATE PROCEDURE SP_INSERT_PROSPECT_VISITA
    @evento_id UNIQUEIDENTIFIER,
    @supervisor_id UNIQUEIDENTIFIER,
    @creator_id UNIQUEIDENTIFIER,
    @observacao NVARCHAR(MAX) = NULL,
    @cnpj_1 NVARCHAR(18) = NULL,
    @cnpj_2 NVARCHAR(18) = NULL,
    @cnpj_3 NVARCHAR(18) = NULL,
    @cnpj_4 NVARCHAR(18) = NULL,
    @cnpj_5 NVARCHAR(18) = NULL,
    @cnpj_6 NVARCHAR(18) = NULL,
    @cnpj_7 NVARCHAR(18) = NULL,
    @cnpj_8 NVARCHAR(18) = NULL,
    @cnpj_9 NVARCHAR(18) = NULL,
    @cnpj_10 NVARCHAR(18) = NULL,
    @cnpj_11 NVARCHAR(18) = NULL,
    @cnpj_12 NVARCHAR(18) = NULL,
    @cnpj_13 NVARCHAR(18) = NULL,
    @cnpj_14 NVARCHAR(18) = NULL,
    @cnpj_15 NVARCHAR(18) = NULL,
    @cnpj_16 NVARCHAR(18) = NULL,
    @cnpj_17 NVARCHAR(18) = NULL,
    @cnpj_18 NVARCHAR(18) = NULL,
    @cnpj_19 NVARCHAR(18) = NULL,
    @cnpj_20 NVARCHAR(18) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar se já existe um registro para este evento
    DECLARE @existing_id UNIQUEIDENTIFIER;
    SELECT @existing_id = id FROM TESTE..PROSPECT_VISITAS WHERE evento_id = @evento_id AND ativo = 1;
    
    IF @existing_id IS NOT NULL
    BEGIN
        -- Atualizar o registro existente
        UPDATE TESTE..PROSPECT_VISITAS
        SET 
            supervisor_id = @supervisor_id,
            creator_id = @creator_id,
            data_atualizacao = GETDATE(),
            observacao = @observacao,
            cnpj_1 = @cnpj_1,
            cnpj_2 = @cnpj_2,
            cnpj_3 = @cnpj_3,
            cnpj_4 = @cnpj_4,
            cnpj_5 = @cnpj_5,
            cnpj_6 = @cnpj_6,
            cnpj_7 = @cnpj_7,
            cnpj_8 = @cnpj_8,
            cnpj_9 = @cnpj_9,
            cnpj_10 = @cnpj_10,
            cnpj_11 = @cnpj_11,
            cnpj_12 = @cnpj_12,
            cnpj_13 = @cnpj_13,
            cnpj_14 = @cnpj_14,
            cnpj_15 = @cnpj_15,
            cnpj_16 = @cnpj_16,
            cnpj_17 = @cnpj_17,
            cnpj_18 = @cnpj_18,
            cnpj_19 = @cnpj_19,
            cnpj_20 = @cnpj_20
        WHERE id = @existing_id;
        
        SELECT @existing_id AS id;
    END
    ELSE
    BEGIN
        -- Inserir novo registro
        DECLARE @new_id UNIQUEIDENTIFIER = NEWID();
        
        INSERT INTO TESTE..PROSPECT_VISITAS (
            id,
            evento_id,
            supervisor_id,
            creator_id,
            observacao,
            cnpj_1, cnpj_2, cnpj_3, cnpj_4, cnpj_5,
            cnpj_6, cnpj_7, cnpj_8, cnpj_9, cnpj_10,
            cnpj_11, cnpj_12, cnpj_13, cnpj_14, cnpj_15,
            cnpj_16, cnpj_17, cnpj_18, cnpj_19, cnpj_20
        )
        VALUES (
            @new_id,
            @evento_id,
            @supervisor_id,
            @creator_id,
            @observacao,
            @cnpj_1, @cnpj_2, @cnpj_3, @cnpj_4, @cnpj_5,
            @cnpj_6, @cnpj_7, @cnpj_8, @cnpj_9, @cnpj_10,
            @cnpj_11, @cnpj_12, @cnpj_13, @cnpj_14, @cnpj_15,
            @cnpj_16, @cnpj_17, @cnpj_18, @cnpj_19, @cnpj_20
        );
        
        SELECT @new_id AS id;
    END
END
GO

-- Criação de procedure para obter visitas de prospecção
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_GET_PROSPECT_VISITA')
    DROP PROCEDURE SP_GET_PROSPECT_VISITA;
GO

CREATE PROCEDURE SP_GET_PROSPECT_VISITA
    @evento_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        id,
        evento_id,
        supervisor_id,
        creator_id,
        data_criacao,
        data_atualizacao,
        observacao,
        cnpj_1, cnpj_2, cnpj_3, cnpj_4, cnpj_5,
        cnpj_6, cnpj_7, cnpj_8, cnpj_9, cnpj_10,
        cnpj_11, cnpj_12, cnpj_13, cnpj_14, cnpj_15,
        cnpj_16, cnpj_17, cnpj_18, cnpj_19, cnpj_20
    FROM TESTE..PROSPECT_VISITAS
    WHERE evento_id = @evento_id AND ativo = 1;
END
GO 