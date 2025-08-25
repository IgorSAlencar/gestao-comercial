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
  BarChart3,
  Eye,
  EyeOff,
  Wrench,
  Heart,
  Plus
} from "lucide-react";
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
import { estrategiaComercialApi } from "@/services/estrategiaComercialService";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/context/AuthContext";

// Tipos específicos para Pontos Ativos
interface DadosPontoAtivo {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  situacao: "ativa" | "inativa" | "bloqueada";
  dataUltimaTransacao: Date | string;
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
  dataInauguracao: Date | string;
  dataCertificacao: Date | string;
  situacaoTablet: "Instalado" | "Pendente" | "Não Instalado";
  multiplicadorResponsavel: string;
  supervisorResponsavel: string;
  chaveSupervisao: string;
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
    supervisorResponsavel: "João Supervisor",
    chaveSupervisao: "SUP001",
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
    supervisorResponsavel: "Maria Supervisora",
    chaveSupervisao: "SUP002",
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
    supervisorResponsavel: "Pedro Supervisor",
    chaveSupervisao: "SUP003",
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
  const { user, isManager, isAdmin } = useAuth();
  const [dados, setDados] = useState<DadosPontoAtivo[]>([]);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosPontoAtivo[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [ordenacao, setOrdenacao] = useState({ coluna: 'chaveLoja' as keyof DadosPontoAtivo, direcao: 'asc' as 'asc' | 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [showAnaliseFiltros, setShowAnaliseFiltros] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHierarchyColumns, setShowHierarchyColumns] = useState(false);

  const form = useForm<FiltrosPontosAtivos>({
    defaultValues: {
      chaveLoja: "",
      nomeLoja: "",
      situacao: [],
      gerenciaRegional: [],
      diretoriaRegional: [],
      supervisorResponsavel: [],
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

  // Função auxiliar para calcular nível de atividade
  const calcularNivelAtividade = (m0: number): "alta" | "media" | "baixa" => {
    if (m0 >= 5) return "alta";
    if (m0 >= 2) return "media";
    return "baixa";
  };



  // Opções para filtros
  const situacoes = ["ativa", "inativa", "bloqueada"];
  const tendencias = ["crescimento", "estavel", "queda", "atencao"];
  const niveisAtividade = ["alta", "media", "baixa"];
  const gerenciasRegionais = [...new Set(dados.map(d => d.gerenciaRegional))];
  const diretoriasRegionais = [...new Set(dados.map(d => d.diretoriaRegional))];
  const municipios = [...new Set(dados.map(d => d.municipio))];
  const ufs = [...new Set(dados.map(d => d.uf))];
  const agencias = [...new Set(dados.map(d => d.agencia))];
  const multiplicadoresResponsaveis = [...new Set(dados.map(d => d.multiplicadorResponsavel))];
  const supervisoresResponsaveis = [...new Set(dados.map(d => d.supervisorResponsavel))];

  // Função para carregar dados da API
  const loadPontosAtivos = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError('');
      setConnectionStatus('loading');
      
      // Verificar se o usuário tem chave definida
      if (!user.chave && user.role !== 'admin') {
        const errorMsg = `Usuário ${user.name} (${user.role}) não possui chave de hierarquia definida. 
        
Para corrigir:
1. Execute o script SQL: src/sql/fix_user_keys.sql
2. Verifique se o usuário tem chave na tabela TESTE..users
3. Faça logout e login novamente

Entre em contato com o administrador se o problema persistir.`;
        
        setError(errorMsg);
        setConnectionStatus('error');
        // Fallback para dados simulados
        setDados(dadosSimulados);
        setDadosFiltrados(dadosSimulados);
        return;
      }
      
      // Buscar dados da estratégia pontos-ativos
      const response = await estrategiaComercialApi.getEstrategia('pontos-ativos');
      
      // Mapear dados para o formato esperado
      const dadosFormatados: DadosPontoAtivo[] = response.dadosAnaliticos.map(loja => ({
        chaveLoja: loja.chaveLoja,
        cnpj: loja.cnpj,
        nomeLoja: loja.nomeLoja,
        situacao: loja.situacao as "ativa" | "inativa" | "bloqueada",
        // Manter data como string para evitar problemas de fuso horário
        dataUltimaTransacao: loja.dataUltTrxNegocio as any,
        mesM3: loja.mesM3,
        mesM2: loja.mesM2,
        mesM1: loja.mesM1,
        mesM0: loja.mesM0,
        endereco: loja.endereco,
        municipio: loja.municipio || '',
        uf: loja.uf || '',
        agencia: loja.agencia,
        gerenciaRegional: loja.gerenciaRegional,
        diretoriaRegional: loja.diretoriaRegional,
        telefoneLoja: loja.telefoneLoja,
        nomeContato: loja.nomeContato,
        // Manter datas como string para evitar problemas de fuso horário
        dataInauguracao: loja.dataInauguracao as any,
        dataCertificacao: (loja.dataCertificacao || loja.dataInauguracao) as any,
        situacaoTablet: loja.situacaoTablet as "Instalado" | "Pendente" | "Não Instalado",
        multiplicadorResponsavel: loja.multiplicadorResponsavel,
        supervisorResponsavel: loja.supervisorResponsavel || '',
        chaveSupervisao: loja.chaveSupervisao || '',
        tendencia: loja.tendencia as "crescimento" | "estavel" | "queda" | "atencao",
        nivelAtividade: calcularNivelAtividade(loja.mesM0),
        produtosHabilitados: loja.produtosHabilitados || {
          consignado: false,
          microsseguro: false,
          lime: false
        }
      }));
      
      setDados(dadosFormatados);
      setDadosFiltrados(dadosFormatados);
      setConnectionStatus('success');
      
    } catch (err: any) {
      console.error('Erro ao carregar pontos ativos:', err);
      
      let errorMessage = err.message || 'Erro ao carregar dados dos pontos ativos';
      
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        errorMessage = `Erro de conexão com o servidor. 
        
Verifique:
1. Se o backend está rodando
2. Se as tabelas TB_ESTR_LOJAS e TB_ESTR_ATIVO existem
3. Execute os scripts SQL necessários para popular as tabelas`;
      }
      
      setError(errorMessage);
      setConnectionStatus('error');
      
      // Fallback para dados simulados
      setDados(dadosSimulados);
      setDadosFiltrados(dadosSimulados);
      
    } finally {
      setIsLoading(false);
    }
  };

  // UseEffect para carregar dados
  useEffect(() => {
    loadPontosAtivos();
  }, [user]);

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

    if (values.supervisorResponsavel.length > 0) {
      filtrados = filtrados.filter(loja => values.supervisorResponsavel.includes(loja.supervisorResponsavel));
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
    //console.log('Exportando dados para Excel...');
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dadosFiltrados.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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

  // Usando a função formatDate do utils que corrige problemas de fuso horário
  // const formatDate é importada do @/utils/formatDate

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

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="flex flex-col space-y-6">
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
              <p className="text-gray-500">Carregando dados dos pontos ativos...</p>
            </div>
          </div>
          
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-500">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

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
        
        {/* Grid Principal */}
               <div className="space-y-4">
          {/* Gráfico de Tendência - Convertendo DadosPontoAtivo para DadosLoja */}
                     <GraficoTendencia 
             showTendenciaCard={false}
             tipoMetrica="ativos"
             onTendenciaClick={(tendencia) => {
               const lojasFiltradas = dados.filter(loja => loja.tendencia === tendencia);
               setDadosFiltrados(lojasFiltradas);
               setCurrentPage(1);
             }}
             dadosAnaliticos={dados.map(ponto => ({
              chaveLoja: ponto.chaveLoja,
              cnpj: ponto.cnpj,
              nomeLoja: ponto.nomeLoja,
              mesM3: ponto.mesM3,
              mesM2: ponto.mesM2,
              mesM1: ponto.mesM1,
              mesM0: ponto.mesM0,
              situacao: ponto.situacao,
              dataUltTrxContabil: new Date(ponto.dataUltimaTransacao),
              dataUltTrxNegocio: new Date(ponto.dataUltimaTransacao),
              dataInauguracao: new Date(ponto.dataInauguracao),
              agencia: ponto.agencia,
              codAgRelacionamento: ponto.agencia,
              agRelacionamento: ponto.agencia,
              telefoneLoja: ponto.telefoneLoja,
              nomeContato: ponto.nomeContato,
              gerenciaRegional: ponto.gerenciaRegional,
              diretoriaRegional: ponto.diretoriaRegional,
              tendencia: ponto.tendencia,
              endereco: ponto.endereco,
              nomePdv: ponto.nomeLoja,
              multiplicadorResponsavel: ponto.multiplicadorResponsavel,
              dataCertificacao: new Date(ponto.dataCertificacao),
              situacaoTablet: ponto.situacaoTablet,
              municipio: ponto.municipio,
              uf: ponto.uf,
              produtosHabilitados: ponto.produtosHabilitados
            }))} 
            onZeradosClick={() => {
              // Filtrar lojas que tinham atividade em M1 mas zeraram em M0
              const lojasFiltradas = dados.filter(loja => 
                (loja.mesM1 || 0) > 0 && (loja.mesM0 || 0) === 0
              );
              setDadosFiltrados(lojasFiltradas);
              setCurrentPage(1);
            }}
            onQuedaProducaoClick={() => {
              // Filtrar lojas com queda na atividade (M0 menor que M1)
              const lojasFiltradas = dados.filter(loja => 
                (loja.mesM0 || 0) < (loja.mesM1 || 0) && (loja.mesM1 || 0) > 0
              );
              setDadosFiltrados(lojasFiltradas);
              setCurrentPage(1);
            }}
          />

         <Tabs defaultValue="pontos">
           <TabsList className="mb-4">
             <TabsTrigger value="pontos">Pontos Ativos</TabsTrigger>

           </TabsList>

          <TabsContent value="pontos">
           <Card>
              <CardHeader>
                <CardTitle>Quadro de Pontos Ativos</CardTitle>
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
                   {(() => {
                     // Calcular padrões baseados nos dados reais
                     const oscilantes = dados.filter(d => 
                       (d.mesM3 > 0 && d.mesM2 === 0 && d.mesM1 > 0 && d.mesM0 === 0) ||
                       (d.mesM3 === 0 && d.mesM2 > 0 && d.mesM1 === 0 && d.mesM0 > 0)
                     ).length;
                     
                     const emQueda = dados.filter(d => 
                       d.mesM3 > 0 && d.mesM2 > 0 && d.mesM1 === 0 && d.mesM0 === 0
                     ).length;
                     
                     const recuperacao = dados.filter(d => 
                       d.mesM3 === 0 && d.mesM2 === 0 && d.mesM1 > 0 && d.mesM0 > 0
                     ).length;
                     
                     return (
                       <>
                         <div className="bg-white p-3 rounded-lg border border-purple-100">
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-purple-600">Oscilantes</span>
                             <span className="text-base font-semibold text-purple-800">{oscilantes}</span>
                           </div>
                           <div className="text-xs text-purple-500 mt-1">Padrão 1→0→1→0 ou 0→1→0→1</div>
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-purple-100">
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-purple-600">Em Queda</span>
                             <span className="text-base font-semibold text-purple-800">{emQueda}</span>
                           </div>
                           <div className="text-xs text-purple-500 mt-1">Padrão 1→1→0→0 (M3→M2→M1→M0)</div>
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-purple-100">
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-purple-600">Recuperação</span>
                             <span className="text-base font-semibold text-purple-800">{recuperacao}</span>
                           </div>
                           <div className="text-xs text-purple-500 mt-1">Padrão 0→0→1→1 (M3→M2→M1→M0)</div>
                         </div>
                       </>
                     );
                   })()}
                 </div>
               </div>

               {/* Ações de Manutenção */}
               <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                 <div className="flex items-center gap-2 mb-3">
                   <Wrench className="h-5 w-5 text-orange-600" />
                   <span className="font-medium text-orange-800">Ações de Manutenção</span>
                 </div>
                 <div className="space-y-3">
                   {(() => {
                     // Calcular ações de manutenção baseadas nos dados reais
                     const reativacaoUrgente = dados.filter(d => 
                       d.mesM3 === 0 && d.mesM2 === 0 && d.mesM1 === 0 && d.mesM0 === 0
                     ).length;
                     
                     const monitoramento = dados.filter(d => 
                       d.tendencia === 'atencao' || 
                       (d.mesM3 > 0 && d.mesM2 === 0 && d.mesM1 > 0) ||
                       (d.mesM2 > 0 && d.mesM1 === 0 && d.mesM0 > 0)
                     ).length;
                     
                     const preventivo = dados.filter(d => 
                       d.tendencia === 'queda' || 
                       (d.mesM1 > d.mesM0 && d.mesM0 > 0) ||
                       (d.mesM2 > d.mesM1 && d.mesM1 > d.mesM0)
                     ).length;
                     
                     return (
                       <>
                         <div 
                           className="bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors"
                           onClick={() => {
                             const filtrados = dados.filter(d => 
                               d.mesM3 === 0 && d.mesM2 === 0 && d.mesM1 === 0 && d.mesM0 === 0
                             );
                             setDadosFiltrados(filtrados);
                             setCurrentPage(1);
                           }}
                         >
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-orange-600">Reativação Urgente</span>
                             <span className="text-base font-semibold text-orange-800">{reativacaoUrgente}</span>
                           </div>
                           <div className="text-xs text-orange-500 mt-1">0→0→0→0 (4 meses inativo)</div>
                         </div>
                         <div 
                           className="bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors"
                           onClick={() => {
                             const filtrados = dados.filter(d => 
                               d.tendencia === 'atencao' || 
                               (d.mesM3 > 0 && d.mesM2 === 0 && d.mesM1 > 0) ||
                               (d.mesM2 > 0 && d.mesM1 === 0 && d.mesM0 > 0)
                             );
                             setDadosFiltrados(filtrados);
                             setCurrentPage(1);
                           }}
                         >
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-orange-600">Monitoramento</span>
                             <span className="text-base font-semibold text-orange-800">{monitoramento}</span>
                           </div>
                           <div className="text-xs text-orange-500 mt-1">Padrão oscilante detectado</div>
                         </div>
                         <div 
                           className="bg-white p-3 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-50 transition-colors"
                           onClick={() => {
                             const filtrados = dados.filter(d => 
                               d.tendencia === 'queda' || 
                               (d.mesM1 > d.mesM0 && d.mesM0 > 0) ||
                               (d.mesM2 > d.mesM1 && d.mesM1 > d.mesM0)
                             );
                             setDadosFiltrados(filtrados);
                             setCurrentPage(1);
                           }}
                         >
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-orange-600">Preventivo</span>
                             <span className="text-base font-semibold text-orange-800">{preventivo}</span>
                           </div>
                           <div className="text-xs text-orange-500 mt-1">Tendência de queda</div>
                         </div>
                       </>
                     );
                   })()}
                 </div>
               </div>

               {/* Indicadores de Saúde */}
               <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                 <div className="flex items-center gap-2 mb-3">
                   <Heart className="h-5 w-5 text-green-600" />
                   <span className="font-medium text-green-800">Saúde dos Pontos</span>
                 </div>
                 <div className="space-y-3">
                   {(() => {
                     // Calcular indicadores de saúde baseados nos dados reais
                     const saudaveis = dados.filter(d => 
                       d.mesM3 > 0 && d.mesM2 > 0 && d.mesM1 > 0 && d.mesM0 > 0
                     ).length;
                     
                     const recuperados = dados.filter(d => 
                       (d.mesM2 === 0 || d.mesM1 === 0) && d.mesM0 > 0 && d.situacao === 'ativa'
                     ).length;
                     
                     const estaveis = dados.filter(d => 
                       d.tendencia === 'estavel' && d.mesM0 > 0
                     ).length;
                     
                     return (
                       <>
                         <div 
                           className="bg-white p-3 rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                           onClick={() => {
                             const filtrados = dados.filter(d => 
                               d.mesM3 > 0 && d.mesM2 > 0 && d.mesM1 > 0 && d.mesM0 > 0
                             );
                             setDadosFiltrados(filtrados);
                             setCurrentPage(1);
                           }}
                         >
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-green-600">Saudáveis</span>
                             <span className="text-base font-semibold text-green-800">{saudaveis}</span>
                           </div>
                           <div className="text-xs text-green-500 mt-1">Ativos 4 meses consecutivos</div>
                         </div>
                         <div 
                           className="bg-white p-3 rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                           onClick={() => {
                             const filtrados = dados.filter(d => 
                               (d.mesM2 === 0 || d.mesM1 === 0) && d.mesM0 > 0 && d.situacao === 'ativa'
                             );
                             setDadosFiltrados(filtrados);
                             setCurrentPage(1);
                           }}
                         >
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-green-600">Recuperados</span>
                             <span className="text-base font-semibold text-green-800">{recuperados}</span>
                           </div>
                           <div className="text-xs text-green-500 mt-1">Retornaram à atividade</div>
                         </div>
                         <div 
                           className="bg-white p-3 rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                           onClick={() => {
                             const filtrados = dados.filter(d => 
                               d.tendencia === 'estavel' && d.mesM0 > 0
                             );
                             setDadosFiltrados(filtrados);
                             setCurrentPage(1);
                           }}
                         >
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-green-600">Estáveis</span>
                             <span className="text-base font-semibold text-green-800">{estaveis}</span>
                           </div>
                           <div className="text-xs text-green-500 mt-1">Produção consistente</div>
                         </div>
                       </>
                     );
                   })()}
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>


            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Quadro de Pontos Ativos</CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                    <span className="text-sm font-medium text-blue-800">
                      {dadosFiltrados.length} {dadosFiltrados.length === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                </div>
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

                         {/* Filtros de hierarquia para admin quando colunas estão visíveis */}
                         {isAdmin && showHierarchyColumns && (
                           <>
                             <ComboboxFilter
                               name="gerenciaRegional"
                               title="Gerente"
                               options={gerenciasRegionais.map(g => ({ value: g, label: g }))}
                               valueKey="value"
                               labelKey="label"
                             />
                             <ComboboxFilter
                               name="diretoriaRegional"
                               title="Coordenador"
                               options={diretoriasRegionais.map(d => ({ value: d, label: d }))}
                               valueKey="value"
                               labelKey="label"
                             />
                             <ComboboxFilter
                               name="supervisorResponsavel"
                               title="Supervisor"
                               options={supervisoresResponsaveis.map(s => ({ value: s, label: s }))}
                               valueKey="value"
                               labelKey="label"
                             />
                           </>
                         )}
                         
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
                  <Table className="min-w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="w-[140px] cursor-pointer hover:bg-gray-100" 
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
                          className="w-[200px] cursor-pointer hover:bg-gray-100"
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
                          className="w-[100px] text-center cursor-pointer hover:bg-gray-100"
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
                          className="w-[110px] text-center cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrdenacao('dataUltimaTransacao')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Últ. Transação
                            {ordenacao.coluna === 'dataUltimaTransacao' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>

                        {/* Controle de visibilidade das colunas de hierarquia para admin */}
                        {isAdmin && (
                          <TableHead className="w-[50px] text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowHierarchyColumns(!showHierarchyColumns)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title={showHierarchyColumns ? "Ocultar colunas de hierarquia" : "Mostrar colunas de hierarquia"}
                            >
                              {showHierarchyColumns ? (
                                <EyeOff className="h-4 w-4 text-gray-600" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                          </TableHead>
                        )}

                        {/* Colunas de hierarquia para usuários admin */}
                        {isAdmin && showHierarchyColumns && (
                          <>
                            <TableHead 
                              className="w-[120px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('gerenciaRegional')}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate">Gerente</span>
                                {ordenacao.coluna === 'gerenciaRegional' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('diretoriaRegional')}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate">Coordenador</span>
                                {ordenacao.coluna === 'diretoriaRegional' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('supervisorResponsavel')}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate">Supervisor</span>
                                {ordenacao.coluna === 'supervisorResponsavel' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                          </>
                        )}

                        <TableHead className="w-[120px] text-center">
                          <div className="flex items-center justify-center">Ações</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCurrentPageData().map((ponto) => (
                        <TableRow key={ponto.chaveLoja}>
                          <TableCell className="font-medium">
                            <div className="truncate">{ponto.chaveLoja}</div>
                            <div className="text-xs text-gray-500 truncate">{ponto.cnpj}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium truncate" title={ponto.nomeLoja}>{ponto.nomeLoja}</div>
                            <div className="text-xs text-gray-500 truncate">
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
                          
                          {/* Célula vazia para o botão de olho */}
                          {isAdmin && (
                            <TableCell className="text-center">
                              {/* Célula vazia apenas para manter alinhamento com o cabeçalho */}
                            </TableCell>
                          )}

                          {/* Colunas de hierarquia para usuários admin */}
                          {isAdmin && showHierarchyColumns && (
                            <>
                              <TableCell className="text-left">
                                <div className="text-sm text-gray-900 truncate" title={ponto.gerenciaRegional}>
                                  {ponto.gerenciaRegional}
                                </div>
                              </TableCell>
                              <TableCell className="text-left">
                                <div className="text-sm text-gray-900 truncate" title={ponto.diretoriaRegional}>
                                  {ponto.diretoriaRegional}
                                </div>
                              </TableCell>
                              <TableCell className="text-left">
                                <div className="text-sm text-gray-900 truncate" title={ponto.supervisorResponsavel}>
                                  {ponto.supervisorResponsavel}
                                </div>
                              </TableCell>
                            </>
                          )}
                          
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Ver detalhes"
                                className="bg-blue-50 border-blue-200 hover:bg-blue-100 h-8 w-8 p-0"
                              >
                                <Info size={14} className="text-blue-600" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Adicionar tratativa"
                                className="bg-green-50 border-green-200 hover:bg-green-100 h-8 w-8 p-0"
                              >
                                <Plus size={14} className="text-green-600" />
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

           
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PontosAtivos; 