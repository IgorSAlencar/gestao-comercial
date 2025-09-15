# Tratativas de Pontos Ativos - Guia de Resolução de Problemas

## Problema Reportado

```
❌ Erro ao registrar tratativa de pontos ativos: TypeError: Cannot read properties of undefined (reading 'port')
```

## Causa do Problema

O erro ocorreu porque a rota `tratativasPontosAtivos.js` estava usando:
- `const sql = require('mssql')` diretamente
- `await sql.connect()` sem configuração

Ao invés de usar a configuração centralizada do projeto.

## Solução Implementada

### 1. Correção da Importação
**Antes:**
```javascript
const sql = require('mssql');
// ...
const pool = await sql.connect(); // ❌ Erro aqui
```

**Depois:**
```javascript
const { sql, pool, poolConnect } = require('../config/db');
// ...
await poolConnect; // ✅ Usa configuração centralizada
```

### 2. Ajustes nos Tipos de Dados
Para ser compatível com as melhorias no SQL:

```javascript
// Ajustado para CHAR(3) ao invés de VARCHAR(3)
request.input('foi_tratado', sql.Char(3), foi_tratado);

// Ajustado para VARCHAR(MAX) ao invés de TEXT
request.input('descricao_tratativa', sql.VarChar(sql.MAX), descricao_tratativa);
```

## Verificações Necessárias

### 1. Executar o Script SQL
Primeiro, execute o script atualizado:
```sql
-- Execute este arquivo:
src/sql/create_tratativas_pontos_ativos.sql
```

### 2. Testar a Conexão
Execute o teste automatizado:
```bash
# No diretório src/backend
node test-tratativas-connection.js

# Ou use o arquivo .bat no Windows
TESTE_TRATATIVAS.bat
```

### 3. Verificar Configuração do Banco
Certifique-se de que o arquivo `src/backend/config/db.js` está configurado corretamente:

```javascript
const config = {
  user: 'seu_usuario',
  password: 'sua_senha',
  server: 'seu_servidor',
  port: 1433, // ⬅️ Este campo era undefined
  database: 'sua_database',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
```

## Estrutura da Tabela Criada

```sql
CREATE TABLE TESTE..tratativas_pontos_ativos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chave_loja VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(100) NOT NULL,
    nome_usuario VARCHAR(200) NOT NULL,
    data_contato DATE NOT NULL,
    foi_tratado CHAR(3) NOT NULL CHECK (foi_tratado IN ('sim', 'nao')),
    descricao_tratativa VARCHAR(MAX) NOT NULL,
    quando_volta_operar DATE NOT NULL,
    situacao VARCHAR(20) DEFAULT 'tratada' CHECK (situacao IN ('tratada', 'pendente')),
    tipo VARCHAR(50) NOT NULL DEFAULT 'pontos-ativos',
    data_registro DATETIME NOT NULL DEFAULT GETDATE(),
    data_atualizacao DATETIME DEFAULT GETDATE(),
    ativo BIT NOT NULL DEFAULT 1
);
```

## Como Testar

### 1. Via Interface
1. Acesse a página de Pontos Ativos
2. Clique no botão verde "+" ao lado de um ponto
3. Preencha o formulário
4. Clique em "Salvar Tratativa"

### 2. Via API (Postman/curl)
```bash
POST http://localhost:3001/api/tratativas-pontos-ativos
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "chave_loja": "5001",
  "usuario_id": "joao.silva",
  "nome_usuario": "João Silva",
  "data_contato": "2024-01-15",
  "foi_tratado": "sim",
  "descricao_tratativa": "Teste de tratativa",
  "quando_volta_operar": "2024-01-25",
  "situacao": "tratada",
  "tipo": "pontos-ativos"
}
```

## Logs de Depuração

O sistema agora gera logs detalhados:

```bash
✅ Tratativa registrada para ponto ativo 5001 por João Silva (joao.silva)
```

## Possíveis Problemas Adicionais

### 1. Token de Autenticação
Se ainda houver erro, verifique se o token JWT está válido:
```javascript
// No browser console
console.log(localStorage.getItem('token'));
```

### 2. Configuração de CORS
Verifique se o backend permite requisições do frontend:
```javascript
// Em server-modular.js
app.use(cors({
  origin: true,
  credentials: true
}));
```

### 3. Validação de Dados
Certifique-se de que todos os campos obrigatórios estão sendo enviados:
- `chave_loja` ✅
- `usuario_id` ✅  
- `nome_usuario` ✅
- `data_contato` ✅
- `foi_tratado` ✅ ('sim' ou 'nao')
- `descricao_tratativa` ✅
- `quando_volta_operar` ✅

## Arquivos Modificados

1. `src/backend/routes/tratativasPontosAtivos.js` - Correção da conexão
2. `src/sql/create_tratativas_pontos_ativos.sql` - Melhorias na estrutura
3. `src/backend/test-tratativas-connection.js` - Script de teste
4. `src/backend/TESTE_TRATATIVAS.bat` - Comando de teste

## Próximos Passos

Após a correção:
1. Reinicie o servidor backend
2. Execute o teste de conexão
3. Teste via interface
4. Monitore logs para confirmar funcionamento
