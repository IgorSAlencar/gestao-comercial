
# Sistema de Autenticação Hierárquica

Este sistema implementa autenticação baseada em SQL com relações hierárquicas entre usuários (supervisores, coordenadores e gerentes).

## Estrutura do Banco de Dados

O sistema utiliza duas tabelas principais:

### Tabela `users`

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  funcional VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL, -- Deve ser hash em produção
  role ENUM('supervisor', 'coordenador', 'gerente') NOT NULL,
  email VARCHAR(100)
);
```

### Tabela `hierarchy`

```sql
CREATE TABLE hierarchy (
  id VARCHAR(36) PRIMARY KEY,
  subordinate_id VARCHAR(36) NOT NULL,
  superior_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (subordinate_id) REFERENCES users(id),
  FOREIGN KEY (superior_id) REFERENCES users(id)
);
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
INSERT INTO users VALUES
  (UUID(), 'João Silva', '12345', 'hashed_password', 'supervisor', 'joao.silva@example.com'),
  (UUID(), 'Maria Santos', '67890', 'hashed_password', 'coordenador', 'maria.santos@example.com'),
  (UUID(), 'Carlos Oliveira', '54321', 'hashed_password', 'gerente', 'carlos.oliveira@example.com'),
  (UUID(), 'Ana Costa', '98765', 'hashed_password', 'supervisor', 'ana.costa@example.com');

-- Criando relações: João e Ana reportam a Maria, Maria reporta a Carlos
INSERT INTO hierarchy (id, subordinate_id, superior_id) VALUES
  (UUID(), [joão_id], [maria_id]),
  (UUID(), [ana_id], [maria_id]),
  (UUID(), [maria_id], [carlos_id]);
```

## Como Conectar ao Banco de Dados Real

Para conectar este sistema a um banco MySQL real:

1. Configure o servidor backend com as credenciais corretas do banco.
2. Implemente corretamente o hash de senha para segurança.
3. Substitua o JWT_SECRET por uma variável de ambiente segura.
4. Configure o frontend para apontar para a URL correta da API.
