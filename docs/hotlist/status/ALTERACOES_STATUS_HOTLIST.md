# Alterações nos Status da HotList

## Resumo das Mudanças

### ✅ Problema Resolvido
- **Situação não atualizava na tabela** após registrar tratativa
- **Inconsistência entre valores** salvos ('realizada') e esperados ('tratada')

### 🔄 Status Atualizados

#### **Antes:**
- `pendente` - Pendente Tratativa
- `realizar` - Realizar  
- `tratada` - Tratado
- `bloqueada` - Bloqueada ❌

#### **Depois:**
- `pendente` - Pendente Tratativa
- `prospectada` - Prospectada ✨
- `tratada` - Tratado

### 🛠️ Correções Implementadas

#### 1. **TratativaModal** (`src/components/hotlist/TratativaModal.tsx`)
```diff
- situacao: data.tem_perfil_comercial === 'sim' && data.aceitou_proposta === 'sim' ? 'realizada' : 'pendente'
+ situacao: 'tratada' // Sempre marca como tratada quando registra uma tratativa
```

#### 2. **Interfaces TypeScript** (`src/services/api.ts`)
```diff
- situacao: 'realizada' | 'pendente';
+ situacao: 'tratada' | 'pendente';

- situacao: 'pendente' | 'realizar' | 'tratada' | 'bloqueada';
+ situacao: 'pendente' | 'prospectada' | 'tratada';
```

#### 3. **Frontend HotList** (`src/pages/Hotlist.tsx`)
```diff
- case 'realizar': return 'Realizar';
- case 'bloqueada': return 'Bloqueada';
+ case 'prospectada': return 'Prospectada';

- prospectadas: hotListData.filter(d => d.situacao === 'realizar').length
+ prospectadas: hotListData.filter(d => d.situacao === 'prospectada').length
```

#### 4. **Componente de Filtros** (`src/components/hotlist/HotlistFilters.tsx`)
```diff
- case 'realizar': return 'Realizar';
- case 'bloqueada': return 'Bloqueada';
+ case 'prospectada': return 'Prospectada';
```

#### 5. **Painel Gerencial** (`src/components/hotlist/HotlistGerencial.tsx`)
```diff
- realizar: number;
+ prospectadas: number;

- case 'realizar': acc[supervisorId].realizar += 1;
+ case 'prospectada': acc[supervisorId].prospectadas += 1;

- <TableHead>Realizar</TableHead>
+ <TableHead>Prospectadas</TableHead>
```

#### 6. **Documentação** (`src/backend/README_HOTLIST.md`)
```diff
- situacao VARCHAR(10), -- 'pendente', 'realizar', 'tratada', 'bloqueada'
+ situacao VARCHAR(10), -- 'pendente', 'prospectada', 'tratada'

- situacao VARCHAR(10) NOT NULL, -- 'realizada' ou 'pendente'
+ situacao VARCHAR(10) NOT NULL, -- 'tratada' ou 'pendente'
```

### 📊 Como Funciona Agora

#### **Fluxo da Tratativa:**
1. **Lead nova**: Status = `prospectada`
2. **Supervisor registra tratativa**: Status = `tratada`  
3. **Lead sem ação**: Status = `pendente`

#### **Lógica Simplificada:**
- Qualquer registro de tratativa **sempre** marca como `'tratada'`
- Não há mais diferenciação entre "realizada" e "pendente" na tratativa
- O status da HotList é atualizado automaticamente

### 🎯 Benefícios

1. **✅ Consistência**: Um único fluxo de status
2. **✅ Simplicidade**: Tratativa sempre = tratada
3. **✅ Clareza**: Status mais intuitivos
4. **✅ Manutenibilidade**: Menos estados para gerenciar

### 🔍 Validação

Para verificar se está funcionando:

1. **Registre uma tratativa** na HotList
2. **Verifique** se o status mudou para "Tratado"
3. **Confira** se os totais foram atualizados
4. **Teste** os filtros por status

### 📝 Observações

- Status `bloqueada` foi **removido** conforme solicitado
- Status `realizar` foi **renomeado** para `prospectada`
- Backend já **atualiza automaticamente** o status na HOTLIST
- Documentação foi **totalmente atualizada** 