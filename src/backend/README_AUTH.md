# Sistema de Autenticação Hierárquica com SQL Server

Este sistema implementa autenticação baseada em SQL Server com relações hierárquicas entre usuários (supervisores, coordenadores e gerentes).

## Estrutura do Banco de Dados SQL Server

O sistema utiliza três tabelas principais:

### Tabela `users`

```sql
CREATE TABLE teste..users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(100) NOT NULL,
  funcional NVARCHAR(20) NOT NULL UNIQUE,
  password NVARCHAR(100) NOT NULL, -- Deve ser hash em produção
  role NVARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'coordenador', 'gerente', 'admin')),
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

### Tabela `HOTLIST`

```sql
CREATE TABLE teste..HOTLIST (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  supervisor_id UNIQUEIDENTIFIER NOT NULL,
  CNPJ VARCHAR(20),
  NOME_LOJA VARCHAR(255),
  LOCALIZACAO VARCHAR(255),
  AGENCIA VARCHAR(20),
  MERCADO VARCHAR(100),
  PRACA_PRESENCA VARCHAR(3), -- 'SIM' ou 'NAO'
  situacao VARCHAR(10), -- 'pendente', 'realizar', 'tratada', 'bloqueada'
  DIRETORIA_REGIONAL VARCHAR(255),
  GERENCIA_REGIONAL VARCHAR(255),
  PA VARCHAR(20),
  GERENTE_PJ VARCHAR(255),
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
)
```

## Relações Hierárquicas

- **Admin**: Acesso total ao sistema, pode ver e gerenciar todos os registros.
- **Gerente**: Nível mais alto, pode ter múltiplos coordenadores como subordinados.
- **Coordenador**: Nível intermediário, reporta a um gerente e tem múltiplos supervisores como subordinados.
- **Supervisor**: Nível mais baixo, reporta a um coordenador.

## Implementação

### Frontend

1. **AuthContext**: Fornece autenticação do usuário e carrega informações hierárquicas.
2. **HierarchyViewer**: Componente para visualizar a hierarquia do usuário atual.
3. **HotList**: Componente para visualizar e gerenciar registros da HOTLIST com base nas permissões.

### Backend (API)

1. **Login**: Autenticação baseada em funcional e senha.
2. **Subordinates**: Retorna os subordinados de um usuário.
3. **Superior**: Retorna o superior direto de um usuário.
4. **Hotlist**: Endpoints para gerenciar registros da HOTLIST com controle de acesso baseado em hierarquia.

## Dados de Exemplo

```sql
-- Inserindo usuários
INSERT INTO users (id, name, funcional, password, role, email) VALUES
  ('A31307DE-0D55-4F2F-A5F0-19406035A5BB', 'Igor Alencar', '9444168', '1', 'admin', 'igor.alencar@example.com'),
  ('13651188-7289-4C4B-A509-1A2AD65B486F', 'Ana Costa', '98765', '1', 'supervisor', 'ana.costa@example.com'),
  ('78400BF4-00FF-474D-A8AE-2C215C1DA76B', 'Maria Santos', '67890', '1', 'coordenador', 'maria.santos@example.com'),
  ('8ABD1646-FEC3-4AD3-B130-5D4A961365DB', 'João Silva', '12345', '1', 'supervisor', 'joao.silva@example.com'),
  ('3920E267-F03D-4F6E-B903-D00AD67C580D', 'Carlos Oliveira', '54321', '1', 'gerente', 'carlos.oliveira@example.com');

-- Criando relações hierárquicas
INSERT INTO hierarchy (id, subordinate_id, superior_id) VALUES
  ('F3369283-976D-4DC6-98BB-1774795CC205', '13651188-7289-4C4B-A509-1A2AD65B486F', '78400BF4-00FF-474D-A8AE-2C215C1DA76B'),
  ('B4065679-5B9D-4894-9104-17C59B88A6B2', '8ABD1646-FEC3-4AD3-B130-5D4A961365DB', '78400BF4-00FF-474D-A8AE-2C215C1DA76B'),
  ('C5176790-6C0E-49A5-A215-28D6A099B7C3', '78400BF4-00FF-474D-A8AE-2C215C1DA76B', '3920E267-F03D-4F6E-B903-D00AD67C580D');

-- Inserindo dados na HOTLIST
INSERT INTO HOTLIST (id, supervisor_id, CNPJ, NOME_LOJA, LOCALIZACAO, AGENCIA, MERCADO, PRACA_PRESENCA, situacao, DIRETORIA_REGIONAL, GERENCIA_REGIONAL, PA, GERENTE_PJ) VALUES
  ('739F06F5-7056-4152-A66E-5D68C15C6819', '13651188-7289-4C4B-A509-1A2AD65B486F', '12.345.678/0001-99', 'Supermercado Central', 'São Paulo - SP', '0001', 'Supermercado', 'SIM', 'pendente', 'DR São Paulo', 'GR Centro', 'PA 001', 'João Silva'),
  ('DD5510E6-69B4-4D1E-B848-0125B32DAB8E', '8ABD1646-FEC3-4AD3-B130-5D4A961365DB', '23.456.789/0001-88', 'Mercado do Bairro', 'São Paulo - SP', '0002', 'Mercado', 'NAO', 'realizar', 'DR São Paulo', 'GR Sul', 'PA 002', 'Maria Santos');
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
