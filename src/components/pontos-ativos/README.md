# Tratativas de Pontos Ativos

Este módulo implementa o sistema de tratativas para pontos ativos, permitindo que os usuários registrem contatos e ações realizadas com estabelecimentos.

## Estrutura de Arquivos

### Frontend
- `TratativaModal-Ativos.tsx` - Modal para registrar novas tratativas
- `PontosAtivosFilters.tsx` - Filtros da tabela de pontos ativos
- `ResumoProducaoPontosAtivos.tsx` - Resumo de produção
- `index.ts` - Arquivo de exportação dos componentes

### Backend
- `routes/tratativasPontosAtivos.js` - Endpoints para CRUD de tratativas
- `sql/create_tratativas_pontos_ativos.sql` - Script de criação da tabela

## Como Usar

### 1. Configuração do Banco de Dados

Execute o script SQL para criar a tabela:

```sql
-- Execute este arquivo no seu banco de dados
src/sql/create_tratativas_pontos_ativos.sql
```

### 2. Registrar uma Tratativa

1. Na página de Pontos Ativos, clique no botão verde "+" ao lado do ponto desejado
2. Preencha o formulário:
   - **Data do Contato**: Data em que foi feito o contato
   - **Foi Tratado**: Sim/Não indicando se o ponto foi tratado
   - **Descrição da Tratativa**: Detalhes da ação realizada
   - **Quando Volta a Operar**: Data prevista para retorno das operações

### 3. Campos Automáticos

O sistema automaticamente captura:
- **Chave da Loja**: Identificação do ponto ativo
- **Usuário**: ID e nome do usuário logado
- **Data de Registro**: Timestamp do registro
- **Tipo**: Sempre "pontos-ativos" para este módulo

## Estrutura da Tabela

```sql
CREATE TABLE TESTE..tratativas_pontos_ativos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chave_loja VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(100) NOT NULL,
    nome_usuario VARCHAR(200) NOT NULL,
    data_contato DATE NOT NULL,
    foi_tratado VARCHAR(3) NOT NULL CHECK (foi_tratado IN ('sim', 'nao')),
    descricao_tratativa TEXT NOT NULL,
    quando_volta_operar DATE NOT NULL,
    situacao VARCHAR(20) DEFAULT 'tratada',
    tipo VARCHAR(50) DEFAULT 'pontos-ativos',
    data_registro DATETIME DEFAULT GETDATE(),
    data_atualizacao DATETIME DEFAULT GETDATE(),
    ativo BIT DEFAULT 1
);
```

## Endpoints da API

### POST /api/tratativas-pontos-ativos
Registra uma nova tratativa.

**Body:**
```json
{
  "chave_loja": "5001",
  "usuario_id": "user123",
  "nome_usuario": "João Silva",
  "data_contato": "2024-01-15",
  "foi_tratado": "sim",
  "descricao_tratativa": "Contato realizado com sucesso...",
  "quando_volta_operar": "2024-01-25",
  "situacao": "tratada",
  "tipo": "pontos-ativos"
}
```

### GET /api/tratativas-pontos-ativos/:chave_loja
Busca tratativas de um ponto específico.

### GET /api/tratativas-pontos-ativos
Busca todas as tratativas com filtros opcionais:
- `usuario_id`: Filtrar por usuário
- `data_inicio` / `data_fim`: Filtrar por período
- `foi_tratado`: Filtrar por status de tratamento
- `situacao`: Filtrar por situação
- `limit` / `offset`: Paginação

## Validações

### Frontend (Zod Schema)
- Data do contato é obrigatória
- Foi tratado deve ser 'sim' ou 'nao'
- Descrição da tratativa é obrigatória (mínimo 1 caractere)
- Data de retorno à operação é obrigatória

### Backend
- Todos os campos obrigatórios devem ser preenchidos
- `foi_tratado` deve ser 'sim' ou 'nao'
- `situacao` deve ser 'tratada' ou 'pendente'
- Validação de autenticação do usuário

## Integração com Auth

O sistema utiliza o contexto de autenticação (`useAuth`) para:
- Capturar dados do usuário logado
- Validar permissões de acesso
- Registrar quem fez cada tratativa

## Exemplo de Uso no Código

```tsx
import { TratativaModal } from '@/components/pontos-ativos/TratativaModal-Ativos';

// Abrir modal
const handleAbrirTratativa = (ponto: DadosPontoAtivo) => {
  setPontoSelecionado(ponto);
  setModalTratativaAberto(true);
};

// Renderizar modal
<TratativaModal
  isOpen={modalTratativaAberto}
  onClose={handleFecharTratativa}
  onSuccess={handleSucessoTratativa}
  pontoAtivo={{
    chaveLoja: pontoSelecionado.chaveLoja,
    nomeLoja: pontoSelecionado.nomeLoja
  }}
/>
```

## Próximos Passos

Para expandir a funcionalidade, considere:

1. **Histórico de Tratativas**: Exibir tratativas anteriores na linha expandida
2. **Relatórios**: Dashboard de tratativas por usuário/período
3. **Notificações**: Alertas para datas de retorno à operação
4. **Workflow**: Estados de aprovação para tratativas
5. **Anexos**: Possibilidade de anexar arquivos às tratativas
