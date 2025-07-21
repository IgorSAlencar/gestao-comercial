# Sistema de Estratégia Comercial

Este módulo implementa a funcionalidade de **Estratégia Comercial** no sistema, permitindo o gerenciamento hierárquico de lojas e produtos baseado nas chaves organizacionais.

## 🏗️ **Arquitetura Implementada**

### **Nova Estrutura Hierárquica**

A estratégia comercial utiliza uma estrutura hierárquica baseada em **chaves** em vez de UUIDs, proporcionando maior flexibilidade e manutenibilidade:

```
TB_ESTR_LOJAS (DATAWAREHOUSE)
├── CHAVE_GERENCIA_AREA  → user.chave (role='gerente')
├── CHAVE_COORDENACAO    → user.chave (role='coordenador')  
└── CHAVE_SUPERVISAO     → user.chave (role='supervisor')

TB_ESTR_CONTAS (DATAWAREHOUSE)
└── CHAVE_LOJA → TB_ESTR_LOJAS.CHAVE_LOJA
```

### **Tabelas Envolvidas**

1. **TESTE..users** - Usuários do sistema com campo `chave` adicionado
2. **DATAWAREHOUSE..TB_ESTR_LOJAS** - Dados das lojas com hierarquia organizacional
3. **DATAWAREHOUSE..TB_ESTR_CONTAS** - Dados de performance por produto

## 🚀 **Implementação**

### **1. Backend**

#### **Rota Principal: `/api/estrategia`**

```javascript
// Endpoints disponíveis
GET    /api/estrategia/:produto           // Dados completos da estratégia
POST   /api/estrategia/lojas              // Lojas por hierarquia
POST   /api/estrategia/:produto           // Dados específicos do produto
```

#### **Produtos Suportados**
- `credito` - Estratégia de crédito
- `abertura-conta` - Estratégia de abertura de contas  
- `seguro` - Estratégia de seguros
- `pontos-ativos` - Pontos comerciais ativos
- `pontos-realizando-negocio` - Pontos com transações
- `pontos-bloqueados` - Pontos bloqueados

#### **Hierarquia de Acesso**
- **Admin**: Vê todas as lojas
- **Gerente**: Vê lojas da sua gerência (`CHAVE_GERENCIA_AREA`)
- **Coordenador**: Vê lojas da sua coordenação (`CHAVE_COORDENACAO`)
- **Supervisor**: Vê lojas da sua supervisão (`CHAVE_SUPERVISAO`)

### **2. Frontend**

#### **Service: `estrategiaComercialService.ts`**
```typescript
import { estrategiaComercialApi } from '@/services/estrategiaComercialService';

// Buscar dados completos
const dados = await estrategiaComercialApi.getEstrategia('abertura-conta');

// Buscar lojas por hierarquia
const lojas = await estrategiaComercialApi.getLojasByHierarchy({
  produto: 'credito',
  userChave: user.chave,
  userRole: user.role
});
```

#### **Componentes Atualizados**
- `DetalhesEstrategia.tsx` - Usa nova API
- `DetalhesAberturaConta.tsx` - Melhorado com dados estratégicos
- Interface `User` - Campo `chave` adicionado

## 📋 **Configuração Inicial**

### **1. Executar Script SQL**

Execute o script para adicionar o campo chave na tabela users:

```sql
-- Executar no SQL Server Management Studio
EXEC sp_sqlexec '
-- Conteúdo do arquivo: src/sql/add_chave_users.sql
'
```

### **2. Verificar Dados**

Após executar o script, verifique se os dados foram inseridos corretamente:

```sql
-- Verificar usuários com chaves
SELECT name, role, funcional, chave FROM TESTE..users 
WHERE role IN ('gerente', 'coordenador', 'supervisor')
ORDER BY role, chave;

-- Verificar lojas por hierarquia
SELECT COUNT(*) as qtd_lojas, CHAVE_GERENCIA_AREA 
FROM DATAWAREHOUSE..TB_ESTR_LOJAS 
GROUP BY CHAVE_GERENCIA_AREA;
```

### **3. Executar Dados das Tabelas**

Certifique-se de que as tabelas `TB_ESTR_LOJAS` e `TB_ESTR_CONTAS` estejam populadas:

```bash
# No diretório src/backend/python
cd src/backend/python
python estr_lojas.py
python estr_contas.py
```

## 🔧 **Como Usar**

### **1. Login e Autenticação**

O usuário deve ter:
- **role** definido ('gerente', 'coordenador', 'supervisor', 'admin')
- **chave** definida (exceto admin)

### **2. Acessar Estratégia**

1. Navegar para `/estrategia-comercial`
2. Selecionar um produto (ex: Abertura de Conta)
3. O sistema automaticamente filtra dados baseado na hierarquia do usuário

### **3. Funcionalidades Disponíveis**

- ✅ **Visualização hierárquica** - Dados filtrados por nível de acesso
- ✅ **Múltiplos produtos** - Crédito, abertura de conta, seguros, pontos
- ✅ **Filtros avançados** - Por situação, tendência, gerência, etc.
- ✅ **Exportação Excel** - Dados analíticos formatados
- ✅ **Acompanhamento** - Marcar lojas para monitoramento
- ✅ **Detalhes expandidos** - Informações completas das lojas

## 🎯 **Vantagens da Nova Estrutura**

### **✅ Flexibilidade**
- Usuário pode mudar de cargo sem quebrar o sistema
- Fácil remanejamento hierárquico

### **✅ Performance**
- Consultas diretas nas tabelas de dados
- Índices otimizados por chaves numéricas

### **✅ Manutenibilidade**
- Estrutura desacoplada entre autenticação e dados
- Fácil adição de novos produtos/hierarquias

### **✅ Escalabilidade**
- Suporte a múltiplas estruturas organizacionais
- Fácil integração com novos sistemas

## 🧪 **Dados de Teste**

### **Usuários de Exemplo**

| Nome | Role | Funcional | Chave | Hierarquia |
|------|------|-----------|-------|------------|
| Igor Alencar | admin | 9444168 | NULL | Acesso total |
| Carlos Oliveira | gerente | 54321 | 20001 | SAO PAULO |
| Maria Santos | coordenador | 67890 | 30001 | COORD LESTE |
| João Silva | supervisor | 12345 | 40001 | SUP LESTE |

### **Estrutura Hierárquica**

```
SP INTERIOR (10001)
└── SAO PAULO (20001)
    ├── COORD LESTE (30001)
    │   ├── SUP LESTE (40001)
    │   └── SUP OESTE (40002)
    └── COORD OESTE (30002)
        └── SUP SUL (40003)

SUL (10002)
└── SUL (20002)
    └── COORD SUL (30003)
        └── SUP SUL REGIAO (40004)

NORDESTE 1 (10003)
└── NORDESTE 1 (20003)
    └── COORD NORDESTE (30004)
        ├── SUP NORDESTE A (40005)
        └── SUP NORDESTE B (40006)
```

## 🚨 **Troubleshooting**

### **Erro: "Usuário não possui chave de hierarquia"**
- Execute o script `add_chave_users.sql`
- Verifique se o usuário tem chave definida

### **Erro: "Nenhuma loja encontrada"**
- Execute os scripts Python para popular as tabelas
- Verifique se as tabelas DATAWAREHOUSE existem

### **Erro: "Dados de hierarquia inválidos"**
- A chave do usuário não corresponde aos dados enviados
- Faça logout/login para atualizar o token

## 📈 **Próximos Passos**

1. **Implementar tratativas** - Sistema de acompanhamento de ações
2. **Dashboard gerencial** - Visão consolidada para gestores
3. **Relatórios automáticos** - Envio programado de relatórios
4. **Integração móvel** - App para correspondentes
5. **BI avançado** - Dashboards interativos com Power BI

---

**📞 Suporte:** Entre em contato com a equipe de desenvolvimento para dúvidas ou problemas. 