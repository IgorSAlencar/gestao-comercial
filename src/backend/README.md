# Backend do Sistema Bradesco Express Gestão Pro

Este diretório contém o servidor backend para o sistema Bradesco Express Gestão Pro, responsável por fornecer APIs para autenticação, gerenciamento de usuários, eventos e dados de oportunidades comerciais.

## Estrutura

- `server.js` - Servidor Express principal que define as rotas e middlewares
- `setup_oportunidades_contas.sql` - Script SQL para criação e população da tabela de oportunidades de contas

## Tecnologias Utilizadas

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web para Node.js
- **SQL Server** - Banco de dados relacional para armazenamento de dados
- **JWT** - Autenticação baseada em tokens

## Configuração do Banco de Dados

O sistema utiliza SQL Server como banco de dados. A configuração da conexão está definida no arquivo `server.js`:

```javascript
// SQL Server configuration
const dbConfig = {
  server: 'DESKTOP-G4V6794', // Seu servidor
  database: 'TESTE',         // Seu banco de dados
  user: 'sa',                // Seu usuário 
  password: 'expresso',      // Sua senha
  options: {
    encrypt: false,          // Para conexões locais, defina como false
    trustServerCertificate: true, // Para desenvolvimento local
    enableArithAbort: true
  }
};
```

### Importante: Adapte a configuração acima para seu ambiente!

## Configuração Inicial

Para configurar o ambiente pela primeira vez, siga os passos abaixo:

1. **Instale o Node.js e npm**:
   - Baixe e instale de [nodejs.org](https://nodejs.org/)

2. **Instale as dependências**:
   ```bash
   npm install express cors body-parser jsonwebtoken mssql
   ```

3. **Configure o SQL Server**:
   - Certifique-se de que o SQL Server está instalado e rodando
   - Crie um banco de dados chamado `TESTE` (ou altere no arquivo de configuração)
   - Atualize as credenciais no arquivo `server.js` conforme necessário

4. **Execute os scripts SQL**:
   - Execute o script `setup_oportunidades_contas.sql` no seu SQL Server:
     ```bash
     # Usando sqlcmd (ajuste as credenciais conforme necessário)
     sqlcmd -S DESKTOP-G4V6794 -U sa -P expresso -d TESTE -i setup_oportunidades_contas.sql
     ```
     ou use SQL Server Management Studio para executar o script.

## Iniciando o Servidor

Para iniciar o servidor, execute:

```bash
node src/backend/server.js
```

O servidor será iniciado na porta 3001 por padrão. Você pode alterar a porta no arquivo `server.js`.

## Estrutura do Banco de Dados

### Tabelas Principais

1. **users** - Armazena informações de usuários do sistema
2. **hierarchy** - Define relacionamentos hierárquicos entre usuários
3. **EVENTOS** - Armazena eventos e atividades registradas no sistema
4. **oportunidades_contas** - Armazena informações sobre oportunidades de negócio

### Tabela oportunidades_contas

A tabela `oportunidades_contas` armazena dados relacionados às oportunidades de negócio para diferentes estratégias comerciais (abertura de contas, crédito, seguros, etc.). Os campos principais incluem:

- **ID** - Identificador único do registro (UNIQUEIDENTIFIER)
- **CHAVE_LOJA** - Identificador exclusivo da loja/PDV (NVARCHAR(20))
- **CNPJ** - CNPJ da loja (NVARCHAR(20))
- **NOME_LOJA** - Nome fantasia da loja (NVARCHAR(100))
- **SITUACAO** - Situação atual da loja: 'ativa', 'bloqueada', 'em processo de encerramento'
- **MES_M3, MES_M2, MES_M1, MES_M0** - Métricas de produção dos últimos 4 meses
- **TENDENCIA** - Tendência de desempenho: 'queda', 'atencao', 'estavel', 'comecando'
- **TIPO_ESTRATEGIA** - Tipo de estratégia associada ao registro ('abertura-conta', 'credito', 'seguro')
- Outros campos com informações detalhadas da loja e contatos

O script `setup_oportunidades_contas.sql` cria esta tabela se ela não existir e insere dados de exemplo.

## APIs Disponíveis

### Autenticação

- `POST /api/auth/login` - Autentica um usuário e retorna um token JWT

### Usuários e Hierarquia

- `GET /api/users/:userId/subordinates` - Retorna subordinados de um usuário
- `GET /api/users/:userId/superior` - Retorna o superior de um usuário
- `GET /api/users/:userId/supervisors` - Retorna supervisores para um gerente/coordenador

### Eventos

- `GET /api/events` - Lista eventos
- `GET /api/events/:eventId` - Retorna detalhes de um evento específico
- `POST /api/events` - Cria um novo evento
- `PUT /api/events/:eventId` - Atualiza um evento existente
- `PATCH /api/events/:eventId/feedback` - Atualiza feedback/tratativa de um evento
- `DELETE /api/events/:eventId` - Exclui um evento

### Oportunidades de Contas

- `GET /api/oportunidades-contas` - Retorna dados de oportunidades conforme o tipo de estratégia
- `GET /api/check-table` - Endpoint de diagnóstico para verificar a existência da tabela (somente para desenvolvimento)

## Solução de Problemas

### Verificando a Tabela oportunidades_contas

Você pode verificar se a tabela foi criada corretamente acessando:

```
http://localhost:3001/api/check-table
```

Esta rota retornará informações sobre a existência da tabela e alguns registros de exemplo.

### Problemas Comuns

1. **Erro de conexão com o banco**: 
   - Verifique se o SQL Server está em execução
   - Confirme se as credenciais estão corretas no arquivo `server.js`
   - Verifique se o banco de dados `TESTE` existe

2. **Tabela oportunidades_contas não encontrada**:
   - Execute novamente o script `setup_oportunidades_contas.sql`
   - Verifique se o script foi executado sem erros

3. **Token de autenticação inválido**:
   - Certifique-se de fazer login corretamente antes de acessar endpoints protegidos
   - Verifique se o token está sendo enviado corretamente no header `Authorization`

4. **CORS bloqueando requisições**:
   - Ajuste as configurações de CORS no backend se necessário
   - Durante o desenvolvimento, configuramos CORS para aceitar requisições de qualquer origem

## Segurança

**Importante**: O código atual usa configurações simplificadas adequadas apenas para desenvolvimento:

- A chave secreta JWT está hardcoded
- O CORS está configurado para aceitar requisições de qualquer origem
- As credenciais do banco de dados estão no código-fonte

Para um ambiente de produção, estas configurações devem ser revistas e ajustadas para maior segurança.

## Próximos Passos / Melhorias

1. Mover configurações sensíveis (chaves JWT, credenciais de banco) para variáveis de ambiente
2. Implementar validação de entrada em todas as rotas
3. Adicionar logging detalhado para facilitar depuração
4. Implementar testes automatizados
5. Restringir políticas de CORS para apenas origens específicas em produção 