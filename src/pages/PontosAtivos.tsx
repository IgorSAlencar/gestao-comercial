import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Search, 
  Download, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  Info,
  Filter,
  BarChart3,
  Users,
  Building2,
  Phone,
  Calendar,
  Clock,
  Target,
  Award,
  Wrench,
  Heart,
  Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import GraficoTendencia from "@/components/GraficoTendencia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos específicos para Pontos Ativos
interface DadosPontoAtivo {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  situacao: "ativa" | "inativa" | "bloqueada";
  dataUltimaTransacao: Date;
  mesM3: number;
  mesM2: number;
  mesM1: number;
  mesM0: number;
  endereco: string;
  municipio: string;
  uf: string;
  agencia: string;
  gerenciaRegional: string;
  diretoriaRegional: string;
  telefoneLoja: string;
  nomeContato: string;
  dataInauguracao: Date;
  dataCertificacao: Date;
  situacaoTablet: "Instalado" | "Pendente" | "Não Instalado";
  multiplicadorResponsavel: string;
  tendencia: "crescimento" | "estavel" | "queda" | "atencao";
  nivelAtividade: "alta" | "media" | "baixa";
  produtosHabilitados: {
    consignado: boolean;
    microsseguro: boolean;
    lime: boolean;
  };
}

interface FiltrosPontosAtivos {
  chaveLoja: string;
  nomeLoja: string;
  situacao: string[];
  gerenciaRegional: string[];
  diretoriaRegional: string[];
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

// Dados simulados para Pontos Ativos
const dadosSimulados: DadosPontoAtivo[] = [
  {
    chaveLoja: "5001",
    cnpj: "12.345.678/0001-99",
    nomeLoja: "Loja Centro",
    situacao: "ativa",
    dataUltimaTransacao: new Date("2024-01-15"),
    mesM3: 1,
    mesM2: 0,
    mesM1: 0,
    mesM0: 1,
    endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP",
    municipio: "São Paulo",
    uf: "SP",
    agencia: "0001",
    gerenciaRegional: "São Paulo Centro",
    diretoriaRegional: "Sudeste",
    telefoneLoja: "(11) 3456-7890",
    nomeContato: "João Silva",
    dataInauguracao: new Date("2020-05-15"),
    dataCertificacao: new Date("2022-10-05"),
    situacaoTablet: "Instalado",
    multiplicadorResponsavel: "Carlos Oliveira",
    tendencia: "crescimento",
    nivelAtividade: "alta",
    produtosHabilitados: {
      consignado: true,
      microsseguro: true,
      lime: false
    }
  },
  {
    chaveLoja: "5002",
    cnpj: "23.456.789/0001-88",
    nomeLoja: "Loja Shopping Vila Olímpia",
    situacao: "ativa",
    dataUltimaTransacao: new Date("2024-01-10"),
    mesM3: 1,
    mesM2: 1,
    mesM1: 1,
    mesM0: 0,
    endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP",
    municipio: "São Paulo",
    uf: "SP",
    agencia: "0002",
    gerenciaRegional: "São Paulo Zona Sul",
    diretoriaRegional: "Sudeste",
    telefoneLoja: "(11) 3456-7891",
    nomeContato: "Maria Santos",
    dataInauguracao: new Date("2021-11-20"),
    dataCertificacao: new Date("2022-09-15"),
    situacaoTablet: "Instalado",
    multiplicadorResponsavel: "Ana Pereira",
    tendencia: "estavel",
    nivelAtividade: "media",
    produtosHabilitados: {
      consignado: true,
      microsseguro: false,
      lime: true
    }
  },
  {
    chaveLoja: "5003",
    cnpj: "34.567.890/0001-77",
    nomeLoja: "Loja Campinas Shopping",
    situacao: "ativa",
    dataUltimaTransacao: new Date("2024-01-12"),
    mesM3: 0,
    mesM2: 0,
    mesM1: 1,
    mesM0: 0,
    endereco: "Campinas Shopping, Loja 15 - Campinas/SP",
    municipio: "Campinas",
    uf: "SP",
    agencia: "0003",
    gerenciaRegional: "Campinas",
    diretoriaRegional: "Sudeste",
    telefoneLoja: "(19) 3456-7892",
    nomeContato: "Roberto Costa",
    dataInauguracao: new Date("2021-03-10"),
    dataCertificacao: new Date("2022-08-20"),
    situacaoTablet: "Instalado",
    multiplicadorResponsavel: "Roberto Costa",
    tendencia: "atencao",
    nivelAtividade: "media",
    produtosHabilitados: {
      consignado: true,
      microsseguro: true,
      lime: false
    }
  }
];

const PontosAtivos: React.FC = () => {
  const navigate = useNavigate();
  const { user, isManager } = useAuth();
  const [dados, setDados] = useState<DadosPontoAtivo[]>(dadosSimulados);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosPontoAtivo[]>(dadosSimulados);
  const [ordenacao, setOrdenacao] = useState({ coluna: 'chaveLoja' as keyof DadosPontoAtivo, direcao: 'asc' as 'asc' | 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('success');
  const [error, setError] = useState<string>('');
  const [showAnaliseFiltros, setShowAnaliseFiltros] = useState(false);

  const form = useForm<FiltrosPontosAtivos>({
    defaultValues: {
      chaveLoja: "",
      nomeLoja: "",
      situacao: [],
      gerenciaRegional: [],
      diretoriaRegional: [],
      tendencia: [],
      nivelAtividade: [],
      municipio: [],
      uf: [],
      agencia: [],
      mesM3: [],
      mesM2: [],
      mesM1: [],
      mesM0: []
    }
  });

  // Opções para filtros
  const situacoes = ["ativa", "inativa", "bloqueada"];
  const tendencias = ["crescimento", "estavel", "queda", "atencao"];
  const niveisAtividade = ["alta", "media", "baixa"];
  const gerenciasRegionais = [...new Set(dados.map(d => d.gerenciaRegional))];
  const diretoriasRegionais = [...new Set(dados.map(d => d.diretoriaRegional))];
  const municipios = [...new Set(dados.map(d => d.municipio))];
  const ufs = [...new Set(dados.map(d => d.uf))];
  const agencias = [...new Set(dados.map(d => d.agencia))];

  const handleVoltar = () => {
    navigate('/estrategia-comercial');
  };

  const aplicarFiltros = (values: FiltrosPontosAtivos) => {
    let filtrados = [...dados];

    // Filtro por texto (chave loja, nome loja)
    if (values.chaveLoja || values.nomeLoja) {
      const termo = (values.chaveLoja || values.nomeLoja).toLowerCase();
      filtrados = filtrados.filter(loja => 
        loja.chaveLoja.toLowerCase().includes(termo) ||
        loja.nomeLoja.toLowerCase().includes(termo) ||
        loja.cnpj.includes(termo)
      );
    }

    // Filtros por arrays
    if (values.situacao.length > 0) {
      filtrados = filtrados.filter(loja => values.situacao.includes(loja.situacao));
    }

    if (values.gerenciaRegional.length > 0) {
      filtrados = filtrados.filter(loja => values.gerenciaRegional.includes(loja.gerenciaRegional));
    }

    if (values.diretoriaRegional.length > 0) {
      filtrados = filtrados.filter(loja => values.diretoriaRegional.includes(loja.diretoriaRegional));
    }

    if (values.tendencia.length > 0) {
      filtrados = filtrados.filter(loja => values.tendencia.includes(loja.tendencia));
    }

    if (values.nivelAtividade.length > 0) {
      filtrados = filtrados.filter(loja => values.nivelAtividade.includes(loja.nivelAtividade));
    }

    if (values.municipio.length > 0) {
      filtrados = filtrados.filter(loja => values.municipio.includes(loja.municipio));
    }

    if (values.uf.length > 0) {
      filtrados = filtrados.filter(loja => values.uf.includes(loja.uf));
    }

    if (values.agencia.length > 0) {
      filtrados = filtrados.filter(loja => values.agencia.includes(loja.agencia));
    }

    // Filtros para os meses
    if (values.mesM3.length > 0) {
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM3 === 1 ? 'ativo' : 'inativo';
        return values.mesM3.includes(valor);
      });
    }

    if (values.mesM2.length > 0) {
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM2 === 1 ? 'ativo' : 'inativo';
        return values.mesM2.includes(valor);
      });
    }

    if (values.mesM1.length > 0) {
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM1 === 1 ? 'ativo' : 'inativo';
        return values.mesM1.includes(valor);
      });
    }

    if (values.mesM0.length > 0) {
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM0 === 1 ? 'ativo' : 'inativo';
        return values.mesM0.includes(valor);
      });
    }

    // Aplicar ordenação
    filtrados.sort((a, b) => {
      const aValue = a[ordenacao.coluna];
      const bValue = b[ordenacao.coluna];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return ordenacao.direcao === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return ordenacao.direcao === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return ordenacao.direcao === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });

    setDadosFiltrados(filtrados);
    setCurrentPage(1);
  };

  const limparFiltros = () => {
    form.reset();
    setDadosFiltrados(dados);
    setCurrentPage(1);
  };

  const handleOrdenacao = (coluna: keyof DadosPontoAtivo) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
    // Aplicar filtros após mudança de ordenação
    setTimeout(() => aplicarFiltros(form.getValues()), 0);
  };

  const exportarParaExcel = () => {
    // Implementar exportação para Excel
    console.log('Exportando dados para Excel...');
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dadosFiltrados.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescimento':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'queda':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'atencao':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const renderSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'ativa':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle className="h-3 w-3 mr-1" />Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'bloqueada':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><XCircle className="h-3 w-3 mr-1" />Bloqueada</Badge>;
      default:
        return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  const renderNivelAtividadeBadge = (nivel: string) => {
    switch (nivel) {
      case 'alta':
        return <Badge className="bg-green-100 text-green-800">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case 'baixa':
        return <Badge className="bg-red-100 text-red-800">Baixa</Badge>;
      default:
        return <Badge variant="outline">{nivel}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  // Função para gerar nomes dos meses dinamicamente
  const getMonthNames = () => {
    const currentDate = new Date();
    const months = [];
    
    for (let i = 3; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = monthDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
      const year = monthDate.getFullYear().toString().slice(-2);
      const monthName = `${month}/${year}`;
      months.push(monthName);
    }
    
    return {
      M3: months[0], // Mês há 3 meses atrás
      M2: months[1], // Mês há 2 meses atrás
      M1: months[2], // Mês há 1 mês atrás
      M0: months[3]  // Mês atual
    };
  };

  const monthNames = getMonthNames();

  const ComboboxFilter = ({ 
    name, 
    title, 
    options,
    valueKey = 'value',
    labelKey = 'label'
  }: { 
    name: keyof FiltrosPontosAtivos; 
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
                      aplicarFiltros(form.getValues());
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
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleVoltar}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pontos Ativos</h1>
            <p className="text-gray-500">Monitoramento e estratégias para pontos ativos - {user?.name}</p>
          </div>
        </div>

        {/* Alert de Status */}
        {connectionStatus === 'error' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              <span className="font-medium">Aviso:</span>
              <span className="ml-2">{error || 'Usando dados de demonstração devido a um erro de conexão com o servidor.'}</span>
            </div>
            <p className="text-sm mt-1 ml-7">Para usar dados reais, verifique se o servidor está rodando.</p>
          </div>
        )}

        {/* Cards de Métricas */}
        <Card className="flex-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Resumo dos Pontos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                             <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                 <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                     <CardTitle className="text-sm font-semibold text-gray-900">Lojas Ativas em {format(new Date(), 'MMM/yy', {locale: ptBR}).toUpperCase()}</CardTitle>
                     <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                       <Building2 className="h-4 w-4 text-blue-600" />
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent className="pt-0">
                   <div>
                     <p className="text-2xl font-bold text-blue-800">{dados.filter(d => d.situacao === 'ativa' && d.mesM0 > 0).length}</p>
                     <p className="text-xs text-gray-600 mt-1">Correspondentes transacionando </p>
                   </div>
                 </CardContent>
               </Card>

              <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-gray-900">Pontos Ativos</CardTitle>
                    <div className="p-2 rounded-full bg-green-50 border border-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div>
                    <p className="text-2xl font-bold text-green-800">{dados.filter(d => d.situacao === 'ativa').length}</p>
                    <p className="text-xs text-gray-600 mt-1">Pontos em operação</p>
                  </div>
                </CardContent>
              </Card>


              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-gray-900">Pontos de Atenção</CardTitle>
                    <div className="p-2 rounded-full bg-amber-50 border border-amber-100">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div>
                    <p className="text-2xl font-bold text-amber-800">{dados.filter(d => d.tendencia === 'atencao' || d.tendencia === 'queda').length}</p>
                    <p className="text-xs text-gray-600 mt-1">Requerem atenção</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
                 </Card>

         {/* Cards de Performance & Evolução */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-none">
           {/* Card Performance & Evolução Unificado */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Activity className="h-5 w-5 text-blue-600" />
                 Performance & Evolução
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {/* Indicadores de Evolução */}
                 <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50/70 transition-all duration-200">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <TrendingUp className="h-5 w-5 text-blue-600" />
                       <span className="font-medium text-blue-800">Evolução de Pontos</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                         <TrendingUp className="h-5 w-5" />
                         15.2%
                       </div>
                       <Info className="h-4 w-4 text-blue-400" />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     {/* Variação Total */}
                     <div className="bg-white p-3 rounded-lg border border-blue-100">
                       <div className="text-sm text-blue-600 mb-1">Variação Total</div>
                       <div className="flex items-baseline gap-1">
                         <span className="text-xl font-bold text-blue-800">+12</span>
                         <span className="text-sm text-blue-600">pontos</span>
                       </div>
                       <div className="text-xs text-blue-500 mt-1">
                         JUN/25 → JUL/25
                       </div>
                     </div>

                     {/* Comparativo de Pontos Ativos */}
                     <div className="bg-white p-3 rounded-lg border border-green-100">
                       <div className="text-sm text-green-600 mb-1">Pontos Ativos</div>
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="text-sm text-gray-600">JUN/25</div>
                           <div className="text-lg font-bold text-green-800">78</div>
                         </div>
                         <div className="text-xl font-bold text-gray-300">→</div>
                         <div>
                           <div className="text-sm text-gray-600">JUL/25</div>
                           <div className="text-lg font-bold text-green-800">90</div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Indicadores de Performance */}
                 <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <Target className="h-5 w-5 text-green-600" />
                       <span className="font-medium text-green-800">Estabilidade dos Pontos</span>
                     </div>
                     <div className="text-lg font-bold text-green-600">85.2%</div>
                   </div>

                                    {/* Barra de Progresso */}
                 <div className="relative pt-1">
                   <div className="flex mb-2 items-center justify-between">
                     <div>
                       <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">
                         Estabilidade dos Pontos
                       </span>
                     </div>
                     <div className="text-right">
                       <span className="text-xs font-semibold inline-block text-green-600">
                         78/85 pontos estáveis
                       </span>
                     </div>
                   </div>
                   <div className="overflow-hidden h-2 text-xs flex rounded-full bg-green-100">
                     <div
                       style={{ width: '85.2%' }}
                       className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
                     />
                   </div>
                 </div>

                                    {/* Detalhamento */}
                 <div className="grid grid-cols-2 gap-4 mt-4">
                   <div className="bg-white p-3 rounded-lg border border-green-100">
                     <div className="text-sm text-green-600">Pontos Estáveis</div>
                     <div className="text-xl font-bold text-green-800">78</div>
                     <div className="text-xs text-green-500">3+ meses ativos</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-blue-100">
                     <div className="text-sm text-blue-600">Taxa de Retenção</div>
                     <div className="text-xl font-bold text-blue-800">92.3%</div>
                     <div className="text-xs text-blue-500">M0 vs M1</div>
                   </div>
                 </div>
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Card Atenção */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-amber-600" />
                 Pontos de Atenção
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {/* Card de Pontos que Zeraram */}
                 <div className="bg-gradient-to-r from-amber-50 to-red-50 p-4 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors duration-200">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <AlertTriangle className="h-5 w-5 text-amber-600" />
                       <span className="font-medium text-amber-800">Pontos que Zeraram</span>
                     </div>
                     <div className="text-lg font-bold text-amber-800">8</div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-3 rounded-lg border border-amber-100">
                       <div className="text-sm text-amber-600">Período</div>
                       <div className="text-base font-semibold text-amber-800">
                         JUN/25 → JUL/25
                       </div>
                       <div className="text-xs text-amber-500">Clique para filtrar</div>
                     </div>
                     <div className="bg-white p-3 rounded-lg border border-amber-100">
                       <div className="text-sm text-amber-600">Impacto</div>
                       <div className="text-base font-semibold text-amber-800">6.7%</div>
                       <div className="text-xs text-amber-500">do total de pontos</div>
                     </div>
                   </div>

                                    <div className="mt-4 text-sm text-amber-800 bg-amber-100 p-3 rounded-lg border border-amber-200 flex items-center gap-2">
                   <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                   <span>Esses pontos precisam de acompanhamento especial para recuperação</span>
                 </div>
               </div>

               {/* Card de Pontos Bloqueados */}
               <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors duration-200">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <XCircle className="h-5 w-5 text-gray-600" />
                     <span className="font-medium text-gray-800">Pontos Bloqueados</span>
                   </div>
                   <div className="text-lg font-bold text-gray-800">12</div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-3 rounded-lg border border-gray-100">
                     <div className="text-sm text-gray-600">Inativos M0</div>
                     <div className="text-base font-semibold text-gray-800">8</div>
                     <div className="text-xs text-gray-500">dos 12 bloqueados</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-gray-100">
                     <div className="text-sm text-gray-600">Tempo Médio</div>
                     <div className="text-base font-semibold text-gray-800">45 dias</div>
                     <div className="text-xs text-gray-500">em bloqueio</div>
                   </div>
                 </div>
                 <div className="mt-4 space-y-2">
                   <div className="bg-white p-3 rounded-lg border border-gray-100">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-sm text-gray-600">Principais Motivos</span>
                       <span className="text-xs text-gray-500">Top 3</span>
                     </div>
                     <div className="space-y-1">
                       <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-600">Documentação</span>
                         <span className="text-xs font-semibold text-gray-800">5 pontos</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-600">Compliance</span>
                         <span className="text-xs font-semibold text-gray-800">4 pontos</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-600">Operacional</span>
                         <span className="text-xs font-semibold text-gray-800">3 pontos</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>


               </div>
             </CardContent>
           </Card>
         </div>



         {/* Card Gestão e Manutenção */}
         <Card className="flex-none">
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center gap-2">
               <Wrench className="h-5 w-5 text-purple-600" />
               Gestão e Manutenção
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Padrões de Comportamento */}
               <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                 <div className="flex items-center gap-2 mb-3">
                   <BarChart3 className="h-5 w-5 text-purple-600" />
                   <span className="font-medium text-purple-800">Padrões de Comportamento</span>
                 </div>
                 <div className="space-y-3">
                   <div className="bg-white p-3 rounded-lg border border-purple-100">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-purple-600">Oscilantes</span>
                       <span className="text-base font-semibold text-purple-800">15</span>
                     </div>
                     <div className="text-xs text-purple-500 mt-1">1→0→1→0 (M3→M2→M1→M0)</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-purple-100">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-purple-600">Em Queda</span>
                       <span className="text-base font-semibold text-purple-800">8</span>
                     </div>
                     <div className="text-xs text-purple-500 mt-1">1→1→0→0 (M3→M2→M1→M0)</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-purple-100">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-purple-600">Recuperação</span>
                       <span className="text-base font-semibold text-purple-800">12</span>
                     </div>
                     <div className="text-xs text-purple-500 mt-1">0→0→1→1 (M3→M2→M1→M0)</div>
                   </div>
                 </div>
               </div>

               {/* Ações de Manutenção */}
               <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                 <div className="flex items-center gap-2 mb-3">
                   <Wrench className="h-5 w-5 text-orange-600" />
                   <span className="font-medium text-orange-800">Ações de Manutenção</span>
                 </div>
                 <div className="space-y-3">
                   <div className="bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-orange-600">Reativação Urgente</span>
                       <span className="text-base font-semibold text-orange-800">5</span>
                     </div>
                     <div className="text-xs text-orange-500 mt-1">0→0→0→0 (4 meses inativo)</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-orange-600">Monitoramento</span>
                       <span className="text-base font-semibold text-orange-800">18</span>
                     </div>
                     <div className="text-xs text-orange-500 mt-1">Padrão oscilante detectado</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-orange-600">Preventivo</span>
                       <span className="text-base font-semibold text-orange-800">25</span>
                     </div>
                     <div className="text-xs text-orange-500 mt-1">Tendência de queda</div>
                   </div>
                 </div>
               </div>

               {/* Indicadores de Saúde */}
               <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                 <div className="flex items-center gap-2 mb-3">
                   <Heart className="h-5 w-5 text-green-600" />
                   <span className="font-medium text-green-800">Saúde dos Pontos</span>
                 </div>
                 <div className="space-y-3">
                   <div className="bg-white p-3 rounded-lg border border-green-100">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-green-600">Saudáveis</span>
                       <span className="text-base font-semibold text-green-800">85</span>
                     </div>
                     <div className="text-xs text-green-500 mt-1">Ativos 3+ meses</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-green-100">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-green-600">Recuperados</span>
                       <span className="text-base font-semibold text-green-800">12</span>
                     </div>
                     <div className="text-xs text-green-500 mt-1">Retornaram à atividade</div>
                   </div>
                   <div className="bg-white p-3 rounded-lg border border-green-100">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-green-600">Estáveis</span>
                       <span className="text-base font-semibold text-green-800">32</span>
                     </div>
                     <div className="text-xs text-green-500 mt-1">Produção consistente</div>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>

         {/* Tabs */}
                 <Tabs defaultValue="pontos">
           <TabsList className="mb-4">
             <TabsTrigger value="pontos">Pontos Ativos</TabsTrigger>
             <TabsTrigger value="gestao">Gestão e Manutenção</TabsTrigger>
           </TabsList>

          <TabsContent value="pontos">
            <Card>
              <CardHeader>
                <CardTitle>Quadro de Pontos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <Form {...form}>
                    <form className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Search size={16} />
                          Filtrar pontos ativos
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

                                             <div className="flex flex-wrap gap-2">
                         <ComboboxFilter
                           name="situacao"
                           title="Situação"
                           options={situacoes.map(s => ({
                             value: s,
                             label: s === "ativa" ? "Ativa" : 
                                    s === "inativa" ? "Inativa" : 
                                    s === "bloqueada" ? "Bloqueada" :
                                    s
                           }))}
                           valueKey="value"
                           labelKey="label"
                         />
                         <ComboboxFilter
                           name="nivelAtividade"
                           title="Nível de Atividade"
                           options={niveisAtividade.map(n => ({
                             value: n,
                             label: n === "alta" ? "Alta" : 
                                    n === "media" ? "Média" : 
                                    "Baixa"
                           }))}
                           valueKey="value"
                           labelKey="label"
                         />
                         <ComboboxFilter
                           name="tendencia"
                           title="Tendência"
                           options={tendencias.map(t => ({
                             value: t,
                             label: t === "crescimento" ? "Crescimento" :
                                    t === "estavel" ? "Estável" :
                                    t === "queda" ? "Queda" :
                                    "Atenção"
                           }))}
                           valueKey="value"
                           labelKey="label"
                         />
                         <ComboboxFilter
                           name="gerenciaRegional"
                           title="Gerência Regional"
                           options={gerenciasRegionais}
                         />
                         <ComboboxFilter
                           name="diretoriaRegional"
                           title="Diretoria Regional"
                           options={diretoriasRegionais}
                         />
                         <ComboboxFilter
                           name="municipio"
                           title="Município"
                           options={municipios}
                         />
                         <ComboboxFilter
                           name="uf"
                           title="UF"
                           options={ufs}
                         />
                         <ComboboxFilter
                           name="agencia"
                           title="Agência"
                           options={agencias}
                         />
                         
                         {/* Botão Análise */}
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => setShowAnaliseFiltros(!showAnaliseFiltros)}
                           className={cn(
                             "flex items-center gap-2 transition-all duration-200",
                             showAnaliseFiltros 
                               ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100" 
                               : "hover:bg-gray-50"
                           )}
                         >
                           <BarChart3 size={16} />
                           Análise
                           {showAnaliseFiltros && (
                             <div className="ml-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                           )}
                         </Button>
                       </div>

                       {/* Filtros de Análise - Aparecem quando showAnaliseFiltros é true */}
                       {showAnaliseFiltros && (
                         <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 animate-in slide-in-from-top-2 duration-300">
                           <div className="flex items-center gap-2 mb-3">
                             <div className="w-2 h-2 rounded-full bg-blue-500" />
                             <span className="text-sm font-medium text-blue-800">Análise Temporal por Mês</span>
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             <ComboboxFilter
                               name="mesM3"
                               title={`${monthNames.M3} - Status`}
                               options={[
                                 { value: 'ativo', label: 'Ativo' },
                                 { value: 'inativo', label: 'Inativo' }
                               ]}
                               valueKey="value"
                               labelKey="label"
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
                              <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                                {Object.entries(form.getValues()).map(([key, values]) => {
                                  if (!Array.isArray(values) || values.length === 0) return null;
                                  return values.map((value: string) => {
                                    let label = value;
                                    if (key === 'situacao') {
                                      label = value === "ativa" ? "Ativa" : 
                                             value === "inativa" ? "Inativa" : 
                                             value === "bloqueada" ? "Bloqueada" :
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
                                        className="cursor-pointer hover:bg-red-100 hover:border-red-300 transition-colors shrink-0"
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

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="w-[180px] cursor-pointer hover:bg-gray-100" 
                          onClick={() => handleOrdenacao('chaveLoja')}
                        >
                          <div className="flex items-center gap-1">
                            Chave Loja
                            {ordenacao.coluna === 'chaveLoja' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[250px] cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrdenacao('nomeLoja')}
                        >
                          <div className="flex items-center gap-1">
                            Nome Loja
                            {ordenacao.coluna === 'nomeLoja' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-center" colSpan={4}>
                          <div className="mb-1">Ativo</div>
                          <div className="grid grid-cols-4 gap-2 text-xs font-normal">
                            <div 
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('mesM3')}
                            >
                              {monthNames.M3} {ordenacao.coluna === 'mesM3' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                            </div>
                            <div 
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('mesM2')}
                            >
                              {monthNames.M2} {ordenacao.coluna === 'mesM2' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                            </div>
                            <div 
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('mesM1')}
                            >
                              {monthNames.M1} {ordenacao.coluna === 'mesM1' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                            </div>
                            <div 
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('mesM0')}
                            >
                              {monthNames.M0} {ordenacao.coluna === 'mesM0' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[120px] text-center cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrdenacao('situacao')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Situação
                            {ordenacao.coluna === 'situacao' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[120px] text-center cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrdenacao('dataUltimaTransacao')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Últ. Transação
                            {ordenacao.coluna === 'dataUltimaTransacao' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="w-[100px] text-center cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrdenacao('tendencia')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Tendência
                            {ordenacao.coluna === 'tendencia' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="w-[150px] text-center">
                          <div className="flex items-center justify-center">Ações</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCurrentPageData().map((ponto) => (
                        <TableRow key={ponto.chaveLoja}>
                          <TableCell className="font-medium">
                            <div>{ponto.chaveLoja}</div>
                            <div className="text-xs text-gray-500">{ponto.cnpj}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{ponto.nomeLoja}</div>
                            <div className="text-xs text-gray-500">
                              {ponto.agencia} - {ponto.gerenciaRegional}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <div className="flex justify-center">
                              {ponto.mesM3 === 1 ? (
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <div className="flex justify-center">
                              {ponto.mesM2 === 1 ? (
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <div className="flex justify-center">
                              {ponto.mesM1 === 1 ? (
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <div className="flex justify-center">
                              {ponto.mesM0 === 1 ? (
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {ponto.situacao === "ativa" ? (
                                <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                              ) : ponto.situacao === "bloqueada" ? (
                                <Badge className="bg-red-100 text-red-800">Bloqueada</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{formatDate(ponto.dataUltimaTransacao)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              {renderTendenciaIcon(ponto.tendencia)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                title="Ver detalhes"
                                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                              >
                                <Info size={16} className="text-blue-600" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                title="Adicionar tratativa"
                                className="bg-green-50 border-green-200 hover:bg-green-100"
                              >
                                <Plus size={16} className="text-green-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {dadosFiltrados.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, dadosFiltrados.length)} de {dadosFiltrados.length} pontos
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(dadosFiltrados.length / itemsPerPage)}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
                     </TabsContent>

           <TabsContent value="gestao">
             <Card>
               <CardHeader>
                 <CardTitle>Gestão e Manutenção de Pontos</CardTitle>
                 <p className="text-sm text-gray-500">Análise temporal e ações de manutenção baseadas nos padrões M3→M2→M1→M0</p>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                   {/* Análise Temporal */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                           <BarChart3 className="h-5 w-5 text-blue-600" />
                           Análise Temporal dos Padrões
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-4">
                           <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                             <h4 className="font-medium text-blue-800 mb-3">Padrões Identificados</h4>
                             <div className="space-y-3">
                               <div className="bg-white p-3 rounded-lg border border-blue-100">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-blue-600">Oscilante (1→0→1→0)</span>
                                   <span className="text-base font-semibold text-blue-800">15 pontos</span>
                                 </div>
                                 <div className="text-xs text-blue-500 mt-1">Comportamento instável - requer monitoramento</div>
                               </div>
                               <div className="bg-white p-3 rounded-lg border border-red-100">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-red-600">Em Queda (1→1→0→0)</span>
                                   <span className="text-base font-semibold text-red-800">8 pontos</span>
                                 </div>
                                 <div className="text-xs text-red-500 mt-1">Tendência de desativação - ação urgente</div>
                               </div>
                               <div className="bg-white p-3 rounded-lg border border-green-100">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-green-600">Recuperação (0→0→1→1)</span>
                                   <span className="text-base font-semibold text-green-800">12 pontos</span>
                                 </div>
                                 <div className="text-xs text-green-500 mt-1">Retornaram à atividade - manter suporte</div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

                     <Card>
                       <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                           <Wrench className="h-5 w-5 text-orange-600" />
                           Ações de Manutenção
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-4">
                           <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                             <h4 className="font-medium text-orange-800 mb-3">Prioridades de Ação</h4>
                             <div className="space-y-3">
                               <div className="bg-white p-3 rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-red-600">Reativação Urgente</span>
                                   <span className="text-base font-semibold text-red-800">5 pontos</span>
                                 </div>
                                 <div className="text-xs text-red-500 mt-1">0→0→0→0 (4 meses inativo)</div>
                                 <div className="text-xs text-red-500">Ação: Contato imediato + visita técnica</div>
                               </div>
                               <div className="bg-white p-3 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-50 transition-colors">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-orange-600">Monitoramento Intensivo</span>
                                   <span className="text-base font-semibold text-orange-800">18 pontos</span>
                                 </div>
                                 <div className="text-xs text-orange-500 mt-1">Padrão oscilante detectado</div>
                                 <div className="text-xs text-orange-500">Ação: Acompanhamento semanal</div>
                               </div>
                               <div className="bg-white p-3 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-50 transition-colors">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-yellow-600">Preventivo</span>
                                   <span className="text-base font-semibold text-yellow-800">25 pontos</span>
                                 </div>
                                 <div className="text-xs text-yellow-500 mt-1">Tendência de queda</div>
                                 <div className="text-xs text-yellow-500">Ação: Suporte preventivo</div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>

                   {/* Tabela de Pontos com Análise Temporal */}
                   <Card>
                     <CardHeader>
                       <CardTitle>Análise Detalhada por Ponto</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="overflow-x-auto">
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead>Chave Loja</TableHead>
                               <TableHead>Última Transação</TableHead>
                               <TableHead>Padrão M3→M2→M1→M0</TableHead>
                               <TableHead>Status</TableHead>
                               <TableHead>Ação Recomendada</TableHead>
                               <TableHead>Prioridade</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             <TableRow>
                               <TableCell className="font-medium">10628</TableCell>
                               <TableCell>02/02/2025</TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-1">
                                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">1</span>
                                   <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">0</span>
                                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">1</span>
                                   <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">0</span>
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <Badge className="bg-orange-100 text-orange-800">Oscilante</Badge>
                               </TableCell>
                               <TableCell>Monitoramento Intensivo</TableCell>
                               <TableCell>
                                 <Badge className="bg-orange-100 text-orange-800">Média</Badge>
                               </TableCell>
                             </TableRow>
                             <TableRow>
                               <TableCell className="font-medium">10629</TableCell>
                               <TableCell>01/02/2025</TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-1">
                                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">1</span>
                                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">1</span>
                                   <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">0</span>
                                   <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">0</span>
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <Badge className="bg-red-100 text-red-800">Em Queda</Badge>
                               </TableCell>
                               <TableCell>Reativação Urgente</TableCell>
                               <TableCell>
                                 <Badge className="bg-red-100 text-red-800">Alta</Badge>
                               </TableCell>
                             </TableRow>
                             <TableRow>
                               <TableCell className="font-medium">10630</TableCell>
                               <TableCell>03/02/2025</TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-1">
                                   <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">0</span>
                                   <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">0</span>
                                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">1</span>
                                   <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">1</span>
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <Badge className="bg-green-100 text-green-800">Recuperação</Badge>
                               </TableCell>
                               <TableCell>Manter Suporte</TableCell>
                               <TableCell>
                                 <Badge className="bg-green-100 text-green-800">Baixa</Badge>
                               </TableCell>
                             </TableRow>
                           </TableBody>
                         </Table>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default PontosAtivos; 