-- Script para corrigir a estrutura da tabela TRATADAS_HOTLIST
-- Este script remove a tabela existente e recria com a estrutura correta

-- Primeiro, remover a tabela se existir
IF OBJECT_ID('TESTE..TRATADAS_HOTLIST', 'U') IS NOT NULL
BEGIN
    DROP TABLE TESTE..TRATADAS_HOTLIST;
    PRINT 'Tabela TRATADAS_HOTLIST removida';
END

-- Criar a nova estrutura da tabela TRATADAS_HOTLIST
CREATE TABLE TESTE..TRATADAS_HOTLIST (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    hotlist_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    data_visita DATETIME NOT NULL,
    tem_perfil_comercial BIT NOT NULL,
    motivo_sem_perfil TEXT NULL,
    aceitou_proposta BIT NULL,
    motivo_nao_efetivacao TEXT NULL,
    situacao VARCHAR(11) NOT NULL, -- 'tratada' ou 'pendente' ou 'prospectada'
    data_tratativa DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (hotlist_id) REFERENCES TESTE..HOTLIST(id),
    FOREIGN KEY (user_id) REFERENCES TESTE..users(id)
);

-- Adicionar índices para melhor performance
CREATE INDEX IX_TRATADAS_HOTLIST_hotlist_id ON TESTE..TRATADAS_HOTLIST(hotlist_id);
CREATE INDEX IX_TRATADAS_HOTLIST_user_id ON TESTE..TRATADAS_HOTLIST(user_id);
CREATE INDEX IX_TRATADAS_HOTLIST_data_visita ON TESTE..TRATADAS_HOTLIST(data_visita);
CREATE INDEX IX_TRATADAS_HOTLIST_tem_perfil_comercial ON TESTE..TRATADAS_HOTLIST(tem_perfil_comercial);
CREATE INDEX IX_TRATADAS_HOTLIST_aceitou_proposta ON TESTE..TRATADAS_HOTLIST(aceitou_proposta);
CREATE INDEX IX_TRATADAS_HOTLIST_situacao ON TESTE..TRATADAS_HOTLIST(situacao);

PRINT 'Tabela TRATADAS_HOTLIST criada com sucesso com a nova estrutura'; 