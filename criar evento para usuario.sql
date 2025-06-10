USE TESTE;

-- Verificar se a tabela existe
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'eventos')
BEGIN
    -- Verificar se as colunas já existem antes de adicioná-las
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('eventos') AND name = 'creator_id')
    BEGIN
        ALTER TABLE eventos ADD creator_id UNIQUEIDENTIFIER NULL;
        PRINT 'Coluna creator_id adicionada com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'Coluna creator_id já existe.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('eventos') AND name = 'creator_name')
    BEGIN
        ALTER TABLE eventos ADD creator_name NVARCHAR(255) NULL;
        PRINT 'Coluna creator_name adicionada com sucesso.';
    END
    ELSE
    BEGIN
        PRINT 'Coluna creator_name já existe.';
    END
END
ELSE
BEGIN
    PRINT 'A tabela eventos não existe.';
END