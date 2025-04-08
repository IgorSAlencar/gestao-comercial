
# Sistema de Autenticação Hierárquica com SQL Server

Este sistema implementa autenticação baseada em SQL Server com relações hierárquicas entre usuários (supervisores, coordenadores e gerentes).

## Estrutura do Banco de Dados SQL Server

O sistema utiliza duas tabelas principais:

### Tabela `users`

```sql
CREATE TABLE teste..users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(100) NOT NULL,
  funcional NVARCHAR(20) NOT NULL UNIQUE,
  password NVARCHAR(100) NOT NULL, -- Deve ser hash em produção
  role NVARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'coordenador', 'gerente')),
  email NVARCHAR(100)
)

```

### Tabela `hierarchy`

```sql
CREATE TABLE teste..hierarchy (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  subordinate_id UNIQUEIDENTIFIER NOT NULL,
  superior_id UNIQUEIDENTIFIER NOT NULL,
  FOREIGN KEY (subordinate_id) REFERENCES users(id),
  FOREIGN KEY (superior_id) REFERENCES users(id)
)
```

## Relações Hierárquicas

- **Gerente**: Nível mais alto, pode ter múltiplos coordenadores como subordinados.
- **Coordenador**: Nível intermediário, reporta a um gerente e tem múltiplos supervisores como subordinados.
- **Supervisor**: Nível mais baixo, reporta a um coordenador.

## Implementação

### Frontend

1. **AuthContext**: Fornece autenticação do usuário e carrega informações hierárquicas.
2. **HierarchyViewer**: Componente para visualizar a hierarquia do usuário atual.

### Backend (API)

1. **Login**: Autenticação baseada em funcional e senha.
2. **Subordinates**: Retorna os subordinados de um usuário.
3. **Superior**: Retorna o superior direto de um usuário.

## Dados de Exemplo

```sql
-- Inserindo usuários
INSERT INTO users (name, funcional, password, role, email) VALUES
  ('João Silva', '12345', 'hashed_password', 'supervisor', 'joao.silva@example.com'),
  ('Maria Santos', '67890', 'hashed_password', 'coordenador', 'maria.santos@example.com'),
  ('Carlos Oliveira', '54321', 'hashed_password', 'gerente', 'carlos.oliveira@example.com'),
  ('Ana Costa', '98765', 'hashed_password', 'supervisor', 'ana.costa@example.com');

-- Criando relações: João e Ana reportam a Maria, Maria reporta a Carlos
INSERT INTO hierarchy (subordinate_id, superior_id) VALUES
  ((SELECT id FROM users WHERE funcional = '12345'), (SELECT id FROM users WHERE funcional = '67890')),
  ((SELECT id FROM users WHERE funcional = '98765'), (SELECT id FROM users WHERE funcional = '67890')),
  ((SELECT id FROM users WHERE funcional = '67890'), (SELECT id FROM users WHERE funcional = '54321'));
```

## Como Conectar ao Banco de Dados SQL Server

Para conectar este sistema a um banco SQL Server:

1. Configure o servidor backend com as credenciais corretas do banco:
   - SERVER = "DESKTOP-G4V6794"
   - DATABASE = "TESTE"
   - USERNAME = "sa"
   - PASSWORD = "expresso"

2. Implemente corretamente o hash de senha para segurança em produção.
3. Substitua o JWT_SECRET por uma variável de ambiente segura.
4. Configure o frontend para apontar para a URL correta da API.

## Instalação de Dependências

Para o backend, precisamos do driver do SQL Server:

```bash
npm install mssql express jsonwebtoken cors body-parser
```
