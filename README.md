# Gestão Comercial

## Sobre o Projeto

O Gestão Comercial é uma aplicação completa para gestão de atividades comerciais, focada em oportunidades de negócios como abertura de contas, crédito e seguros. O sistema permite o gerenciamento eficiente de correspondentes bancários, com controle hierárquico e monitoramento de indicadores.

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Banco de Dados**: SQL Server
- **Autenticação**: JWT (JSON Web Token)

## Principais Funcionalidades

- **Dashboard interativo** com métricas e ações pendentes
- **Gestão de Ações Diárias** para acompanhamento de correspondentes
- **Estratégias Comerciais** para diferentes produtos (contas, crédito, seguros)
- **Agenda Comercial** para organização de visitas e compromissos
- **Controle Hierárquico** para gestores, coordenadores e supervisores
- **Relatórios Gerenciais** para tomada de decisões

## Estrutura do Projeto

📁 src/
  📁 backend/         # API REST e conexão com banco de dados
  📁 components/      # Componentes reutilizáveis de UI
  📁 context/         # Contextos React e gerenciamento de estado
  📁 hooks/           # Custom hooks
  📁 pages/           # Páginas da aplicação
  📁 services/        # Serviços para comunicação com API

## Como Executar o Projeto

### Pré-requisitos
- Node.js 16+ e npm instalados
- SQL Server configurado 

### Passos para Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/gestao-comercial.git

# Navegar para o diretório do projeto
cd gestao-comercial

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

### Configuração do Banco de Dados

Para configurar a conexão com o SQL Server usando autenticação do Windows:

1. Abra o arquivo `src/backend/config/db.js`
2. Ajuste o servidor SQL conforme necessário
3. A aplicação tentará usar autenticação Windows automaticamente

## Estrutura de Dados

O sistema trabalha com diversas entidades principais:

- **Usuários**: Gerentes, coordenadores e supervisores organizados hierarquicamente
- **Oportunidades**: Registros de contas a serem abertas ou migradas
- **Ações Diárias**: Tarefas e acompanhamentos para a equipe comercial
- **Eventos**: Agenda de visitas e compromissos

## Equipe de Desenvolvimento

Este projeto está sendo desenvolvido por:
- Igor Alencar
