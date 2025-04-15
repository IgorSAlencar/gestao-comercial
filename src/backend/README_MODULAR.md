# API Modularizada para Gestão de Eventos

Este projeto contém uma versão modularizada do servidor de API para o sistema de gestão de eventos da Bradesco Express.

## Estrutura de Diretórios

A API foi organizada em módulos separados para facilitar a manutenção:

```
src/backend/
├── config/          # Configurações do sistema
│   └── db.js        # Configuração do banco de dados
├── middleware/      # Middlewares
│   └── auth.js      # Middleware de autenticação
├── routes/          # Rotas da API
│   ├── auth.js      # Rotas de autenticação
│   ├── events.js    # Rotas de eventos
│   ├── oportunidades.js # Rotas de oportunidades
│   └── users.js     # Rotas de usuários
├── db/              # Arquivos relacionados ao banco de dados
│   └── schema.js    # Descrição do schema (apenas documentação)
├── server.js        # Versão original do servidor (não modularizada)
└── server-modular.js # Nova versão modularizada do servidor
```

## Como iniciar o servidor

1. Certifique-se de que o SQL Server está rodando
2. Instale as dependências (se ainda não fez):
   ```
   npm install
   ```
3. Inicie o servidor modularizado:
   ```
   node src/backend/server-modular.js
   ```

## Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login do usuário

### Usuários
- `GET /api/users/:userId/subordinates` - Obtém subordinados de um usuário
- `GET /api/users/:userId/superior` - Obtém o superior de um usuário
- `GET /api/users/:userId/supervisors` - Obtém supervisores para gerente/coordenador

### Eventos
- `GET /api/events` - Lista todos os eventos visíveis para o usuário
- `GET /api/events/:eventId` - Obtém detalhes de um evento específico
- `POST /api/events` - Cria um novo evento
- `PUT /api/events/:eventId` - Atualiza um evento existente
- `PATCH /api/events/:eventId/feedback` - Atualiza apenas o feedback/tratativa de um evento
- `DELETE /api/events/:eventId` - Exclui um evento

### Oportunidades
- `GET /api/oportunidades-contas` - Lista oportunidades de contas
- `GET /api/check-table` - Endpoint de diagnóstico (remover em produção)

## Benefícios da Modularização

1. **Manutenção mais fácil**: Cada módulo tem uma responsabilidade específica
2. **Melhor organização do código**: Separação clara de responsabilidades
3. **Facilidade para testes**: Possibilidade de testar cada módulo isoladamente
4. **Escalabilidade**: Novos recursos podem ser adicionados em módulos separados
5. **Trabalho em equipe**: Diferentes desenvolvedores podem trabalhar em diferentes módulos

## Migração

Para migrar do servidor antigo para o novo, basta começar a usar o `server-modular.js` em vez do `server.js`. Todas as funcionalidades foram preservadas, apenas organizadas de forma mais eficiente. 