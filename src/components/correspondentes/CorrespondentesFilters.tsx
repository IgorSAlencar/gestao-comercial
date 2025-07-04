import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, RefreshCw } from 'lucide-react';

interface Correspondente {
  id: string;
  CHAVE_LOJA: string;
  CNPJ: string;
  NOME: string;
  nr_pacb: string;
  diretoria?: string;
  gerencia?: string;
  agencia?: string;
  pa?: string;
  status?: 'ativo' | 'inativo';
}

interface FilterState {
  search: string;
  diretoria: string;
  gerencia: string;
  agencia: string;
  pa: string;
  status: string;
}

interface CorrespondentesFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  correspondentes: Correspondente[];
}

export function CorrespondentesFilters({ 
  filters, 
  onFilterChange, 
  correspondentes 
}: CorrespondentesFiltersProps) {
  
  // Extrai valores únicos para os selects
  const getUniqueValues = (field: keyof Correspondente) => {
    const values = correspondentes
      .map(item => item[field])
      .filter((value, index, array) => 
        value && value !== '' && array.indexOf(value) === index
      ) as string[];
    return values.sort();
  };

  const diretorias = getUniqueValues('diretoria');
  const gerencias = getUniqueValues('gerencia');
  const agencias = getUniqueValues('agencia');
  const pas = getUniqueValues('pa');

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      diretoria: '',
      gerencia: '',
      agencia: '',
      pa: '',
      status: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-4">
      {/* Linha 1: Busca geral */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CNPJ, chave da loja ou nr PACB..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 h-10"
          />
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 h-10 px-3"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Linha 2: Filtros hierárquicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Diretoria
          </label>
          <Select
            value={filters.diretoria}
            onValueChange={(value) => onFilterChange({ 
              diretoria: value === 'all' ? '' : value,
              // Limpa filtros dependentes
              gerencia: '',
              agencia: '',
              pa: ''
            })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas as diretorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as diretorias</SelectItem>
              {diretorias.map((diretoria) => (
                <SelectItem key={diretoria} value={diretoria}>
                  {diretoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Gerência
          </label>
          <Select
            value={filters.gerencia}
            onValueChange={(value) => onFilterChange({ 
              gerencia: value === 'all' ? '' : value,
              // Limpa filtros dependentes
              agencia: '',
              pa: ''
            })}
            disabled={!filters.diretoria}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas as gerências" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as gerências</SelectItem>
              {gerencias
                .filter(gerencia => !filters.diretoria || 
                  correspondentes.some(c => c.diretoria === filters.diretoria && c.gerencia === gerencia)
                )
                .map((gerencia) => (
                  <SelectItem key={gerencia} value={gerencia}>
                    {gerencia}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Agência
          </label>
          <Select
            value={filters.agencia}
            onValueChange={(value) => onFilterChange({ 
              agencia: value === 'all' ? '' : value,
              // Limpa filtros dependentes
              pa: ''
            })}
            disabled={!filters.gerencia}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas as agências" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as agências</SelectItem>
              {agencias
                .filter(agencia => !filters.gerencia || 
                  correspondentes.some(c => c.gerencia === filters.gerencia && c.agencia === agencia)
                )
                .map((agencia) => (
                  <SelectItem key={agencia} value={agencia}>
                    {agencia}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            PA (Posto de Atendimento)
          </label>
          <Select
            value={filters.pa}
            onValueChange={(value) => onFilterChange({ pa: value === 'all' ? '' : value })}
            disabled={!filters.agencia}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todos os PAs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os PAs</SelectItem>
              {pas
                .filter(pa => !filters.agencia || 
                  correspondentes.some(c => c.agencia === filters.agencia && c.pa === pa)
                )
                .map((pa) => (
                  <SelectItem key={pa} value={pa}>
                    {pa}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 3: Status */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Status
          </label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange({ status: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contador de resultados */}
        <div className="flex-1 flex items-center justify-end">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
            <span className="font-medium">
              {correspondentes.length} correspondente{correspondentes.length !== 1 ? 's' : ''} encontrado{correspondentes.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600">
                (filtros aplicados)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hint de uso */}
      {!hasActiveFilters && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
          💡 <strong>Dica:</strong> Use os filtros hierárquicos para navegar pela estrutura organizacional. 
          Comece selecionando uma diretoria para filtrar as gerências relacionadas.
        </div>
      )}
    </div>
  );
} 