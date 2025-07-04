# Módulo de Correspondentes

Este módulo gerencia o sistema de acompanhamento e logs de tratativas com correspondentes bancários.

## 📁 Estrutura de Arquivos

```
src/
├── pages/
│   └── Correspondentes.tsx           # Página principal
├── components/correspondentes/
│   ├── CorrespondentesTable.tsx      # Tabela de correspondentes
│   ├── CorrespondentesFilters.tsx    # Filtros de busca
│   ├── TratativaCorbanModal.tsx      # Modal para nova tratativa
│   ├── ViewTratativasCorbanModal.tsx # Modal para ver histórico
│   └── README.md                     # Esta documentação
└── shared/types/
    └── correspondente.ts             # Tipos e interfaces
```

## 🎯 Funcionalidades

### 1. **Página Principal** (`Correspondentes.tsx`)
- Dashboard com cards de estatísticas
- Listagem completa de correspondentes
- Sistema de filtros hierárquicos
- Integração com todos os componentes

### 2. **Tabela de Correspondentes** (`CorrespondentesTable.tsx`)
- Exibição de dados em formato tabular
- Status visual (ativo/inativo)
- Badges para tratativas
- Botões de ação para cada linha
- Estados de loading e vazio

### 3. **Filtros Avançados** (`CorrespondentesFilters.tsx`)
- Busca textual em múltiplos campos
- Filtros hierárquicos (Diretoria → Gerência → Agência → PA)
- Filtro por status
- Contadores dinâmicos
- Limpeza de filtros

### 4. **Modal de Tratativa** (`TratativaCorbanModal.tsx`)
- Formulário completo para registro de tratativas
- Seções organizadas:
  - Informações básicas
  - Produtos de interesse
  - Avaliação e resultado
  - Observações e acompanhamento
- Validação de campos obrigatórios
- Interface elegante com cards

### 5. **Histórico de Tratativas** (`ViewTratativasCorbanModal.tsx`)
- Visualização cronológica das tratativas
- Cards informativos com todos os dados
- Badges coloridos por resultado
- Estados vazios informativos
- Botão para nova tratativa

## 🔧 Tipos e Interfaces

### Principais Interfaces:
- `Correspondente` - Dados do correspondente
- `TratativaCorban` - Dados da tratativa
- `FilterStateCorrespondente` - Estado dos filtros
- `TratativaFormData` - Dados do formulário

### Constantes:
- `TIPOS_CONTATO` - Opções de tipo de contato
- `OBJETIVOS_VISITA` - Objetivos da visita
- `STATUS_CORRESPONDENTE` - Status do correspondente
- `PRODUTOS_BANCARIOS` - Produtos bancários
- `RESULTADO_TRATATIVA` - Resultados com cores

## 🎨 Design e UX

### Características Visuais:
- **Gradientes**: Azul para roxo nos botões principais
- **Cards**: Bordas coloridas à esquerda
- **Badges**: Cores semânticas (verde=ativo, azul=tratativas, etc.)
- **Icons**: Lucide React consistente
- **Estados Vazios**: Ilustrações elegantes com calls-to-action

### Responsividade:
- Grid adaptativo nos filtros
- Tabela responsiva
- Modais que se ajustam ao conteúdo
- Mobile-first approach

## 🔄 Fluxo de Uso

1. **Visualização**: Lista de correspondentes com filtros
2. **Busca**: Filtros hierárquicos ou busca textual
3. **Ação**: Clique em "Tratativa" para registrar nova
4. **Registro**: Preenche modal com dados da tratativa
5. **Histórico**: Visualiza todas as tratativas do correspondente
6. **Acompanhamento**: Agenda próximos contatos

## 🛠️ Integração Futura

### APIs a Implementar:
- `GET /correspondentes` - Lista correspondentes
- `GET /correspondentes/:id/tratativas` - Histórico
- `POST /tratativas` - Nova tratativa
- `PUT /tratativas/:id` - Editar tratativa

### Melhorias Planejadas:
- Filtros salvos
- Exportação para Excel
- Dashboard analytics
- Notificações de follow-up
- Calendário integrado

## 📊 Dados Mock

O módulo inclui dados mock para desenvolvimento:
- 3 correspondentes exemplo
- 2 tratativas por correspondente
- Estrutura hierárquica completa
- Diversos tipos de contato e resultados

## 🎯 Objetivos de Negócio

Este módulo visa:
- Centralizar informações de correspondentes
- Facilitar acompanhamento comercial
- Manter histórico detalhado
- Melhorar conversão de negócios
- Padronizar processo de visitas 