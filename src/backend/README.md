# Backend do Sistema de Gestão

Este é o backend do sistema de gestão, construído com Node.js, Express e SQL Server. O sistema é modular e inclui várias funcionalidades como autenticação, gestão de eventos, hotlist e mais.

## Documentação Detalhada

- [Autenticação e Hierarquia](./README_AUTH.md)
- [Módulo HOTLIST](./README_HOTLIST.md)
- [Módulo Modular](./README_MODULAR.md)

## Estrutura do Projeto

```
src/backend/
├── config/           # Configurações (banco de dados, etc)
├── middleware/       # Middlewares (autenticação, etc)
├── routes/          # Rotas da API
│   ├── auth.js      # Rotas de autenticação
│   ├── users.js     # Rotas de usuários
│   ├── events.js    # Rotas de eventos
│   ├── hotlist.js   # Rotas de hotlist
│   └── ...
├── services/        # Serviços e lógica de negócio
├── migrations/      # Scripts de migração do banco
└── server-modular.js # Arquivo principal do servidor
```

## Configuração do Ambiente

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```env
DB_SERVER=localhost
DB_NAME=TESTE
DB_USER=sa
DB_PASSWORD=expresso
JWT_SECRET=seu_secret_aqui
```

3. Inicie o servidor:
```bash
node src/backend/server-modular.js
```

## Módulos Principais

### 1. Autenticação e Autorização
- Sistema de login baseado em JWT
- Controle de acesso baseado em papéis
- Hierarquia de usuários
- [Mais detalhes](./README_AUTH.md)

### 2. Gestão de Eventos
- CRUD completo de eventos
- Filtros e pesquisa
- Tratativas e feedback
- Controle de acesso hierárquico

### 3. HotList
- Gestão de estabelecimentos
- Controle de situações
- Permissões hierárquicas
- [Mais detalhes](./README_HOTLIST.md)

## Banco de Dados

O sistema utiliza SQL Server com as seguintes tabelas principais:
- `users` - Usuários e seus papéis
- `hierarchy` - Relações hierárquicas
- `EVENTOS` - Registro de eventos
- `HOTLIST` - Lista de estabelecimentos

## Desenvolvimento

### Adicionando Novas Funcionalidades

1. Crie os arquivos necessários seguindo a estrutura do projeto
2. Implemente as rotas e serviços
3. Atualize a documentação relevante
4. Teste com diferentes níveis de usuário

### Padrões de Código

- Use async/await para operações assíncronas
- Implemente tratamento de erros consistente
- Documente novas funcionalidades
- Mantenha a estrutura modular

## Suporte

Para mais informações:
1. Consulte a documentação específica de cada módulo
2. Verifique os logs em caso de erros
3. Contate a equipe de desenvolvimento 