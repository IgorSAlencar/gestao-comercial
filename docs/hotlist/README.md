# 🎯 Documentação do Sistema HotList

O HotList é um sistema de gestão de leads e tratativas comerciais que permite acompanhar e gerenciar o pipeline de vendas.

## 📋 Visão Geral

O sistema permite:
- **Visualização** de leads em tabela interativa
- **Filtragem** avançada por múltiplos critérios  
- **Gestão de tratativas** com histórico completo
- **Controle de status** do pipeline comercial
- **Relatórios gerenciais** por supervisor/equipe

## 📁 Documentação por Categoria

### 🔍 [`/filtros/`](./filtros/)
Sistema de filtros e busca:
- Implementação de filtros por supervisor, mercado, situação
- Correções de bugs relacionados a filtros duplicados
- Melhorias de performance e UX nos dropdowns

### 📝 [`/tratativas/`](./tratativas/)
Sistema de tratativas e acompanhamentos:
- Modal de visualização de histórico de tratativas
- Funcionalidade do botão "olho" visual
- Melhorias na interface dos modais

### 📊 [`/status/`](./status/)
Gestão de status dos leads:
- Simplificação do sistema de 4 para 3 status
- Fluxo de mudança automática de status
- Sincronização entre frontend e backend

## 🔄 Fluxo Principal

```
Lead Pendente → Prospecção → Tratativa → Fechamento
     ↓              ↓           ↓           ↓
   Status:      Status:     Status:    Resultado
  pendente   prospectada   tratada    (sucesso/falha)
```

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + SQL Server
- **Componentes**: shadcn/ui + Radix UI
- **Estado**: TanStack Query para cache

## 📈 Métricas e KPIs

O sistema acompanha:
- Leads pendentes por supervisor
- Taxa de conversão de prospecção → tratativa
- Tempo médio de fechamento
- Performance por equipe/região 