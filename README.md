# Bradesco Express Gestão PRO

Sistema de gestão comercial para supervisores, coordenadores e gerentes do Bradesco Express.

## 📋 Descrição

O Bradesco Express Gestão PRO é uma aplicação web desenvolvida para otimizar a gestão da força comercial do Bradesco Express. O sistema permite o gerenciamento de agendamentos, controle de visitas, acompanhamento de ações diárias e visualização de estatísticas em tempo real.

## 🚀 Funcionalidades

- **Dashboard Personalizado**: Visualização de métricas e informações relevantes baseadas no perfil do usuário
- **Gestão de Agenda**: Criação e acompanhamento de visitas e compromissos comerciais
- **Ações Diárias**: Controle de tarefas diárias com priorização e acompanhamento
- **Visão Gerencial**: Estatísticas e indicadores da equipe para gerentes e coordenadores
- **Gestão de Supervisores**: Monitoramento de agendamentos e atividades dos supervisores
- **Campanhas Comerciais**: Acompanhamento de campanhas ativas

## 💻 Tecnologias Utilizadas

- **Frontend**: React.js, TypeScript, TailwindCSS, Shadcn/UI
- **Gerenciamento de Estado**: React Context API, TanStack Query
- **Roteamento**: React Router
- **Formatação de Data**: date-fns
- **Ícones**: Lucide React

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js (v16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/bradesco-express-gestao-pro.git
   cd bradesco-express-gestao-pro
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Crie o arquivo `.env` na raiz do projeto:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. Acesse a aplicação em: `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
│   ├── ui/             # Componentes de UI básicos
│   └── ...             # Componentes específicos da aplicação
├── context/            # Contextos do React
├── hooks/              # Hooks personalizados
├── lib/                # Utilitários e funções de ajuda
├── pages/              # Páginas da aplicação
├── services/           # Serviços de API e integração
├── types/              # Definições de tipos
└── App.tsx             # Componente principal
```

## 📊 Dados e Estatísticas

### Fonte dos Dados

A aplicação obtém dados de agendamentos e supervisores através dos seguintes serviços:

- `eventApi.getTeamEvents()`: Busca eventos da equipe em um período específico
- `userApi.getSubordinates()`: Busca os supervisores subordinados ao gerente/coordenador
- `userApi.getUsersByRole()`: Busca usuários por papel (admin)

### Estatísticas Calculadas

O sistema calcula e exibe as seguintes estatísticas:

- **Total de Agendamentos**: Todos os agendamentos registrados no período
- **Agendamentos Hoje**: Agendamentos marcados para o dia atual
- **Agendamentos Semana**: Agendamentos marcados para a semana atual
- **Supervisores sem Agenda**: Supervisores que não possuem agendamentos futuros
- **Próximas Visitas**: Próximos compromissos agendados ordenados por data

## 🔒 Autenticação e Segurança

O sistema utiliza autenticação baseada em token JWT. Cada solicitação à API inclui o token no cabeçalho de autorização.

## 👥 Perfis de Usuário

- **Supervisor**: Acesso às suas agendas e ações diárias
- **Coordenador**: Visualiza dados dos supervisores sob sua gestão
- **Gerente**: Visualização completa da equipe e estatísticas gerais
- **Administrador**: Acesso completo ao sistema

## 🛠️ Manutenção e Depuração

### Logs

O sistema registra logs detalhados no console para ajudar na depuração:

- Chamadas à API com status
- Erros de comunicação
- Processamento de dados

### Tratamento de Erros

A aplicação inclui tratamento abrangente de erros para:

- Falhas de comunicação com a API
- Dados ausentes ou inválidos
- Problemas de autenticação

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:

- Desktops
- Tablets
- Smartphones

## 📄 Licença

Este projeto é proprietário e seu uso é restrito aos funcionários e parceiros autorizados do Bradesco.

## 📞 Suporte

Para suporte técnico e dúvidas, entre em contato com a equipe de desenvolvimento pelo e-mail: [email@bradesco.com.br](mailto:email@bradesco.com.br)
