# Correção da Tabela TRATADAS_HOTLIST

## Problema Identificado

O erro ocorreu porque a tabela `TRATADAS_HOTLIST` foi criada com uma estrutura antiga que continha uma coluna `descricao` obrigatória, mas o backend estava tentando inserir dados com uma nova estrutura que não incluía essa coluna.

```
Error: Cannot insert the value NULL into column 'descricao', table 'TESTE.dbo.TRATADAS_HOTLIST'; column does not allow nulls.
```

## Solução

### 1. Executar o Script de Correção

Execute o arquivo `sql/fix_tratadas_hotlist.sql` no seu banco de dados SQL Server. Este script irá:

1. Remover a tabela `TRATADAS_HOTLIST` existente
2. Recriar a tabela com a estrutura correta
3. Adicionar os índices necessários

**⚠️ ATENÇÃO:** Este script irá apagar todos os dados existentes na tabela `TRATADAS_HOTLIST`. Se você tiver dados importantes, faça um backup antes de executar.

### 2. Nova Estrutura da Tabela

A nova estrutura da tabela `TRATADAS_HOTLIST` é:

```sql
CREATE TABLE TESTE..TRATADAS_HOTLIST (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    hotlist_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    data_visita DATETIME NOT NULL,
    tem_perfil_comercial BIT NOT NULL,
    motivo_sem_perfil TEXT NULL,
    aceitou_proposta BIT NULL,
    motivo_nao_efetivacao TEXT NULL,
    situacao VARCHAR(10) NOT NULL, -- 'realizada' ou 'pendente'
    data_tratativa DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (hotlist_id) REFERENCES TESTE..HOTLIST(id),
    FOREIGN KEY (user_id) REFERENCES TESTE..users(id)
);
```

### 3. Alterações Realizadas

#### Backend (`src/backend/routes/hotlist.js`)
- ✅ Já estava correto - usando a nova estrutura

#### Frontend (`src/components/hotlist/TratativaModal.tsx`)
- ✅ Já estava correto - enviando os dados na estrutura correta

#### Tipos TypeScript (`src/services/api.ts`)
- ✅ Atualizada interface `Tratativa` para refletir a nova estrutura

#### Documentação (`src/backend/README_HOTLIST.md`)
- ✅ Atualizada com a nova estrutura da tabela
- ✅ Atualizados exemplos de API

## Como Executar a Correção

### Opção 1: Via SQL Server Management Studio
1. Abra o SQL Server Management Studio
2. Conecte-se ao seu banco de dados
3. Abra o arquivo `sql/fix_tratadas_hotlist.sql`
4. Execute o script

### Opção 2: Via sqlcmd (linha de comando)
```bash
sqlcmd -S SERVIDOR -d TESTE -i sql/fix_tratadas_hotlist.sql
```

### Opção 3: Via Node.js (se preferir)
Você pode criar um script Node.js para executar o SQL:

```javascript
const { sql, poolConnect } = require('./src/backend/config/db');
const fs = require('fs');

async function fixDatabase() {
  try {
    await poolConnect;
    const sqlScript = fs.readFileSync('./sql/fix_tratadas_hotlist.sql', 'utf8');
    await sql.query(sqlScript);
    console.log('Tabela TRATADAS_HOTLIST corrigida com sucesso!');
  } catch (error) {
    console.error('Erro ao corrigir tabela:', error);
  }
}

fixDatabase();
```

## Verificação

Após executar o script, você pode verificar se a correção foi aplicada corretamente:

```sql
-- Verificar a estrutura da tabela
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'TRATADAS_HOTLIST' 
    AND TABLE_SCHEMA = 'dbo'
ORDER BY ORDINAL_POSITION;
```

## Resultado Esperado

Após a correção, o sistema deve funcionar normalmente:
- ✅ Registro de tratativas funcionando
- ✅ Visualização do histórico de tratativas
- ✅ Atualização automática dos status na HotList 