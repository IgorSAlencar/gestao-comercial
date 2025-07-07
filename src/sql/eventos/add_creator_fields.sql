-- Adicionar campos de criador de evento
ALTER TABLE TESTE..EVENTOS 
ADD creator_id UNIQUEIDENTIFIER NULL,
    creator_name NVARCHAR(100) NULL;

-- Adicionar foreign key para o criador
ALTER TABLE TESTE..EVENTOS
ADD CONSTRAINT FK_EVENTOS_creator_id
FOREIGN KEY (creator_id) REFERENCES TESTE..users(id);

-- Atualizar os eventos existentes para ter o mesmo criador que o supervisor
UPDATE TESTE..EVENTOS
SET creator_id = supervisor_id,
    creator_name = (SELECT name FROM TESTE..users WHERE id = supervisor_id);

PRINT 'Campos de criador adicionados à tabela EVENTOS'; 