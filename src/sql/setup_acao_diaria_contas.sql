-- Criação da tabela ACAO_DIARIA_CONTAS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ACAO_DIARIA_CONTAS' AND schema_id = SCHEMA_ID('teste'))
BEGIN
    CREATE TABLE teste..ACAO_DIARIA_CONTAS (
        DATA_CRIACAO DATETIME DEFAULT GETDATE(),
        DATA_ATUALIZACAO DATETIME DEFAULT GETDATE(),
        DATA_LIMITE DATETIME NOT NULL,  -- Data limite para a ação
        ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
		COD_AG INT DEFAULT 0,  
        NOME_AG NVARCHAR(100),
        CHAVE_LOJA NVARCHAR(20) NOT NULL,
        NOME_LOJA NVARCHAR(100) NOT NULL,
        TELEFONE NVARCHAR(20),
        CONTATO NVARCHAR(100),
		
        QTD_TOTAL_MES INT DEFAULT 0,
		QTD_PLATAFORMA_MES INT DEFAULT 0,
		QTD_LEGADO_MES INT DEFAULT 0,
		
		QTD_CONTAS_PLATAFORMA INT DEFAULT 0,  -- Quantidade de contas na plataforma nova
        QTD_CONTAS_LEGADO INT DEFAULT 0,  -- Quantidade de contas no sistema legado

		SITUACAO NVARCHAR(30) NOT NULL DEFAULT 'Pendente' CHECK (SITUACAO IN ('Pendente', 'Em Andamento', 'Concluída', 'Atrasada')),
        DATA_CONCLUSAO DATETIME,  -- Data de conclusão da ação (se concluída)
        
		CONTATADO NVARCHAR(20), -- SIM OU NAO
		MOTIVO_NAO_CONTATADO NVARCHAR(250), --CAIXA POSTAL/LIGACAO REAGENDADA/ OUTRA
		MOTIVO_NAO_USO_PLATAFORMA NVARCHAR(250), --- Resistência em relação a Nova Plataforma/Dificuldades com a leitura da biometria facial/Problemas com a conexão de internet/Problemas com o Corban Connect/Problemas durante a jornada/Outra
		DESCRIACAO_SITUACAO NVARCHAR(200),  -- Descrição detalhada da situação
        TRATATIVA NVARCHAR(MAX),  -- Detalhes da tratativa realizada
        USER_ID UNIQUEIDENTIFIER NOT NULL
    );
    
    PRINT 'Tabela ACAO_DIARIA_CONTAS criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela ACAO_DIARIA_CONTAS já existe.';
END

