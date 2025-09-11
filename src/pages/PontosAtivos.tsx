import React, { useEffect, useMemo, useState } from "react";
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
  Loader2,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import GraficoTendencia from "@/components/GraficoTendencia";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { ptBR } from "date-fns/locale";
import { estrategiaComercialApi, CascataResponse } from "@/services/estrategiaComercialService";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/context/AuthContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  Cell,
  LabelList,
  Line,
} from "recharts";

// Tipos específicos para Pontos Ativos
interface DadosPontoAtivo {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  situacao: "REATIVAÇÃO" | "BLOQUEADO" | "CONTRATAÇÃO" | "MANTEVE" | "ENCERRADO" | "EQUIP_RETIRADA" | "INOPERANTE";
  dataUltimaTransacao: Date | string;
  mesM3: number;
  mesM2: number;
  mesM1: number;
  mesM0: number;
  segmento: string;
  tipo_posto: string;
  endereco: string;
  municipio: string;
  uf: string;
  agencia: string;
  nome_agencia: string;
  nome_paa: string;
  chave_paa: string;
  gerenciaRegional: string;
  dt_bloqueio: Date | string;
  motivo_bloqueio: string;
  diretoriaRegional: string;
  gerenteArea: string;
  coordenador: string;
  supervisor: string;
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
    conta: boolean;
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
    situacao: "REATIVAÇÃO",
    dataUltimaTransacao: new Date("2024-01-15"),
    mesM3: 1,
    mesM2: 0,
    mesM1: 0,   
    mesM0: 1,
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP",
    municipio: "São Paulo",
    uf: "SP",
    agencia: "0001",
    nome_agencia: "Agência Centro",
    nome_paa: "Ponto Centro",
    chave_paa: "PAA001",
    gerenciaRegional: "São Paulo Centro",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),
    motivo_bloqueio: "Motivo Bloqueio",
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
      lime: false,
      conta: true
    }
  },
  {
    chaveLoja: "5002",
    cnpj: "23.456.789/0001-88",
    nomeLoja: "Loja Shopping Vila Olímpia",
    situacao: "BLOQUEADO",
    dataUltimaTransacao: new Date("2024-01-10"),
    mesM3: 1,
    mesM2: 1,
    mesM1: 1,
    mesM0: 0,
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP",
    municipio: "São Paulo",
    uf: "SP",
    agencia: "0002",
    nome_agencia: "Agência Vila Olímpia",
    nome_paa: "Ponto Vila Olímpia",
    chave_paa: "PAA002",
    gerenciaRegional: "São Paulo Zona Sul",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),
    motivo_bloqueio: "Motivo Bloqueio",
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
      lime: true,
      conta: true
    }
  },
  {
    chaveLoja: "5003",
    cnpj: "34.567.890/0001-77",
    nomeLoja: "Loja Campinas Shopping",
    situacao: "CONTRATAÇÃO",
    dataUltimaTransacao: new Date("2024-01-12"),
    mesM3: 0,
    mesM2: 0,
    mesM1: 0, // Corrigido: M1 = 0 (inativo)
    mesM0: 1, // Corrigido: M0 = 1 (ativo)
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Campinas Shopping, Loja 15 - Campinas/SP",
    municipio: "Campinas",
    uf: "SP",
    agencia: "0003",
    nome_agencia: "Agência Campinas Shopping",
    nome_paa: "Ponto Campinas Shopping",
    chave_paa: "PAA003",
    gerenciaRegional: "Campinas",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),
    motivo_bloqueio: "Motivo Bloqueio",
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
      lime: false,
      conta: true
    }
  },
  {
    chaveLoja: "5004",
    cnpj: "45.678.901/0001-66",
    nomeLoja: "Loja Ribeirão Preto",
    situacao: "MANTEVE",
    dataUltimaTransacao: new Date("2024-01-08"),
    mesM3: 1,
    mesM2: 1,
    mesM1: 1,
    mesM0: 1,
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Ribeirão Shopping, Loja 25 - Ribeirão Preto/SP",
    municipio: "Ribeirão Preto",
    uf: "SP",
    agencia: "0004",
    nome_agencia: "Agência Ribeirão Preto",
    nome_paa: "Ponto Ribeirão Preto",
    chave_paa: "PAA004",
    gerenciaRegional: "Ribeirão Preto",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),
    motivo_bloqueio: "Motivo Bloqueio",
    telefoneLoja: "(16) 3456-7893",
    nomeContato: "Ana Pereira",
    dataInauguracao: new Date("2021-08-15"),
    dataCertificacao: new Date("2023-01-10"),
    situacaoTablet: "Instalado",
    multiplicadorResponsavel: "Ana Pereira",
    supervisorResponsavel: "Maria Supervisora",
    chaveSupervisao: "SUP004",
    tendencia: "estavel",
    nivelAtividade: "media",
    produtosHabilitados: {
      consignado: true,
      microsseguro: true,
      lime: true,
      conta: true
    }
  },
  {
    chaveLoja: "5005",
    cnpj: "56.789.012/0001-55",
    nomeLoja: "Loja Santos",
    situacao: "ENCERRADO",
    dataUltimaTransacao: new Date("2023-12-20"),
    mesM3: 0,
    mesM2: 0,
    mesM1: 0,
    mesM0: 0,
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Praia Shopping, Loja 10 - Santos/SP",
    municipio: "Santos",
    uf: "SP",
    agencia: "0005",
    nome_agencia: "Agência Santos",
    nome_paa: "Ponto Santos",
    chave_paa: "PAA005",
    gerenciaRegional: "Baixada Santista",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),
    motivo_bloqueio: "Motivo Bloqueio",
    telefoneLoja: "(13) 3456-7894",
    nomeContato: "Carlos Santos",
    dataInauguracao: new Date("2020-12-01"),
    dataCertificacao: new Date("2022-05-15"),
    situacaoTablet: "Pendente",
    multiplicadorResponsavel: "Carlos Santos",
    supervisorResponsavel: "Pedro Supervisor",
    chaveSupervisao: "SUP005",
    tendencia: "queda",
    nivelAtividade: "baixa",
    produtosHabilitados: {
      consignado: false,
      microsseguro: false,
      lime: false,
      conta: true
    }
  },
  {
    chaveLoja: "5006",
    cnpj: "67.890.123/0001-44",
    nomeLoja: "Loja Sorocaba",
    situacao: "EQUIP_RETIRADA",
    dataUltimaTransacao: new Date("2024-01-05"),
    mesM3: 1,
    mesM2: 0,
    mesM1: 1, // Corrigido: M1 = 1 (ativo)
    mesM0: 0, // Corrigido: M0 = 0 (inativo)
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Gran Plaza Shopping, Loja 8 - Sorocaba/SP",
    municipio: "Sorocaba",
    uf: "SP",
    agencia: "0006",
    nome_agencia: "Agência Sorocaba",
    nome_paa: "Ponto Sorocaba",
    chave_paa: "PAA006",
    gerenciaRegional: "Sorocaba",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),
    motivo_bloqueio: "Motivo Bloqueio",
    telefoneLoja: "(15) 3456-7895",
    nomeContato: "Fernanda Lima",
    dataInauguracao: new Date("2021-06-20"),
    dataCertificacao: new Date("2022-11-30"),
    situacaoTablet: "Não Instalado",
    multiplicadorResponsavel: "Fernanda Lima",
    supervisorResponsavel: "João Supervisor",
    chaveSupervisao: "SUP006",
    tendencia: "queda",
    nivelAtividade: "baixa",
    produtosHabilitados: {
      consignado: true,
      microsseguro: false,
      lime: true,
      conta: true
    }
  },
  {
    chaveLoja: "5007",
    cnpj: "78.901.234/0001-33",
    nomeLoja: "Loja Jundiaí",
    situacao: "INOPERANTE",
    dataUltimaTransacao: new Date("2023-11-15"),
    mesM3: 0,
    mesM2: 0,
    mesM1: 1, // Corrigido: M1 = 1 (ativo)
    mesM0: 0, // Corrigido: M0 = 0 (inativo)
    segmento: "Supermercado",
    tipo_posto: "Posto",
    endereco: "Maxi Shopping, Loja 12 - Jundiaí/SP",
    municipio: "Jundiaí",
    uf: "SP",
    agencia: "0007",
    nome_agencia: "Agência Jundiaí",
    nome_paa: "Ponto Jundiaí",
    chave_paa: "PAA007",
    gerenciaRegional: "Jundiaí",
    diretoriaRegional: "Sudeste",
    gerenteArea: "Gerente Area",
    coordenador: "Coordenador",
    supervisor: "Supervisor",
    dt_bloqueio: new Date("2024-01-15"),

    motivo_bloqueio: "Motivo Bloqueio",
    telefoneLoja: "(11) 3456-7896",
    nomeContato: "Roberto Silva",
    dataInauguracao: new Date("2020-09-10"),
    dataCertificacao: new Date("2022-03-25"),
    situacaoTablet: "Pendente",
    multiplicadorResponsavel: "Roberto Silva",
    supervisorResponsavel: "Maria Supervisora",
    chaveSupervisao: "SUP007",
    tendencia: "queda",
    nivelAtividade: "baixa",
    produtosHabilitados: {
      consignado: false,
      microsseguro: false,
      lime: false,
      conta: true
    }
  }
];

//console.log('📊 Total de dados simulados:', dadosSimulados.length);
  
const PontosAtivos: React.FC = () => {
  const navigate = useNavigate();
  const { user, isManager, isAdmin } = useAuth();
  const [dados, setDados] = useState<DadosPontoAtivo[]>([]);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosPontoAtivo[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [ordenacao, setOrdenacao] = useState({ coluna: 'chaveLoja' as keyof DadosPontoAtivo, direcao: 'asc' as 'asc' | 'desc' });
  // Removido currentPage - não precisamos mais de paginação
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [showAnaliseFiltros, setShowAnaliseFiltros] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHierarchyColumns, setShowHierarchyColumns] = useState(false);
  const [selectedWaterfallStep, setSelectedWaterfallStep] = useState<string | null>(null);

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
  const situacoes = ["REATIVAÇÃO", "BLOQUEADO", "CONTRATAÇÃO", "MANTEVE", "ENCERRADO", "EQUIP_RETIRADA", "INOPERANTE"];
  const tendencias = ["crescimento", "estavel", "queda", "atencao"];
  const niveisAtividade = ["alta", "media", "baixa"];
  const gerenciasRegionais = [...new Set(dados.map(d => d.gerenciaRegional))];
  const diretoriasRegionais = [...new Set(dados.map(d => d.diretoriaRegional))];
  const municipios = [...new Set(dados.map(d => d.municipio))];
  const ufs = [...new Set(dados.map(d => d.uf))];
  const agencias = [...new Set(dados.map(d => `${d.agencia} - ${d.nome_agencia}`))];
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
      console.log('👤 Dados do usuário:', {
        name: user.name,
        role: user.role,
        chave: user.chave,
        funcional: user.funcional
      });
      
      if (!user.chave && user.role !== 'admin') {
        const errorMsg = `Usuário ${user.name} (${user.role}) não possui chave de hierarquia definida. 
        
Para corrigir:
1. Execute o script SQL: src/sql/fix_user_keys.sql
2. Verifique se o usuário tem chave na tabela TESTE..users
3. Faça logout e login novamente

Entre em contato com o administrador se o problema persistir.`;
        
        //console.log('⚠️ Usuário sem chave de hierarquia, usando dados simulados');
        setError(errorMsg);
        setConnectionStatus('error');
        // Fallback para dados simulados
        setDados(dadosSimulados);
        setDadosFiltrados(dadosSimulados);
        return;
      }
      
      // Buscar dados da estratégia pontos-ativos
      const response = await estrategiaComercialApi.getEstrategia('pontos-ativos');
      
      //console.log('📊 Resposta da API pontos-ativos:', response);
      //console.log('📊 Total de dadosAnaliticos retornados:', response.dadosAnaliticos?.length || 0);
      
      // Mapear dados para o formato esperado
      const dadosFormatados: DadosPontoAtivo[] = response.dadosAnaliticos.map(loja => {
        // Normalizar situação para maiúsculo
        const situacaoNormalizada = (loja.situacao || '').toUpperCase();
        return {
        chaveLoja: loja.chaveLoja,
        cnpj: loja.cnpj,
        nomeLoja: loja.nomeLoja,
        situacao: (loja.situacao || '').toUpperCase() as "REATIVAÇÃO" | "BLOQUEADO" | "CONTRATAÇÃO" | "MANTEVE" | "ENCERRADO" | "EQUIP_RETIRADA" | "INOPERANTE",
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
        nome_agencia: loja.nome_agencia,
        nome_paa: loja.nome_paa,
        chave_paa: loja.chave_paa,
        gerenciaRegional: loja.gerenciaRegional,
        diretoriaRegional: loja.diretoriaRegional,
        gerenteArea: loja.gerenteArea,
        coordenador: loja.coordenador,
        supervisor: loja.supervisor,
        dt_bloqueio: loja.dt_bloqueio,
        motivo_bloqueio: loja.motivo_bloqueio,
        telefoneLoja: loja.telefoneLoja,
        nomeContato: loja.nomeContato,
        segmento: loja.segmento,
        tipo_posto: loja.tipo_posto,
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
          lime: false,
          conta: false
        }
        };
      });
      
      setDados(dadosFormatados);
      setConnectionStatus('success');

      // Aplicar filtros após carregar dados
      const valoresIniciais = form.getValues();
      //console.log('🔄 Aplicando filtros após carregar dados da API:', valoresIniciais);
      //console.log('📊 Dados formatados antes de aplicar filtros:', dadosFormatados.length);
      aplicarFiltros(valoresIniciais);
      
    } catch (err: any) {
      //console.error('Erro ao carregar pontos ativos:', err);
      
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

      // Aplicar filtros após carregar dados simulados
      const valoresIniciais = form.getValues();
      //console.log('🔄 Aplicando filtros após carregar dados simulados:', valoresIniciais);
      //console.log('📊 Dados simulados antes de aplicar filtros:', dadosSimulados.length);
      aplicarFiltros(valoresIniciais);
      
    } finally {
      setIsLoading(false);
    }
  };

  // UseEffect para inicializar dados simulados
  useEffect(() => {
    //console.log('🚀 Inicializando dados simulados...');
    //console.log('📊 Dados atuais:', dados.length);
    //console.log('📊 Dados filtrados atuais:', dadosFiltrados.length);
    
    if (dados.length === 0 && dadosFiltrados.length === 0) {
      //console.log('✅ Carregando dados simulados...');
      setDados(dadosSimulados);
      setDadosFiltrados(dadosSimulados);
      
      // Aplicar filtros iniciais (que devem estar vazios)
      const valoresIniciais = form.getValues();
      //console.log('🔄 Valores iniciais do form:', valoresIniciais);
    }
  }, []);

  // UseEffect para carregar dados
  useEffect(() => {
    console.log('🔄 Carregando dados da API...');
    loadPontosAtivos();
    carregarDadosCascata();
  }, [user]);

  // UseEffect para garantir que dadosFiltrados seja atualizado quando dados mudar
  useEffect(() => {
    if (dados.length > 0 && dadosFiltrados.length === 0) {
      //console.log('🔄 Atualizando dadosFiltrados com dados disponíveis...');
      setDadosFiltrados(dados);
    }
  }, [dados]);

  const handleVoltar = () => {
    navigate('/estrategia-comercial');
  };

  const aplicarFiltros = (values: FiltrosPontosAtivos) => {
    // Se não há dados, não aplicar filtros
    if (dados.length === 0) {
      //console.log('⚠️ Não há dados para filtrar');
      return;
    }

    //console.log('🔍 Aplicando filtros com valores:', values);
    //console.log('📊 Total de dados disponíveis:', dados.length);

    let filtrados = [...dados];

    // Filtro por texto (chave loja, nome loja)
    if (values.chaveLoja || values.nomeLoja) {
      //console.log('🔍 Aplicando filtro de texto:', { chaveLoja: values.chaveLoja, nomeLoja: values.nomeLoja });
      const termo = (values.chaveLoja || values.nomeLoja).toLowerCase();
      filtrados = filtrados.filter(loja => 
        loja.chaveLoja.toLowerCase().includes(termo) ||
        loja.nomeLoja.toLowerCase().includes(termo) ||
        loja.cnpj.includes(termo)
      );
      //console.log('📊 Após filtro de texto:', filtrados.length);
    }

    // Filtros por arrays
    if (values.situacao.length > 0) {
      //console.log('🔍 Aplicando filtro de situação:', values.situacao);
      filtrados = filtrados.filter(loja => values.situacao.includes(loja.situacao));
      //console.log('📊 Após filtro de situação:', filtrados.length);
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
      filtrados = filtrados.filter(loja => {
        const agenciaCompleta = `${loja.agencia} - ${loja.nome_agencia}`;
        return values.agencia.includes(agenciaCompleta) || 
               values.agencia.includes(loja.agencia) || 
               values.agencia.some(ag => ag.includes(loja.agencia)) ||
               values.agencia.some(ag => ag.includes(loja.nome_agencia));
      });
    }

    // Filtros para os meses
    if (values.mesM3.length > 0) {
      //console.log('🔍 Aplicando filtro M3:', values.mesM3);
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM3 === 1 ? 'ativo' : 'inativo';
        return values.mesM3.includes(valor);
      });
      //console.log('📊 Após filtro M3:', filtrados.length);
    }

    if (values.mesM2.length > 0) {
      //console.log('🔍 Aplicando filtro M2:', values.mesM2);
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM2 === 1 ? 'ativo' : 'inativo';
        return values.mesM2.includes(valor);
      });
      //console.log('📊 Após filtro M2:', filtrados.length);
    }

    if (values.mesM1.length > 0) {
      //console.log('🔍 Aplicando filtro M1:', values.mesM1);
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM1 === 1 ? 'ativo' : 'inativo';
        return values.mesM1.includes(valor);
      });
      //console.log('📊 Após filtro M1:', filtrados.length);
    }

    if (values.mesM0.length > 0) {
      //console.log('🔍 Aplicando filtro M0:', values.mesM0);
      filtrados = filtrados.filter(loja => {
        const valor = loja.mesM0 === 1 ? 'ativo' : 'inativo';
        return values.mesM0.includes(valor);
      });
      //console.log('📊 Após filtro M0:', filtrados.length);
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

    // Garantir que dadosFiltrados seja atualizado mesmo quando não há filtros
    //console.log('✅ Dados filtrados resultantes:', filtrados.length);
    setDadosFiltrados(filtrados);
  };

  const limparFiltros = () => {
    form.reset();
    setDadosFiltrados(dados);
  };

  const handleOrdenacao = (coluna: keyof DadosPontoAtivo) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
    // Aplicar filtros após mudança de ordenação
    aplicarFiltros(form.getValues());
  };

  const exportarParaExcel = () => {
    try {
      //console.log('📊 Iniciando exportação para Excel...');
      //console.log('📊 Total de dados para exportar:', dadosFiltrados.length);
      //console.log('🔐 Token antes da exportação:', window.sessionStorage.getItem('token') ? 'Presente' : 'Ausente');
      //console.log('👤 Usuário antes da exportação:', user?.name);
      
      // Preparar os dados para exportação
      const dadosParaExportar = dadosFiltrados.map(ponto => ({
        'Diretoria Regional': ponto.diretoriaRegional,
        'Gerência Regional': ponto.gerenciaRegional,
        'Gerente Area': ponto.gerenteArea,
        'Coordenador': ponto.coordenador,
        'Supervisor': ponto.supervisor,
        'COD AG': ponto.agencia,
        'Nome Agência': ponto.nome_agencia,
        'COD PAA': ponto.chave_paa,
        'Nome PAA': ponto.nome_paa,
        'Chave Loja': ponto.chaveLoja,
        'CNPJ': ponto.cnpj,
        'Nome Loja': ponto.nomeLoja,
        'Situação': ponto.situacao,
        'M-3': ponto.mesM3,
        'M-2': ponto.mesM2,
        'M-1': ponto.mesM1,
        'M0': ponto.mesM0,
        'Últ. Transação': formatDate(ponto.dataUltimaTransacao),
        'Data Inauguração': formatDate(ponto.dataInauguracao),
        'Data Certificação': formatDate(ponto.dataCertificacao),
        'Data Bloqueio': formatDate(ponto.dt_bloqueio),
        'Motivo Bloqueio': ponto.motivo_bloqueio,     
        'Situação Tablet': ponto.situacaoTablet,
        'Multiplicador Responsável': ponto.multiplicadorResponsavel,
        'Telefone Loja': ponto.telefoneLoja,
        'Nome Contato': ponto.nomeContato,
        'Segmento': ponto.segmento,
        'Endereço': ponto.endereco,
        'Município': ponto.municipio,
        'UF': ponto.uf,
        'Conta': ponto.produtosHabilitados?.conta ? 'Sim' : 'Não',
        'Consignado': ponto.produtosHabilitados?.consignado ? 'Sim' : 'Não',
        'Microsseguro': ponto.produtosHabilitados?.microsseguro ? 'Sim' : 'Não',
        'Lime': ponto.produtosHabilitados?.lime ? 'Sim' : 'Não'
      }));

      // Criar uma nova planilha
      const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pontos Ativos");

      // Ajustar largura das colunas
      const colunas = Object.keys(dadosParaExportar[0]);
      const largurasColunas: { [key: string]: number } = {};
      colunas.forEach(col => {
        const maxLength = Math.max(
          col.length,   
          ...dadosParaExportar.map(row => String(row[col as keyof typeof row]).length)
        );
        largurasColunas[col] = Math.min(maxLength + 2, 50); // Limitar a 50 caracteres
      });
      ws['!cols'] = colunas.map(col => ({ wch: largurasColunas[col] }));

      // Gerar o arquivo Excel
      const dataAtual = format(new Date(), 'dd-MM-yyyy', { locale: ptBR });
      XLSX.writeFile(wb, `Pontos_Ativos_${dataAtual}.xlsx`);

      //console.log('✅ Arquivo Excel exportado com sucesso!');
      //console.log('📊 Exportação concluída, usuário ainda autenticado:', !!user);
      //console.log('🔐 Token após exportação:', window.sessionStorage.getItem('token') ? 'Presente' : 'Ausente');
      //console.log('👤 Usuário após exportação:', user?.name);
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error);
      console.error('❌ Erro completo:', error);
      //console.log('🔐 Token após erro:', window.sessionStorage.getItem('token') ? 'Presente' : 'Ausente');
      //console.log('👤 Usuário após erro:', user?.name);
      alert('Erro ao exportar arquivo Excel. Tente novamente.');
    }
  };

  // Removido getCurrentPageData - agora mostra todos os dados com scroll

  // Removido handlePageChange - não precisamos mais de paginação



  const renderSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'REATIVAÇÃO':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle className="h-3 w-3 mr-1" />Reativação</Badge>;
      case 'BLOQUEADO':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><XCircle className="h-3 w-3 mr-1" />Bloqueado</Badge>;
      case 'CONTRATAÇÃO':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Contratação</Badge>;
      case 'MANTEVE':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Manteve</Badge>;
      case 'ENCERRADO':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Encerrado</Badge>;
      case 'EQUIP_RETIRADA':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Equip. Retirada</Badge>;
      case 'INOPERANTE':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Inoperante</Badge>;
      default:
        return <Badge variant="outline">{situacao}</Badge>;
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

  // Formatação pt-BR para rótulos internos das barras
  const formatPt = (n: number) => new Intl.NumberFormat('pt-BR').format(n);

  // -------------------- Gráfico Cascata (Waterfall) - Mock --------------------
type WaterfallItem = {
  key: string;
  label: string;
  type: "total" | "negative" | "positive" | "neutral";
  valor: number; // deslocamento invisível
  acumulado: number; // altura visível
  cumulative?: number; // acumulado pós-passo (para tooltip)
};

  // Estados para dados da cascata
  const [cascataData, setCascataData] = useState<CascataResponse | null>(null);
  const [loadingCascata, setLoadingCascata] = useState(false);
  const [errorCascata, setErrorCascata] = useState<string | null>(null);

  // Função para carregar dados da cascata
  const carregarDadosCascata = async () => {
    setLoadingCascata(true);
    setErrorCascata(null);
    
    try {
      const dados = await estrategiaComercialApi.getCascataPontosAtivos();
      setCascataData(dados);
    } catch (error) {
      //console.error('Erro ao carregar dados da cascata:', error);
      setErrorCascata(error instanceof Error ? error.message : 'Erro ao carregar dados da cascata');
    } finally {
      setLoadingCascata(false);
    }
  };

  // Cores da cascata
  const bradescoBlue = "#0B3B8C"; // azul institucional aproximado

  // Altura mínima para barras do gráfico de cascata (em pixels)
  // Aumentado para garantir que o texto não fique espremido
  const MIN_BAR_HEIGHT = 25;

  const waterfallData: WaterfallItem[] = useMemo(() => {
    if (!cascataData) {
      // Dados padrão enquanto carrega
      return [{
        key: "M-1",
        label: `${monthNames.M1}`,
        type: "total",
        base: 0,
        delta: 0,
        cumulative: 0,
        top: 0
      }];
    }

    let data: WaterfallItem[] = [];
    let cumulative = cascataData.totalM1;

    // Barra total inicial (M-1)
    data.push({
      key: "M-1",
      label: `${monthNames.M1}`,
      type: "total",
      valor: 0,
      acumulado: cascataData.totalM1,
      cumulative,
    });

    // Quedas
    cascataData.variacoesNegativas.forEach((s) => {
      const before = cumulative;
      const after = before + s.value; // negativo
      const valor = Math.min(before, after);
      const acumulado = Math.abs(s.value);
      cumulative = after;
      data.push({ key: s.key, label: s.key, type: "negative", valor, acumulado, cumulative });
    });

    // Manteve (neutra): mostra o que permaneceu após quedas (não altera acumulado)
    const manteveValor = cascataData.manteve;
    data.push({ key: "Manteve", label: "Manteve", type: "neutral", valor: 0, acumulado: Math.max(0, manteveValor), cumulative });

    // Ganhos
    cascataData.variacoesPositivas.forEach((s) => {
      const before = cumulative;
      const after = before + s.value;
      const valor = Math.min(before, after);
      const acumulado = Math.abs(s.value);
      cumulative = after;
      data.push({ key: s.key, label: s.key, type: "positive", valor, acumulado, cumulative });
    });

    // Total final (M0)
    data.push({ key: "M0", label: `${monthNames.M0}`, type: "total", valor: 0, acumulado: cascataData.totalM0, cumulative: cascataData.totalM0 });

    // acrescenta campo "top" para ligar os cantos superiores
    return data.map((d) => ({ ...d, top: d.valor + d.acumulado } as any));
  }, [cascataData, monthNames.M1, monthNames.M0]);

  const getStepColor = (item: WaterfallItem) => {
    switch (item.type) {
      case "negative":
        return "#C30C3E"; // vermelho solicitado
      case "positive":
        return "#007770"; // verde solicitado
      case "neutral":
        return bradescoBlue; // azul bradesco
      case "total":
      default:
        return bradescoBlue; // azul bradesco
    }
  };

  // Função para aplicar filtros baseado no clique na cascata
  const aplicarFiltroCascata = (itemKey: string) => {
    //console.log('🎯 Aplicando filtro cascata para:', itemKey);

    // Resetar filtros atuais
    form.reset();

    // Aplicar filtros baseado no tipo de item clicado
    switch (itemKey) {
      case "Bloqueado":
      case "BLOQUEADO":
        //console.log('📊 Aplicando filtros para BLOQUEADO');
        form.setValue("situacao", ["BLOQUEADO"]);
        form.setValue("mesM1", ["ativo"]); // M1 = 1 (ativo)
        form.setValue("mesM0", ["inativo"]); // M0 = 0 (inativo)
        break;

      case "Encerrado":
      case "ENCERRADO":
        //console.log('📊 Aplicando filtros para ENCERRADO');
        form.setValue("situacao", ["ENCERRADO"]);
        form.setValue("mesM1", ["ativo"]); // M1 = 1 (ativo)
        form.setValue("mesM0", ["inativo"]); // M0 = 0 (inativo)
        break;

      case "Equip. Retirada":
      case "Equip. Retirado":
      case "EQUIP_RETIRADA":
        //console.log('📊 Aplicando filtros para EQUIP_RETIRADA');
        form.setValue("situacao", ["EQUIP_RETIRADA"]);
        form.setValue("mesM1", ["ativo"]); // M1 = 1 (ativo)
        form.setValue("mesM0", ["inativo"]); // M0 = 0 (inativo)
        break;

      case "Inoperante":
      case "INOPERANTE":
        //console.log('📊 Aplicando filtros para INOPERANTE');
        form.setValue("situacao", ["INOPERANTE"]);
        form.setValue("mesM1", ["ativo"]); // M1 = 1 (ativo)
        form.setValue("mesM0", ["inativo"]); // M0 = 0 (inativo)
        break;

      case "Contratação":
      case "CONTRATAÇÃO":
        //console.log('📊 Aplicando filtros para CONTRATAÇÃO');
        form.setValue("situacao", ["CONTRATAÇÃO"]);
        form.setValue("mesM1", ["inativo"]); // M1 = 0 (inativo)
        form.setValue("mesM0", ["ativo"]); // M0 = 1 (ativo)
        break;

      case "Reativação":
      case "REATIVAÇÃO":
        //console.log('📊 Aplicando filtros para REATIVAÇÃO');
        form.setValue("situacao", ["REATIVAÇÃO"]);
        form.setValue("mesM1", ["inativo"]); // M1 = 0 (inativo)
        form.setValue("mesM0", ["ativo"]); // M0 = 1 (ativo)
        break;

      case "Manteve":
        //console.log('📊 Aplicando filtros para MANTEVE');
        form.setValue("mesM1", ["ativo"]); // M1 = Ativo
        form.setValue("mesM0", ["ativo"]); // M0 = Ativo (manteve ativo)
        break;

      // Para outros casos, podemos adicionar mais lógica específica
      default:
        //console.log('📊 Aplicando filtros DEFAULT para:', itemKey);
        // Para casos genéricos, vamos filtrar apenas pelo status M1 ativo
        if (itemKey !== "M-1" && itemKey !== "M0") {
          form.setValue("mesM1", ["ativo"]);
        }
        break;
    }

    // Mostrar filtros aplicados antes de executar
    const filtrosAplicados = form.getValues();
    //console.log('🎯 Filtros aplicados:', filtrosAplicados);

    // Aplicar os filtros na tabela
    aplicarFiltros(filtrosAplicados);
  };

  // Drill-down com dados reais
  const dadosBloqueios = cascataData?.dadosBloqueios || [];
  const dadosDiasInoperantes = cascataData?.dadosDiasInoperantes || [];

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
    // Usar estado local para forçar re-renderização quando filtros mudam
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const values = form.getValues(name) as string[];

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
                      // Forçar re-renderização do componente
                      forceUpdate();
                      // Aplicar filtros após atualizar o form
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="container mx-auto pb-12 space-y-6">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando Pontos Ativos</h2>
            <p className="text-gray-600 text-center mb-4">
              Aguarde enquanto carregamos os dados dos pontos ativos
            </p>
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
            <p className="text-gray-500">Monitoramento e estratégias para pontos ativos (1 Transação) - {user?.name}</p>
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
              nome_agencia: ponto.nome_agencia,
              codAgRelacionamento: ponto.agencia,
              agRelacionamento: ponto.agencia,
              dt_bloqueio: ponto.dt_bloqueio,
              motivo_bloqueio: ponto.motivo_bloqueio,
              gerenteArea: ponto.gerenteArea,
              coordenador: ponto.coordenador,
              supervisor: ponto.supervisor,
              telefoneLoja: ponto.telefoneLoja,
              nomeContato: ponto.nomeContato,
              segmento: ponto.segmento,
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
            }}
            onQuedaProducaoClick={() => {
              // Filtrar lojas com queda na atividade (M0 menor que M1)
              const lojasFiltradas = dados.filter(loja => 
                (loja.mesM0 || 0) < (loja.mesM1 || 0) && (loja.mesM1 || 0) > 0
              );
              setDadosFiltrados(lojasFiltradas);
            }}
          />

         <Tabs defaultValue="pontos">
           
          <TabsContent value="pontos">
           <Card>
              <CardHeader>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                     {/* Card Oscilantes */}
                     <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                       <CardContent className="p-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-blue-500 rounded-md">
                               <BarChart3 className="h-4 w-4 text-white" />
                             </div>
                             <span className="font-medium text-blue-900 text-sm">Oscilantes</span>
                           </div>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>   
                                 <Info className="h-3 w-3 text-blue-600 cursor-help hover:text-blue-800 transition-colors" />
                               </TooltipTrigger>
                               <TooltipContent>
                                 <div className="max-w-xs">
                                   <p className="font-semibold mb-2">Padrão Oscilante</p>
                                   <p className="text-sm mb-2">Pontos que alternam entre atividade e inatividade:</p>
                                   <ul className="text-xs space-y-1">
                                     <li>• M3→M2→M1→M0: 1→0→1→0</li>
                                     <li>• M3→M2→M1→M0: 0→1→0→1</li>
                                   </ul>
                                   <p className="text-xs mt-2 text-gray-600">
                                     Indica instabilidade na operação do ponto.
                                   </p>
                                 </div>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="mt-3">
                           <div className="text-2xl font-bold text-blue-900">{oscilantes}</div>
                           <div className="text-xs text-blue-700 mt-0.5">pontos</div>
                         </div>
                       </CardContent>
                     </Card>

                     {/* Card Em Queda */}
                     <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                       <CardContent className="p-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-blue-600 rounded-md">
                               <TrendingDown className="h-4 w-4 text-white" />
                             </div>
                             <span className="font-medium text-blue-900 text-sm">Em Queda</span>
                           </div>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Info className="h-3 w-3 text-blue-600 cursor-help hover:text-blue-800 transition-colors" />
                               </TooltipTrigger>
                               <TooltipContent>
                                 <div className="max-w-xs">
                                   <p className="font-semibold mb-2">Padrão de Queda</p>
                                   <p className="text-sm mb-2">Pontos que perderam atividade gradualmente:</p>
                                   <ul className="text-xs space-y-1">
                                     <li>• M3→M2→M1→M0: 1→1→0→0</li>
                                   </ul>
                                   <p className="text-xs mt-2 text-gray-600">
                                     Indica declínio progressivo na operação.
                                   </p>
                                 </div>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="mt-3">
                           <div className="text-2xl font-bold text-blue-900">{emQueda}</div>
                           <div className="text-xs text-blue-700 mt-0.5">pontos</div>
                         </div>
                       </CardContent>
                     </Card>

                     {/* Card Recuperação */}
                     <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                       <CardContent className="p-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-blue-700 rounded-md">
                               <TrendingUp className="h-4 w-4 text-white" />
                             </div>
                             <span className="font-medium text-blue-900 text-sm">Recuperação</span>
                           </div>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Info className="h-3 w-3 text-blue-600 cursor-help hover:text-blue-800 transition-colors" />
                               </TooltipTrigger>
                               <TooltipContent>
                                 <div className="max-w-xs">
                                   <p className="font-semibold mb-2">Padrão de Recuperação</p>
                                   <p className="text-sm mb-2">Pontos que recuperaram atividade:</p>
                                   <ul className="text-xs space-y-1">
                                     <li>• M3→M2→M1→M0: 0→0→1→1</li>
                                   </ul>
                                   <p className="text-xs mt-2 text-gray-600">
                                     Indica retomada positiva da operação.
                                   </p>
                                 </div>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="mt-3">
                           <div className="text-2xl font-bold text-blue-900">{recuperacao}</div>
                           <div className="text-xs text-blue-700 mt-0.5">pontos</div>
                         </div>
                       </CardContent>
                     </Card>
                   </>
                 );
               })()}
</div>
           </CardContent>
         </Card>
<br />
          {/* Gráfico em Cascata (Waterfall) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Cascata de Ativos
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Evolução dos pontos ativos entre {monthNames.M1} e {monthNames.M0}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                    <span className="font-medium">💡 Dica:</span> Clique no item para filtrar a tabela
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCascata ? (
                <div className="w-full h-[380px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando dados da cascata...</p>
                  </div>
                </div>
              ) : errorCascata ? (
                <div className="w-full h-[380px] flex items-center justify-center">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600 mb-2">Erro ao carregar dados da cascata</p>
                    <p className="text-xs text-gray-500 mb-3">{errorCascata}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={carregarDadosCascata}
                      className="text-xs"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={{ total: { label: "Total", color: "hsl(var(--primary))" } }}
                  className="w-full h-[380px]"
                >
                  <BarChart
                    data={waterfallData}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    barCategoryGap="10%"
                    maxBarSize={80}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <ChartTooltip 
                      content={(props: any) => {
                        const { active, payload, label } = props;
                        if (!active || !payload || payload.length === 0) return null;
                        
                        const data = payload[0].payload;
                        const alturaBarra = payload[0].value; // Altura da barra visível
                        
                        // Calcular o valor da variação e o acumulado correto
                        let valorVariacao = 0;
                        let acumuladoCorreto = 0;
                        
                        if (data.type === 'total') {
                          // Para totais, valor e acumulado são iguais
                          valorVariacao = alturaBarra;
                          acumuladoCorreto = alturaBarra;
                        } else if (data.type === 'negative') {
                          // Para perdas: valor é o dataAcumulado (quantidade perdida), acumulado é o valor após a perda
                          valorVariacao = data.acumulado || 0;
                          acumuladoCorreto = data.cumulative || 0;
                        } else if (data.type === 'positive') {
                          // Para ganhos: valor é o dataAcumulado (quantidade ganha), acumulado é o valor após o ganho
                          valorVariacao = data.acumulado || 0;
                          acumuladoCorreto = data.cumulative || 0;
                        } else if (data.type === 'neutral') {
                          // Para mantidos: valor é o dataAcumulado (quantidade mantida), acumulado é o valor após manter
                          valorVariacao = data.acumulado || 0;
                          acumuladoCorreto = data.cumulative || 0;
                        }
                        
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
                            <div className="text-sm font-semibold text-gray-800 mb-2">
                              {label}
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Valor:</span>
                                <span className={`text-sm font-medium ${data.type === 'negative' ? 'text-red-600' : data.type === 'positive' ? 'text-green-600' : 'text-gray-800'}`}>
                                  {formatPt(valorVariacao)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Acumulado:</span>
                                <span className="text-sm font-medium text-gray-800">
                                  {formatPt(acumuladoCorreto)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Tipo:</span>
                                <span className="text-xs font-medium text-gray-700 capitalize">
                                  {data.type === 'total' ? 'Total' :
                                   data.type === 'negative' ? 'Perda' :
                                   data.type === 'positive' ? 'Ganho' :
                                   data.type === 'neutral' ? 'Mantido' : data.type}
                                </span>
                              </div>
                              {/* Mensagem de dica para itens clicáveis */}
                              {data.key !== "M-1" && data.key !== "M0" && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <span className="text-xs text-blue-600 font-medium">
                                    💡 Clique para filtrar a tabela
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {/* Valor invisível para posicionar as barras */}
                    <Bar dataKey="valor" stackId="a" fill="transparent" isAnimationActive={false} minPointSize={MIN_BAR_HEIGHT} />
                    {/* Acumulado visível */}
                    <Bar
                      dataKey="acumulado"
                      stackId="a"
                      radius={[8, 8, 8, 8]}
                      minPointSize={MIN_BAR_HEIGHT}
                      onClick={(data: any) => {
                        if (data?.payload?.key) {
                          // Aplicar filtro baseado no item clicado
                          aplicarFiltroCascata(data.payload.key);

                          // Manter a funcionalidade de drill-down para Bloqueado
                          if (data.payload.key === "Bloqueado") {
                            setSelectedWaterfallStep("Bloqueado");
                          } else {
                            // Para outros itens, fechar qualquer drill-down aberto
                            setSelectedWaterfallStep(null);
                          }
                        }
                      }}
                    >
                      {waterfallData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getStepColor(entry)}
                          cursor={entry.key !== "M-1" && entry.key !== "M0" ? "pointer" : "default"}
                        />
                      ))}
                      <LabelList
                        dataKey="acumulado"
                        content={(props: any) => {
                          const { x, y, width, height, value, payload } = props;
                          if (!width || !height || width <= 0 || height <= 0) return null;
                          
                          const v = typeof value === 'number' ? value : 0;
                          const cx = x + width / 2;
                          const cy = y + height / 2;
                          
                          // Ajustar posição baseada no tipo de barra
                          let labelY = cy;
                          let fontSize = 13;
                          let fontWeight = 600;
                          
                          // Para barras com altura mínima, manter fonte adequada
                          if (height <= MIN_BAR_HEIGHT && Math.abs(v) > 0) {
                            // Com altura de 25px, a fonte padrão cabe bem
                            // Só reduzir ligeiramente se necessário para valores muito longos
                            if (String(formatPt(v)).length > 8) {
                              fontSize = Math.max(11, fontSize - 1);
                            }
                          }
                          
                          // Para barras de perda (negativas), ajustar posição
                          if (payload?.type === 'negative') {
                            labelY = cy + 2;
                          }
                          
                          // Para barras de ganho (positivas), ajustar posição
                          if (payload?.type === 'positive') {
                            labelY = cy - 2;
                          }
                          
                          // Para barras totais, usar fonte ainda maior
                          if (payload?.type === 'total') {
                            fontSize = 15;
                            fontWeight = 700;
                          }
                          
                          return (
                            <text 
                              x={cx} 
                              y={labelY} 
                              textAnchor="middle" 
                              dominantBaseline="middle" 
                              fill="#ffffff" 
                              style={{ 
                                fontSize: fontSize, 
                                fontWeight: fontWeight,
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {formatPt(v)}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                    {/* Linha pontilhada ligando os topos das barras */}
                    <Line
                      type="linear"
                      dataKey="top"
                      stroke="#94a3b8"
                      strokeDasharray="4 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ChartContainer>
              )}

              {selectedWaterfallStep === "Bloqueado" && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-blue-900">Relação de Bloqueios</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedWaterfallStep(null)}>Fechar</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-[260px]">
                        {loadingCascata ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-xs text-gray-600">Carregando...</p>
                            </div>
                          </div>
                        ) : dadosBloqueios.length === 0 ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Info className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Nenhum bloqueio encontrado</p>
                            </div>
                          </div>
                        ) : (
                          <ResponsiveContainer>
                            <BarChart data={dadosBloqueios} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
                              <YAxis dataKey="motivo" type="category" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
                              <RechartsTooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                              <Bar dataKey="quantidade" fill="#6366f1" radius={[0, 6, 6, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Distribuição de Dias Inoperantes</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Pontos que eram ativos em M-1 e ficaram inoperantes em M0
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-[260px]">
                        {loadingCascata ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto mb-2"></div>
                              <p className="text-xs text-gray-600">Carregando...</p>
                            </div>
                          </div>
                        ) : dadosDiasInoperantes.length === 0 ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Info className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Nenhum ponto inoperante encontrado</p>
                            </div>
                          </div>
                        ) : (
                          <ResponsiveContainer>
                            <BarChart data={dadosDiasInoperantes} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                              <XAxis 
                                dataKey="dias" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: "#475569" }}
                                label={{ value: 'Dias Inoperantes', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: 12, fill: '#475569' }}}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: "#475569" }}
                                label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12, fill: '#475569' }}}
                              />
                              <RechartsTooltip 
                                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                                formatter={(value, name) => [
                                  `${value} pontos`,
                                  'Quantidade'
                                ]}
                                labelFormatter={(label) => `${label} dias`}
                              />
                              <Bar dataKey="quantidade" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
<br />
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
                             label: s === "REATIVAÇÃO" ? "Reativação" :
                                    s === "BLOQUEADO" ? "Bloqueado" :
                                    s === "CONTRATAÇÃO" ? "Contratação" :
                                    s === "MANTEVE" ? "Manteve" :
                                    s === "ENCERRADO" ? "Encerrado" :
                                    s === "EQUIP_RETIRADA" ? "Equip. Retirada" :
                                    s === "INOPERANTE" ? "Inoperante" :
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
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table className="min-w-full table-fixed">
                    <TableHeader className="sticky top-0 bg-white z-10">
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
                      {dadosFiltrados.map((ponto) => (
                        <TableRow key={ponto.chaveLoja}>
                          <TableCell className="font-medium">
                            <div className="truncate">{ponto.chaveLoja}</div>
                            <div className="text-xs text-gray-500 truncate">{ponto.cnpj}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium truncate" title={ponto.nomeLoja}>{ponto.nomeLoja}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {ponto.agencia} - {ponto.nome_agencia}
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
                              {ponto.situacao === "REATIVAÇÃO" ? (
                                <Badge className="bg-green-100 text-green-800">Reativação</Badge>
                              ) : ponto.situacao === "BLOQUEADO" ? (
                                <Badge className="bg-red-100 text-red-800">Bloqueado</Badge>
                              ) : ponto.situacao === "CONTRATAÇÃO" ? (
                                <Badge className="bg-blue-100 text-blue-800">Contratação</Badge>
                              ) : ponto.situacao === "MANTEVE" ? (
                                <Badge className="bg-yellow-100 text-yellow-800">Manteve</Badge>
                              ) : ponto.situacao === "ENCERRADO" ? (
                                <Badge className="bg-gray-100 text-gray-800">Encerrado</Badge>
                              ) : ponto.situacao === "EQUIP_RETIRADA" ? (
                                <Badge className="bg-orange-100 text-orange-800">Equip. Retirada</Badge>
                              ) : ponto.situacao === "INOPERANTE" ? (
                                <Badge className="bg-purple-100 text-purple-800">Inoperante</Badge>
                              ) : (
                                <Badge variant="outline">{ponto.situacao}</Badge>
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

                {/* Contador de resultados */}
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-500">
                    {dadosFiltrados.length} {dadosFiltrados.length === 1 ? 'ponto encontrado' : 'pontos encontrados'}
                  </div>
                </div>
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
