import React from 'react';
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

interface FiltrosHotList {
  searchTerm: string;
  mercado: string[];
  situacao: string[];
  pracaPresenca: string[];
  supervisor: string[];
  coordenador: string[];
  gerenciaArea: string[];
  diretoriaRegional: string[];
  gerenciaRegional: string[];
  agenciaPa: string[];
}

interface HotListItem {
  MERCADO: string;
  situacao: string;
  PRACA_PRESENCA: string;
  supervisor_id: string;
  supervisor_name: string;
  DIRETORIA_REGIONAL: string;
  GERENCIA_REGIONAL: string;
  AGENCIA: string;
  PA: string;
}

interface HotlistFiltersProps {
  dados: HotListItem[];
  onFilter: (filters: FiltrosHotList) => void;
  onExport: () => void;
  isSupervisor?: boolean;
  userRole?: string;
}

const HotlistFilters: React.FC<HotlistFiltersProps> = ({ dados, onFilter, onExport, isSupervisor = false, userRole = 'supervisor' }) => {
  const form = useForm<FiltrosHotList>({
    defaultValues: {
      searchTerm: "",
      mercado: [],
      situacao: [],
      pracaPresenca: [],
      supervisor: [],
      coordenador: [],
      gerenciaArea: [],
      diretoriaRegional: [],
      gerenciaRegional: [],
      agenciaPa: []
    }
  });

  // Extrair opções únicas dos dados
  const uniqueOptions = {
    diretoriasRegionais: Array.from(new Set(dados.map(d => d.DIRETORIA_REGIONAL))).sort(),
    gerenciasRegionais: Array.from(new Set(dados.map(d => d.GERENCIA_REGIONAL))).sort(),
    // Gerência Área - Por enquanto vazio pois não existe na tabela
    gerenciasArea: [],
    // Coordenador - Por enquanto vazio pois precisaria consultar hierarquia
    coordenadores: [],
    // Supervisores únicos (corrigindo duplicação)
    supervisores: Array.from(
      new Map(dados.map(d => [d.supervisor_id, { id: d.supervisor_id, name: d.supervisor_name }])).values()
    ).sort((a, b) => a.name.localeCompare(b.name)),
    agenciasPas: Array.from(new Set([
      ...dados.map(d => d.AGENCIA),
      ...dados.map(d => d.PA)
    ])).sort(),
    situacoes: Array.from(new Set(dados.map(d => d.situacao))),
    mercados: Array.from(new Set(dados.map(d => d.MERCADO))).sort(),
    pracasPresenca: Array.from(new Set(dados.map(d => d.PRACA_PRESENCA))).sort()
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente Tratativa';
      case 'tratada': return 'Tratado';
      case 'prospectada': return 'Prospectada';
      default: return status;
    }
  };

  const handleFilter = () => {
    onFilter(form.getValues());
  };

  const handleClearFilters = () => {
    form.reset();
    handleFilter();
  };

  const ComboboxFilter = ({ 
    name, 
    title, 
    options, 
    valueKey = 'value',
    labelKey = 'label'
  }: { 
    name: keyof FiltrosHotList; 
    title: string; 
    options: any[];
    valueKey?: string;
    labelKey?: string;
  }) => {
    const values = form.watch(name) as string[];

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "justify-start text-left font-normal min-w-[140px] max-w-[200px]",
              values?.length > 0 && "border-primary/50 bg-primary/5"
            )}
          >
            <span className="truncate">
              {values?.length > 0 
                ? `${title} (${values.length})`
                : title}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {options.length > 10 && (
                <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border-b">
                  {options.length} opções disponíveis • Use scroll para ver mais
                </div>
              )}
              {options.map((option: any) => {
                const value = option[valueKey] || option;
                const label = option[labelKey] || option;
                return (
                  <CommandItem
                    key={value}
                    onSelect={() => {
                      const currentValues = form.getValues(name) as string[];
                      const newValues = currentValues.includes(value)
                        ? currentValues.filter(v => v !== value)
                        : [...currentValues, value];
                      form.setValue(name, newValues);
                      handleFilter();
                    }}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      values?.includes(value) ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {values?.includes(value) && "✓"}
                    </div>
                    <span className="truncate">{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {options.length > 10 && (
              <div className="px-2 py-1.5 text-xs text-gray-400 bg-gray-50 border-t flex items-center justify-center">
                <span>↕️ Use scroll para navegar</span>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Search size={16} />
          Filtrar lojas
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Exportar Excel
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="searchTerm"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder="Buscar por CNPJ, Nome da Loja ou Localização" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFilter();
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2">
            {/* Ordem solicitada: Diretoria Regional, Gerência Regional, Gerência Área, Coordenador, Supervisor, AG/PA, Situação, Mercado, Praça Presença */}
            
            <ComboboxFilter
              name="diretoriaRegional"
              title="Diretoria Regional"
              options={uniqueOptions.diretoriasRegionais}
            />
            <ComboboxFilter
              name="gerenciaRegional"
              title="Gerência Regional"
              options={uniqueOptions.gerenciasRegionais}
            />
            {/* Gerência Área - Campo não existe na tabela hotlist */}
            {uniqueOptions.gerenciasArea.length > 0 && (
              <ComboboxFilter
                name="gerenciaArea"
                title="Gerência Área"
                options={uniqueOptions.gerenciasArea}
              />
            )}
            {/* Coordenador - Somente para gerente e admin */}
            {(userRole === 'gerente' || userRole === 'admin') && uniqueOptions.coordenadores.length > 0 && (
              <ComboboxFilter
                name="coordenador"
                title="Coordenador"
                options={uniqueOptions.coordenadores}
                valueKey="id"
                labelKey="name"
              />
            )}
            {/* Supervisor - Oculto para supervisor */}
            {!isSupervisor && (
              <ComboboxFilter
                name="supervisor"
                title="Supervisor"
                options={uniqueOptions.supervisores}
                valueKey="id"
                labelKey="name"
              />
            )}
            <ComboboxFilter
              name="agenciaPa"
              title="AG/PA"
              options={uniqueOptions.agenciasPas}
            />
            <ComboboxFilter
              name="situacao"
              title="Situação"
              options={uniqueOptions.situacoes.map(s => ({
                value: s,
                label: getStatusLabel(s)
              }))}
              valueKey="value"
              labelKey="label"
            />
            <ComboboxFilter
              name="mercado"
              title="Mercado"
              options={uniqueOptions.mercados}
            />
            <ComboboxFilter
              name="pracaPresenca"
              title="Praça Presença"
              options={uniqueOptions.pracasPresenca}
            />
          </div>

          {Object.entries(form.getValues()).some(([_, value]) => 
            Array.isArray(value) ? value.length > 0 : !!value
          ) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="shrink-0"
                >
                  Limpar filtros
                </Button>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                    {Object.entries(form.getValues()).map(([key, values]) => {
                      if (!Array.isArray(values) || values.length === 0) return null;
                      return values.map((value: string) => {
                        let label = value;
                        if (key === 'situacao') {
                          label = getStatusLabel(value);
                        } else if (key === 'supervisor') {
                          const supervisor = uniqueOptions.supervisores.find(s => s.id === value);
                          label = supervisor?.name || value;
                        } else if (key === 'coordenador') {
                          const coordenador = uniqueOptions.coordenadores.find(c => c.id === value);
                          label = coordenador?.name || value;
                        }

                        return (
                          <Badge 
                            key={`${key}-${value}`}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100 hover:border-red-300 transition-colors shrink-0"
                            onClick={() => {
                              const currentValues = form.getValues(key as keyof FiltrosHotList) as string[];
                              form.setValue(
                                key as keyof FiltrosHotList, 
                                currentValues.filter(v => v !== value)
                              );
                              handleFilter();
                            }}
                          >
                            <span className="truncate max-w-[150px]">{label}</span>
                            <span className="ml-1">×</span>
                          </Badge>
                        );
                      });
                    })}
                  </div>
                  {/* Contador de filtros se houver muitos */}
                  {Object.values(form.getValues()).reduce((total, arr) => 
                    total + (Array.isArray(arr) ? arr.length : 0), 0
                  ) > 5 && (
                    <div className="text-xs text-gray-500 mt-2">
                      {Object.values(form.getValues()).reduce((total, arr) => 
                        total + (Array.isArray(arr) ? arr.length : 0), 0
                      )} filtros aplicados • Clique em × para remover
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default HotlistFilters; 