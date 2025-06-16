# Tratativas de Prospecção

## Visão Geral
O módulo de Tratativas de Prospecção é responsável por gerenciar o registro e acompanhamento de visitas de prospecção realizadas pelos supervisores. Este sistema permite registrar os CNPJs visitados, seu status de prospecção e observações relacionadas.

## Estrutura do Banco de Dados

### Tabela: TESTE..TRATATIVAS_PROSPECAO
```sql
CREATE TABLE TESTE..TRATATIVAS_PROSPECAO (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    ID_EVENTO VARCHAR(50) NOT NULL,
    ID_USER VARCHAR(50) NOT NULL,
    NOME_USER VARCHAR(100) NOT NULL,
    CNPJ VARCHAR(14) NOT NULL,
    TRATADO BIT NOT NULL DEFAULT 0,
    DESCRICAO TEXT,
    DT_AGENDA DATETIME NOT NULL,
    DT_TRATATIVA DATETIME NOT NULL DEFAULT GETDATE(),
    DATA_CRIACAO DATETIME NOT NULL DEFAULT GETDATE(),
    DATA_ATUALIZACAO DATETIME NOT NULL DEFAULT GETDATE()
);
```

## Endpoints da API

### 1. Salvar Tratativas de Prospecção
- **Endpoint**: `POST /api/tratativas-prospecao`
- **Autenticação**: Requerida
- **Corpo da Requisição**:
```json
{
    "eventoId": "string",
    "userId": "string",
    "userName": "string",
    "cnpjs": [
        {
            "cnpj": "string",
            "tratado": boolean,
            "descricao": "string"
        }
    ],
    "dtAgenda": "date",
    "dtTratativa": "date"
}
```

### 2. Obter Tratativas por Evento
- **Endpoint**: `GET /api/tratativas-prospecao/:eventoId`
- **Autenticação**: Requerida
- **Resposta**:
```json
{
    "success": true,
    "data": [
        {
            "ID": number,
            "ID_EVENTO": "string",
            "ID_USER": "string",
            "NOME_USER": "string",
            "CNPJ": "string",
            "TRATADO": boolean,
            "DESCRICAO": "string",
            "DT_AGENDA": "date",
            "DT_TRATATIVA": "date"
        }
    ]
}
```

## Funcionalidades

### 1. Registro de Prospecção
- Permite registrar múltiplos CNPJs em uma única visita
- Cada CNPJ pode ser marcado como "Prospectado" ou "Não Prospectado"
- Inclui campo para observações/descrição da visita
- Mantém histórico de data e hora da tratativa

### 2. Consulta de Tratativas
- Busca todas as tratativas relacionadas a um evento específico
- Retorna informações detalhadas de cada CNPJ visitado
- Inclui status de prospecção e observações

### 3. Atualização de Tratativas
- Sistema de upsert para evitar duplicidade de registros
- Atualiza automaticamente a data da última tratativa
- Mantém histórico de criação e atualização

## Integração com o Frontend

O módulo se integra com a página de Agenda (`src/pages/Agenda.tsx`), onde:
- Os dados são exibidos no diálogo de "Adicionar Parecer"
- Permite adicionar/editar CNPJs visitados
- Mostra status de prospecção para cada CNPJ
- Sincroniza com o sistema de eventos principal

## Segurança
- Todas as rotas são protegidas por autenticação
- Validação de dados na entrada
- Sanitização de CNPJs antes do armazenamento
- Transações SQL para garantir integridade dos dados

## Boas Práticas
1. **Formatação de CNPJ**:
   - Remover caracteres especiais antes do armazenamento
   - Manter formato padronizado (14 dígitos)

2. **Tratamento de Erros**:
   - Validação de dados de entrada
   - Mensagens de erro descritivas
   - Log de erros para depuração

3. **Performance**:
   - Índices na tabela para consultas eficientes
   - Transações SQL otimizadas
   - Validações no lado do servidor

## Exemplos de Uso

### Registrar Nova Prospecção
```javascript
fetch('http://localhost:3001/api/tratativas-prospecao', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        eventoId: 'evento-id',
        userId: 'user-id',
        userName: 'Nome do Usuário',
        cnpjs: [
            {
                cnpj: '12345678000199',
                tratado: true,
                descricao: 'Visita realizada com sucesso'
            }
        ],
        dtAgenda: new Date()
    })
});
```

### Consultar Tratativas de um Evento
```javascript
fetch(`http://localhost:3001/api/tratativas-prospecao/${eventoId}`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

## Manutenção e Suporte

### Logs e Monitoramento
- Logs detalhados de operações críticas
- Monitoramento de performance das queries
- Rastreamento de erros e exceções

### Backup e Recuperação
- Backup diário da tabela de tratativas
- Procedimentos de recuperação documentados
- Histórico de alterações mantido

## Próximos Passos e Melhorias Futuras
1. Implementar sistema de métricas e relatórios
2. Adicionar filtros avançados na consulta
3. Desenvolver dashboard de acompanhamento
4. Implementar exportação de dados
5. Adicionar mais validações de negócio 