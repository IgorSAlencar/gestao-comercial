import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Search, Download, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Separator } from "@/components/ui/separator";

function FilterSection({
title,
children,
isCollapsed = false,
onToggle,
}: React.PropsWithChildren<{ 
    title: string; 
    isCollapsed?: boolean; 
    onToggle?: () => void;
}>) {
return (
    <fieldset className="p-3">
    <legend className="px-1">   
        <button
            type="button"
            onClick={onToggle}
            className="font-semibold text-blue-900 flex items-center gap-2 text-sm hover:text-blue-700 transition-colors cursor-pointer"
        >
            {isCollapsed ? (
                <ChevronRight size={16} />
            ) : (
                <ChevronDown size={16} />
            )}
            {title}
        </button>
    </legend>

    {!isCollapsed && (
        <div className="mt-3 flex flex-wrap gap-1">
            {children}
        </div>
    )}
    </fieldset>
);
}


// Tipos
interface FiltrosPontosAtivos {
  chaveLoja: string;
  nomeLoja: string;
  situacao: string[];
  gerenciaRegional: string[];
  diretoriaRegional: string[];
  gerentesArea: string[];
  coordenadores: string[];
  supervisorResponsavel: string[];
  tendencia: string[];
  nivelAtividade: string[];
  municipio: string[];
  uf: string[];
  agencia: string[];
  mesM3: string[];
  mesM2: string[];
  mesM1: string[];
  mesM0: string[];
}

interface PontosAtivosFiltersProps {
  form: UseFormReturn<FiltrosPontosAtivos>;
  aplicarFiltros: (values: FiltrosPontosAtivos) => void;
  limparFiltros: () => void;
  exportarParaExcel: () => void;
  dadosFiltrados: any[];
  showAnaliseFiltros: boolean;
  setShowAnaliseFiltros: (show: boolean) => void;
  canSeeHierarchyColumns: boolean;
  monthNames: {
    M3: string;
    M2: string;
    M1: string;
    M0: string;
  };
  // Opções para os filtros
  situacoes: string[];
  municipios: string[];
  ufs: string[];
  agencias: string[];
  gerenciasRegionais: string[];
  diretoriasRegionais: string[];
  gerentesArea: string[];
  coordenadores: string[];
  supervisoresResponsaveis: string[];
}

const ComboboxFilter = ({
  name,
  title,
  options,
  valueKey = 'value',
  labelKey = 'label',
  form,
  aplicarFiltros
}: {
  name: keyof FiltrosPontosAtivos;
  title: string;
  options: any[];
  valueKey?: string;
  labelKey?: string;
  form: UseFormReturn<FiltrosPontosAtivos>;
  aplicarFiltros: (values: FiltrosPontosAtivos) => void;
}) => {
  // Usar estado local para forçar re-renderização quando filtros mudam
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const values = form.getValues(name) as string[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
             "justify-start text-left font-normal min-w-[120px] max-w-[160px]",
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
          <CommandGroup className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
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
                     // Forçar re-renderização do componente
                     forceUpdate();
                     // Aplicar filtros após atualizar o form
                     aplicarFiltros(form.getValues());
                  }}
                  className="cursor-pointer"
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
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const PontosAtivosFilters: React.FC<PontosAtivosFiltersProps> = ({
  form,
  aplicarFiltros,
  limparFiltros,
  exportarParaExcel,
  dadosFiltrados,
  showAnaliseFiltros,
  setShowAnaliseFiltros,
  canSeeHierarchyColumns,
  monthNames,
  situacoes,
  municipios,
  ufs,
  agencias,
  diretoriasRegionais,
  gerenciasRegionais,
  gerentesArea,
  coordenadores,
  supervisoresResponsaveis
}) => {
  // Estados para controlar collapse das seções
  const [hierarquiasCollapsed, setHierarquiasCollapsed] = React.useState(false);
  const [outrosFiltrosCollapsed, setOutrosFiltrosCollapsed] = React.useState(false);
  return (
    <div className="mb-6 bg-gray-50 rounded-lg p-4">
      <Form {...form}>
        <form className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Search size={16} />
              Filtrar lojas ativas
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarParaExcel}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Exportar Excel
            </Button>
          </div>

          <FormField
            control={form.control}
            name="nomeLoja"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder="Buscar por Chave Loja, CNPJ ou Nome da Loja" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      aplicarFiltros(form.getValues());
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

 
    
         <div className="flex flex-col gap 0">
         {/* Seção: Hierarquias (só aparece se o usuário puder ver) */}
         {canSeeHierarchyColumns && (
             <FilterSection 
                 title="Hierarquias"
                 isCollapsed={hierarquiasCollapsed}
                 onToggle={() => setHierarquiasCollapsed(!hierarquiasCollapsed)}
             >
             <ComboboxFilter
                 name="diretoriaRegional"
                 title="Diretoria Regional"
                 options={diretoriasRegionais.map(g => ({ value: g, label: g }))}
                 valueKey="value"
                 labelKey="label"
                 form={form}
                 aplicarFiltros={aplicarFiltros}
             />
             <ComboboxFilter
                 name="gerenciaRegional"
                 title="Gerente Regional"
                 options={gerenciasRegionais.map(g => ({ value: g, label: g }))}
                 valueKey="value"
                 labelKey="label"
                 form={form}
                 aplicarFiltros={aplicarFiltros}
             />

             <ComboboxFilter
                 name="gerentesArea"
                 title="Gerente Área"
                 options={gerentesArea.map(g => ({ value: g, label: g }))}
                 valueKey="value"
                 labelKey="label"
                 form={form}
                 aplicarFiltros={aplicarFiltros}
             />
             <ComboboxFilter
                 name="coordenadores"
                 title="Coordenador"
                 options={coordenadores.map(d => ({ value: d, label: d }))}
                 valueKey="value"
                 labelKey="label"
                 form={form}
                 aplicarFiltros={aplicarFiltros}
             />
             <ComboboxFilter
                 name="supervisorResponsavel"
                 title="Supervisor"
                 options={supervisoresResponsaveis.map(s => ({ value: s, label: s }))}
                 valueKey="value"
                 labelKey="label"
                 form={form}
                 aplicarFiltros={aplicarFiltros}
             />
             <ComboboxFilter
             name="agencia"
             title="Agência"
             options={agencias}
             form={form}
             aplicarFiltros={aplicarFiltros}
             />
             </FilterSection>
         )}

        {/* Separador opcional entre blocos */}
        {canSeeHierarchyColumns && <Separator className="my-0" />}
        <div className="mt-3 flex items-center gap-2">
        </div>
         {/* Seção: Outros filtros */}
         <FilterSection 
             title="Outros filtros"
             isCollapsed={outrosFiltrosCollapsed}
             onToggle={() => setOutrosFiltrosCollapsed(!outrosFiltrosCollapsed)}
         >

             <ComboboxFilter
             name="municipio"
             title="Município"
             options={municipios}
             form={form}
             aplicarFiltros={aplicarFiltros}
             />
             <ComboboxFilter
             name="uf"
             title="UF"
             options={ufs}
             form={form}
             aplicarFiltros={aplicarFiltros}
             />

         </FilterSection>
         <div className="mt-3 flex items-center gap-2">
         </div>
        {/* Ações */}
        <div className="flex items-center gap-2">
            <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAnaliseFiltros(!showAnaliseFiltros)}
            className="flex items-center gap-2 transition-all duration-200"
            >
            <BarChart3 size={16} />
            Análise
            {showAnaliseFiltros && (
                <div className="ml-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
            </Button>
            <ComboboxFilter
             name="situacao"
             title="Situação"
             options={situacoes.map(s => ({
                 value: s,
                 label:
                 s === "REATIVAÇÃO" ? "Reativação" :
                 s === "BLOQUEADO" ? "Bloqueado" :
                 s === "CONTRATAÇÃO" ? "Contratação" :
                 s === "MANTEVE" ? "Manteve" :
                 s === "ENCERRADO" ? "Encerrado" :
                 s === "EQUIP_RETIRADA" ? "Equip. Retirada" :
                 s === "INOPERANTE" ? "Inoperante" : s
             }))}
             valueKey="value"
             labelKey="label"
             form={form}
             aplicarFiltros={aplicarFiltros}
             />
        </div>
        </div>


          {/* Filtros de Análise - Aparecem quando showAnaliseFiltros é true */}
          {showAnaliseFiltros && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-blue-800">Análise Temporal por Mês</span>
              </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComboboxFilter
                  name="mesM3"
                  title={`${monthNames.M3} - Status`}
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'inativo', label: 'Inativo' }
                  ]}
                  valueKey="value"
                  labelKey="label"
                  form={form}
                  aplicarFiltros={aplicarFiltros}
                />
                <ComboboxFilter
                  name="mesM2"
                  title={`${monthNames.M2} - Status`}
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'inativo', label: 'Inativo' }
                  ]}
                  valueKey="value"
                  labelKey="label"
                  form={form}
                  aplicarFiltros={aplicarFiltros}
                />
                <ComboboxFilter
                  name="mesM1"
                  title={`${monthNames.M1} - Status`}
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'inativo', label: 'Inativo' }
                  ]}
                  valueKey="value"
                  labelKey="label"
                  form={form}
                  aplicarFiltros={aplicarFiltros}
                />
                <ComboboxFilter
                  name="mesM0"
                  title={`${monthNames.M0} - Status`}
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'inativo', label: 'Inativo' }
                  ]}
                  valueKey="value"
                  labelKey="label"
                  form={form}
                  aplicarFiltros={aplicarFiltros}
                />
              </div>
            </div>
          )}

          {/* Filtros Ativos */}
          {Object.entries(form.getValues()).some(([_, value]) => 
            Array.isArray(value) ? value.length > 0 : !!value
          ) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={limparFiltros}
                  className="shrink-0"
                >
                  Limpar filtros
                </Button>
                <div className="flex-1">
                   <div className="flex flex-wrap gap-0.5 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                    {Object.entries(form.getValues()).map(([key, values]) => {
                      if (!Array.isArray(values) || values.length === 0) return null;
                      return values.map((value: string) => {
                        let label = value;
                        if (key === 'situacao') {
                          label = value === "REATIVAÇÃO" ? "Reativação" :
                                 value === "BLOQUEADO" ? "Bloqueado" :
                                 value === "CONTRATAÇÃO" ? "Contratação" :
                                 value === "MANTEVE" ? "Manteve" :
                                 value === "ENCERRADO" ? "Encerrado" :
                                 value === "EQUIP_RETIRADA" ? "Equip. Retirada" :
                                 value === "INOPERANTE" ? "Inoperante" :
                                 value;
                        } else if (key === 'tendencia') {
                          label = value === "crescimento" ? "Crescimento" :
                                 value === "estavel" ? "Estável" :
                                 value === "queda" ? "Queda" :
                                 "Atenção";
                        } else if (key === 'nivelAtividade') {
                          label = value === "alta" ? "Alta" : 
                                 value === "media" ? "Média" : 
                                 "Baixa";
                        } else if (key === 'mesM3') {
                          label = `${monthNames.M3}: ${value === "ativo" ? "Ativo" : "Inativo"}`;
                        } else if (key === 'mesM2') {
                          label = `${monthNames.M2}: ${value === "ativo" ? "Ativo" : "Inativo"}`;
                        } else if (key === 'mesM1') {
                          label = `${monthNames.M1}: ${value === "ativo" ? "Ativo" : "Inativo"}`;
                        } else if (key === 'mesM0') {
                          label = `${monthNames.M0}: ${value === "ativo" ? "Ativo" : "Inativo"}`;
                        }

                        return (
                          <Badge 
                            key={`${key}-${value}`}
                            variant="secondary"
                            className="cursor-pointer transition-colors shrink-0"
                            onClick={() => {
                              const currentValues = form.getValues(key as keyof FiltrosPontosAtivos) as string[];
                              form.setValue(
                                key as keyof FiltrosPontosAtivos, 
                                currentValues.filter(v => v !== value)
                              );
                              aplicarFiltros(form.getValues());
                            }}
                          >
                            <span className="truncate max-w-[150px]">{label}</span>
                            <span className="ml-1">×</span>
                          </Badge>
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default PontosAtivosFilters;
