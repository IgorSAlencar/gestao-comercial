# Backend do Sistema de Gestão - Módulo HOTLIST

Este módulo implementa a funcionalidade de HOTLIST no sistema, permitindo o gerenciamento de estabelecimentos e suas situações com controle de acesso baseado em hierarquia.

## Estrutura da HOTLIST

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
  situacao VARCHAR(10), -- 'pendente', 'prospectada', 'tratada'
  DIRETORIA_REGIONAL VARCHAR(255),
  GERENCIA_REGIONAL VARCHAR(255),
  PA VARCHAR(20),
  GERENTE_PJ VARCHAR(255),
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
)
```

### Tabela `TRATADAS_HOTLIST`

```sql
CREATE TABLE teste..TRATADAS_HOTLIST (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  hotlist_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  data_visita DATETIME NOT NULL,
  tem_perfil_comercial BIT NOT NULL,
  motivo_sem_perfil TEXT NULL,
  aceitou_proposta BIT NULL,
  motivo_nao_efetivacao TEXT NULL,
  situacao VARCHAR(10) NOT NULL, -- 'tratada' ou 'pendente'
  data_tratativa DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (hotlist_id) REFERENCES HOTLIST(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## Endpoints da API

### GET /api/hotlist/:userId
Retorna os itens da HOTLIST com base nas permissões do usuário.

**Permissões:**
- Admin: Vê todos os registros
- Gerente: Vê registros de toda sua equipe (diretos e indiretos)
- Coordenador: Vê registros dos supervisores subordinados
- Supervisor: Vê apenas seus próprios registros

**Exemplo de Resposta:**
```json
[
  {
    "id": "739F06F5-7056-4152-A66E-5D68C15C6819",
    "supervisor_id": "13651188-7289-4C4B-A509-1A2AD65B486F",
    "CNPJ": "12.345.678/0001-99",
    "NOME_LOJA": "Supermercado Central",
    "LOCALIZACAO": "São Paulo - SP",
    "AGENCIA": "0001",
    "MERCADO": "Supermercado",
    "PRACA_PRESENCA": "SIM",
    "situacao": "prospectada",
    "DIRETORIA_REGIONAL": "DR São Paulo",
    "GERENCIA_REGIONAL": "GR Centro",
    "PA": "PA 001",
    "GERENTE_PJ": "João Silva"
  }
]
```

### PATCH /api/hotlist/:itemId
Atualiza o status de um item da HOTLIST.

**Permissões:**
- Admin: Pode atualizar qualquer registro
- Gerente/Coordenador: Pode atualizar registros de sua equipe
- Supervisor: Pode atualizar apenas seus registros

**Corpo da Requisição:**
```json
{
  "situacao": "tratada"
}
```

### POST /api/hotlist/tratativa
Registra uma nova tratativa para um item da HOTLIST.

**Permissões:**
- Todos os usuários autenticados podem registrar tratativas para itens que têm acesso

**Corpo da Requisição:**
```json
{
  "hotlist_id": "739F06F5-7056-4152-A66E-5D68C15C6819",
  "data_visita": "2024-03-21T00:00:00.000Z",
  "tem_perfil_comercial": "sim",
  "motivo_sem_perfil": null,
  "aceitou_proposta": "sim",
  "motivo_nao_efetivacao": null,
  "situacao": "realizada"
}
```

**Exemplo de Resposta:**
```json
{
  "id": "8F9A2B3C-4D5E-6F7G-8H9I-0J1K2L3M4N5O",
  "hotlist_id": "739F06F5-7056-4152-A66E-5D68C15C6819",
  "user_id": "13651188-7289-4C4B-A509-1A2AD65B486F",
  "data_visita": "2024-03-21T00:00:00.000Z",
  "tem_perfil_comercial": 1,
  "motivo_sem_perfil": null,
  "aceitou_proposta": 1,
  "motivo_nao_efetivacao": null,
  "situacao": "realizada",
  "data_tratativa": "2024-03-21T10:30:00.000Z"
}
```

### GET /api/hotlist/:itemId/tratativas
Retorna o histórico de tratativas de um item da HOTLIST.

**Permissões:**
- Usuários com acesso ao item podem ver suas tratativas

**Exemplo de Resposta:**
```json
[
  {
    "id": "8F9A2B3C-4D5E-6F7G-8H9I-0J1K2L3M4N5O",
    "user_name": "João Silva",
    "data_visita": "2024-03-21T00:00:00.000Z",
    "tem_perfil_comercial": 1,
    "motivo_sem_perfil": null,
    "aceitou_proposta": 1,
    "motivo_nao_efetivacao": null,
    "situacao": "tratada",
    "data_tratativa": "2024-03-21T10:30:00.000Z"
  }
]
```

## Implementação

### Rotas (routes/hotlist.js)
- Implementa os endpoints da API
- Gerencia permissões e acesso
- Valida inputs e retorna respostas apropriadas

### Frontend (pages/Hotlist.tsx)
- Interface para visualização e gestão
- Filtros e pesquisa
- Atualização de status
- Indicadores visuais de situação

## Controle de Acesso

O acesso aos registros é controlado através da tabela `hierarchy` que mapeia as relações entre usuários:

```sql
-- Exemplo de consulta para gerentes (acesso a toda equipe)
SELECT h.*
FROM TESTE..HOTLIST h
WHERE h.supervisor_id = @userId
   OR h.supervisor_id IN (
      SELECT subordinate_id 
      FROM TESTE..hierarchy 
      WHERE superior_id = @userId
   )
   OR h.supervisor_id IN (
      SELECT h2.subordinate_id 
      FROM TESTE..hierarchy h1
      JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
      WHERE h1.superior_id = @userId
   )
```

## Dados de Exemplo

```sql
-- Inserindo registros de exemplo na HOTLIST
INSERT INTO HOTLIST (
  id, supervisor_id, CNPJ, NOME_LOJA, LOCALIZACAO, 
  AGENCIA, MERCADO, PRACA_PRESENCA, situacao, 
  DIRETORIA_REGIONAL, GERENCIA_REGIONAL, PA, GERENTE_PJ
) VALUES
(
  '739F06F5-7056-4152-A66E-5D68C15C6819',
  '13651188-7289-4C4B-A509-1A2AD65B486F',
  '12.345.678/0001-99',
  'Supermercado Central',
  'São Paulo - SP',
  '0001',
  'Supermercado',
  'SIM',
  'prospectada',
  'DR São Paulo',
  'GR Centro',
  'PA 001',
  'João Silva'
);
```

## Integração com Outros Módulos

- **Autenticação**: Utiliza o middleware `authenticateToken`
- **Hierarquia**: Consulta relações da tabela `hierarchy`
- **Usuários**: Referencia a tabela `users` para supervisores

## Logs e Monitoramento

O módulo utiliza o sistema de logs padrão do backend para:
- Erros de acesso
- Atualizações de status
- Performance das consultas
- Tentativas de acesso não autorizado

## Desenvolvimento

### Adicionando Novos Campos
1. Altere a tabela `HOTLIST`
2. Atualize as interfaces TypeScript
3. Modifique as queries SQL
4. Atualize a documentação

### Modificando Permissões
1. Ajuste as queries em `routes/hotlist.js`
2. Atualize a documentação
3. Teste com diferentes níveis de usuário
