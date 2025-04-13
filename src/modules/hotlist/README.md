# Módulo Hotlist

Este módulo é responsável por gerenciar a funcionalidade de Hotlist do sistema, permitindo a visualização e gestão de leads/prospects.

## Estrutura do Módulo

```
hotlist/
├── components/           # Componentes reutilizáveis específicos do módulo
│   ├── LeadFilters/     # Componente de filtros para leads
│   ├── LeadStatistics/  # Componente de estatísticas dos leads
│   └── LeadFeedbackDialog/ # Diálogo para atualização de status do lead
├── pages/               # Páginas do módulo
│   ├── HotlistGestao.tsx    # Página principal de gestão
│   ├── HotlistAll.tsx       # Página com todos os leads
│   ├── HotlistProspectados.tsx # Página de leads prospectados
│   └── HotlistTratados.tsx  # Página de leads tratados
├── hooks/               # Hooks específicos do módulo
│   └── useLeads.ts     # Hook para gerenciamento de leads
├── data/               # Dados mockados e constantes
│   └── mockLeads.ts    # Dados de exemplo de leads
├── types/              # Tipos específicos do módulo
├── routes.tsx          # Configuração de rotas do módulo
└── index.ts           # Arquivo de barril para exportações
```

## Componentes Principais

### LeadFilters
Componente que fornece filtros para busca e filtragem de leads por diferentes critérios.

### LeadStatistics
Componente que exibe estatísticas gerais sobre os leads (total, prospectados, tratados, etc.).

### LeadFeedbackDialog
Componente de diálogo para atualização de status e feedback de leads.

## Páginas

### HotlistGestao
Página principal que fornece uma visão geral da gestão de leads, incluindo estatísticas e lista completa.

### HotlistAll
Página que exibe todos os leads do sistema com opções de filtro.

### HotlistProspectados
Página que exibe apenas os leads que já foram prospectados.

### HotlistTratados
Página que exibe apenas os leads que já foram tratados (convertidos ou sem interesse).

## Hooks

### useLeads
Hook principal para gerenciamento de leads, fornecendo:
- Lista de leads filtrada
- Estatísticas
- Funções para atualização de leads

## Como Usar

```tsx
// Exemplo de uso do hook useLeads
import { useLeads } from '@/modules/hotlist';

function MinhaComponente() {
  const { leads, statistics, updateLead } = useLeads({
    filterStatus: ['novo', 'em_contato'],
    searchTerm: 'termo de busca',
    location: 'São Paulo'
  });

  return (
    // ...
  );
}

// Exemplo de uso dos componentes
import { LeadFilters, LeadStatistics } from '@/modules/hotlist';

function MinhaOutraComponente() {
  return (
    <>
      <LeadStatistics
        total={100}
        prospectados={50}
        tratados={30}
        semTratativas={20}
        onViewAll={() => {}}
        onViewProspectados={() => {}}
        onViewTratados={() => {}}
        onViewSemTratativas={() => {}}
      />
      
      <LeadFilters
        onFiltersChange={(filters) => console.log(filters)}
      />
    </>
  );
}
``` 