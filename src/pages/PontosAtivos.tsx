import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
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
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import PontosAtivosFilters from "@/components/pontos-ativos/PontosAtivosFilters";
import ResumoProducaoPontosAtivos from "@/components/pontos-ativos/ResumoProducaoPontosAtivos";
import { TratativaModal } from "@/components/pontos-ativos/TratativaModal-Ativos";
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
  nrPacb: string;
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
  dt_bloqueio: Date | string;
  motivo_bloqueio: string;
  diretoriaRegional: string;
  gerenciaRegional: string;
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

  
const DEFAULT_BATCH_SIZE = 100;

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
  const [selectedWaterfallStep, setSelectedWaterfallStep] = useState<string | null>(null);
  const [linhaExpandida, setLinhaExpandida] = useState<string | null>(null);
  const [showHierarchyColumns, setShowHierarchyColumns] = useState(false);
  const [modalTratativaAberto, setModalTratativaAberto] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<DadosPontoAtivo | null>(null);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_BATCH_SIZE);
  const deferredDadosFiltrados = useDeferredValue(dadosFiltrados);

  // Função para determinar se o usuário pode ver as colunas de hierarquia
  const canSeeHierarchyColumns = isAdmin || isManager || user?.role === 'coordenador';

  const form = useForm<FiltrosPontosAtivos>({
    defaultValues: {
      chaveLoja: "",
      nomeLoja: "",
      situacao: [],
      gerenciaRegional: [],
      diretoriaRegional: [],
      gerentesArea: [],
      coordenadores: [],
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
  const gerentesArea = [...new Set(dados.map(d => d.gerenteArea))];
  const coordenadores = [...new Set(dados.map(d => d.coordenador))];
  const municipios = [...new Set(dados.map(d => d.municipio))];
  const ufs = [...new Set(dados.map(d => d.uf))];
  const agencias = [...new Set(dados.map(d => `${d.agencia} - ${d.nome_agencia}`))];
  const multiplicadoresResponsaveis = [...new Set(dados.map(d => d.multiplicadorResponsavel))];
  const supervisoresResponsaveis = [...new Set(dados.map(d => d.supervisor))];

  const dadosVisiveis = useMemo(() => deferredDadosFiltrados.slice(0, visibleCount), [deferredDadosFiltrados, visibleCount]);
  const totalResultados = deferredDadosFiltrados.length;
  const hasMoreResults = visibleCount < totalResultados;
  const remainingResults = Math.max(totalResultados - dadosVisiveis.length, 0);
  const proximaCarga = Math.min(DEFAULT_BATCH_SIZE, remainingResults);

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
        setDados([]);
        setDadosFiltrados([]);
        setVisibleCount(DEFAULT_BATCH_SIZE);
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
        nrPacb: loja.NR_PACB,
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
      //console.log('📊 Dados formatados antes de aplicar filtros:', dadosFormatados.length);
      aplicarFiltros(valoresIniciais);
      
    } catch (err: any) {
      //console.error('Erro ao carregar lojas ativas:', err);
      
      let errorMessage = err.message || 'Erro ao carregar dados das lojas ativas';
      
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        errorMessage = `Erro de conexão com o servidor. 
        
Verifique:
1. Se o backend está rodando
2. Se as tabelas TB_ESTR_LOJAS e TB_ESTR_ATIVO existem
3. Execute os scripts SQL necessários para popular as tabelas`;
      }
      
      setError(errorMessage);
      setConnectionStatus('error');
      setDados([]);
      setDadosFiltrados([]);
      setVisibleCount(DEFAULT_BATCH_SIZE);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Função para filtrar por padrões de comportamento
  const filtrarPorPadrao = (padrao: string) => {
    // Resetar filtros atuais
    form.reset();

    switch (padrao) {
      case 'oscilantes':
        // Não há filtro direto para oscilantes, então vamos mostrar todos e deixar o usuário ver o padrão
        // Podemos implementar uma lógica mais específica se necessário
        break;
      
      case 'recuperacao':
        // Recuperação: M3=0, M2=0, M1=1, M0=1
        form.setValue("mesM3", ["inativo"]);
        form.setValue("mesM2", ["inativo"]);
        form.setValue("mesM1", ["ativo"]);
        form.setValue("mesM0", ["ativo"]);
        break;
      
      case 'emQueda':
        // Em Queda: M3=1, M2=1, M1=0, M0=0
        form.setValue("mesM3", ["ativo"]);
        form.setValue("mesM2", ["ativo"]);
        form.setValue("mesM1", ["inativo"]);
        form.setValue("mesM0", ["inativo"]);
        break;
    }

    // Aplicar os filtros
    aplicarFiltros(form.getValues());
    
    // Scroll para a tabela
    setTimeout(() => {
      const tabelaElement = document.getElementById('tabela-pontos-ativos');
      if (tabelaElement) {
        tabelaElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 300);
  };

  // UseEffect para carregar dados
  useEffect(() => {
    console.log('🔄 Carregando dados da API...');
    loadPontosAtivos();
    carregarDadosCascata();
  }, [user]);

  // UseEffect para garantir dados filtrados ao carregar o dataset pela primeira vez
  useEffect(() => {
    if (dados.length > 0 && dadosFiltrados.length === 0) {
      setDadosFiltrados(dados);
      setVisibleCount(Math.min(DEFAULT_BATCH_SIZE, dados.length));
    }
  }, [dados, dadosFiltrados.length]);

  const handleVoltar = () => {
    navigate('/estrategia-comercial');
  };

  const handleToggleDetalhes = (chaveLoja: string) => {
    setLinhaExpandida(linhaExpandida === chaveLoja ? null : chaveLoja);
  };

  const handleAbrirTratativa = (ponto: DadosPontoAtivo) => {
    setPontoSelecionado(ponto);
    setModalTratativaAberto(true);
  };

  const handleFecharTratativa = () => {
    setModalTratativaAberto(false);
    setPontoSelecionado(null);
  };

  const handleSucessoTratativa = () => {
    // Recarregar dados ou atualizar estado se necessário
    loadPontosAtivos();
  };


  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + DEFAULT_BATCH_SIZE, dadosFiltrados.length));
  };

  const handleShowAll = () => {
    setVisibleCount(dadosFiltrados.length);
  };

  const aplicarFiltros = (values: FiltrosPontosAtivos, baseData?: DadosPontoAtivo[]) => {
    const fonteDados = baseData ?? dados;

    if (fonteDados.length === 0) {
      setDadosFiltrados([]);
      setVisibleCount(DEFAULT_BATCH_SIZE);
      return;
    }

    // Scroll automático para a tabela
    setTimeout(() => {
      const tabelaElement = document.getElementById('tabela-pontos-ativos');
      if (tabelaElement) {
        tabelaElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 300);

    //console.log('🔍 Aplicando filtros com valores:', values);
    //console.log('📊 Total de dados disponíveis:', dados.length);

    let filtrados = [...fonteDados];

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
    setVisibleCount(Math.min(DEFAULT_BATCH_SIZE, filtrados.length));
  };

  const limparFiltros = () => {
    form.reset();
    setDadosFiltrados(dados);
    setVisibleCount(Math.min(DEFAULT_BATCH_SIZE, dados.length));
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
      console.log('📊 Iniciando exportação para Excel...');
      console.log('📊 Total de dados para exportar:', dadosFiltrados.length);
      console.log('🔐 Token antes da exportação:', window.sessionStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('👤 Usuário antes da exportação:', user?.name);
      
      // Verificar se o usuário ainda está autenticado
      if (!user) {
        console.error('❌ Usuário não autenticado durante exportação');
        alert('Sessão expirada. Faça login novamente.');
        return;
      }
      
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
      XLSX.utils.book_append_sheet(wb, ws, "Lojas Ativas");

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
      XLSX.writeFile(wb, `Bradesco Expresso - Lojas Ativas - ${dataAtual}.xlsx`);

      console.log('✅ Arquivo Excel exportado com sucesso!');
      console.log('📊 Exportação concluída, usuário ainda autenticado:', !!user);
      console.log('🔐 Token após exportação:', window.sessionStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('👤 Usuário após exportação:', user?.name);
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error);
      console.error('❌ Erro completo:', error);
      console.log('🔐 Token após erro:', window.sessionStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('👤 Usuário após erro:', user?.name);
      
      // Verificar se o erro está relacionado à autenticação
      if (!user || !window.sessionStorage.getItem('token')) {
        console.error('❌ Problema de autenticação detectado durante exportação');
        alert('Sessão expirada durante a exportação. Faça login novamente.');
        return;
      }
      
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
  const formatPt = (n: number) => {
    const num = Math.round(n);
    return num >= 1000 ? new Intl.NumberFormat('pt-BR').format(num) : num.toString();
  };

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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando Lojas Ativas</h2>
            <p className="text-gray-600 text-center mb-4">
              Aguarde enquanto carregamos os dados das lojas ativas
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
            <p className="text-gray-500">Monitoramento e estratégias para lojas ativas (1 Transação) - {user?.name}</p>
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

        {/* Resumo de Produção */}
        <ResumoProducaoPontosAtivos dados={dados} onFiltrarPadrao={filtrarPorPadrao} />
        
        {/* Grid Principal */}
        <div className="space-y-4">

         <Tabs defaultValue="pontos">
           
          <TabsContent value="pontos">
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1"> <span className="text-sm font-medium text-blue-800"> {dadosFiltrados.length} {dadosFiltrados.length === 1 ? 'loja' : 'lojas'} </span> </div>
              
                </div>
                </CardHeader>
              <CardContent>
                {/* Filtros */}
                <PontosAtivosFilters
                  form={form}
                  aplicarFiltros={aplicarFiltros}
                  limparFiltros={limparFiltros}
                  exportarParaExcel={exportarParaExcel}
                  dadosFiltrados={dadosFiltrados}
                  showAnaliseFiltros={showAnaliseFiltros}
                  setShowAnaliseFiltros={setShowAnaliseFiltros}
                  canSeeHierarchyColumns={canSeeHierarchyColumns}
                  monthNames={monthNames}
                  situacoes={situacoes}
                  municipios={municipios}
                  ufs={ufs}
                  agencias={agencias}
                  supervisoresResponsaveis={supervisoresResponsaveis}
                  diretoriasRegionais={diretoriasRegionais}
                  gerenciasRegionais={gerenciasRegionais}
                  gerentesArea={gerentesArea}
                  coordenadores={coordenadores}
                />


                {/* Tabela */}
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table id="tabela-pontos-ativos" className="min-w-full table-fixed">
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

                        {/* Botão para mostrar/ocultar colunas de hierarquia */}
                        {canSeeHierarchyColumns && (
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

                        {/* Colunas de hierarquia para usuários autorizados */}
                        {canSeeHierarchyColumns && showHierarchyColumns && (
                          <>
                            <TableHead 
                              className="w-[120px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('gerenteArea')}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate">Gerente</span>
                                {ordenacao.coluna === 'gerenteArea' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('coordenador')}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate">Coordenador</span>
                                {ordenacao.coluna === 'coordenador' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('supervisor')}
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate">Supervisor</span>
                                {ordenacao.coluna === 'supervisor' && (
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
                      {dadosVisiveis.map((ponto) => (
                        <React.Fragment key={ponto.chaveLoja}>
                          <TableRow>
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
                          
                          {/* Célula vazia correspondente ao botão do olho no cabeçalho */}
                          {canSeeHierarchyColumns && (
                            <TableCell className="text-center">
                              {/* Célula vazia para alinhamento com o botão do olho */}
                            </TableCell>
                          )}

                          {/* Colunas de hierarquia para usuários autorizados */}
                          {canSeeHierarchyColumns && showHierarchyColumns && (
                            <>
                              <TableCell className="text-left">
                                <div className="text-sm text-gray-900 truncate" title={ponto.gerenteArea}>
                                  {ponto.gerenteArea}
                                </div>
                              </TableCell>
                              <TableCell className="text-left">
                                <div className="text-sm text-gray-900 truncate" title={ponto.coordenador}>
                                  {ponto.coordenador}
                                </div>
                              </TableCell>
                              <TableCell className="text-left">
                                <div className="text-sm text-gray-900 truncate" title={ponto.supervisor}>
                                  {ponto.supervisor}
                                </div>
                              </TableCell>
                            </>
                          )}
                          
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title={linhaExpandida === ponto.chaveLoja ? "Ocultar detalhes" : "Ver detalhes"}
                                className="bg-blue-50 border-blue-200 hover:bg-blue-100 h-8 w-8 p-0"
                                onClick={() => handleToggleDetalhes(ponto.chaveLoja)}
                              >
                                {linhaExpandida === ponto.chaveLoja ? (
                                  <EyeOff size={14} className="text-blue-600" />
                                ) : (
                                  <Info size={14} className="text-blue-600" />
                                )}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                title="Adicionar tratativa"
                                className="bg-green-50 border-green-200 hover:bg-green-100 h-8 w-8 p-0"
                                onClick={() => handleAbrirTratativa(ponto)}
                              >
                                <Plus size={14} className="text-green-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Linha expandida com detalhes */}
                        {linhaExpandida === ponto.chaveLoja && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={canSeeHierarchyColumns && showHierarchyColumns ? 15 : 8} className="p-4">
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  
                                  {/* Coluna 1: Informações Básicas */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                                      <MapPin className="h-4 w-4" />
                                      Informações Básicas
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Município:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.municipio}, {ponto.uf}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Endereço:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.endereco}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Segmento:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.segmento}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Inauguração:</span>
                                        <span className="col-span-2 text-gray-900">
                                          {ponto.dataInauguracao 
                                            ? format(new Date(ponto.dataInauguracao), "dd/MM/yyyy", { locale: ptBR })
                                            : "Não informado"
                                          }
                                        </span>
                                      </div>
                                    </div>

                                    {/* Hierarquia */}
                                    <div className="pt-3 border-t border-gray-100">
                                      <h4 className="font-semibold text-blue-900 flex items-center gap-2 text-sm mb-3">
                                        <BarChart3 className="h-4 w-4" />
                                        Hierarquia
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-medium text-gray-600">Diretoria:</span>
                                          <span className="col-span-2 text-gray-900">{ponto.diretoriaRegional}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <span className="font-medium text-gray-600">G. Regional:</span>
                                          <span className="col-span-2 text-gray-900">{ponto.gerenciaRegional}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Agência:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.agencia} - {ponto.nome_agencia}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">PAA:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.chave_paa} - {ponto.nome_paa}</span>
                                      </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Coluna 2: Status e Produtos */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                                      <Activity className="h-4 w-4" />
                                      Status & Produtos
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600 text-sm">Situação:</span>
                                        <Badge 
                                          variant={
                                            ponto.situacao === 'BLOQUEADO' ? 'destructive' :
                                            ponto.situacao === 'REATIVAÇÃO' ? 'secondary' :
                                            ponto.situacao === 'CONTRATAÇÃO' ? 'default' :
                                            'outline'
                                          }
                                          className="text-xs"
                                        >
                                          {ponto.situacao}
                                        </Badge>
                                      </div>
                                      
                                      {ponto.situacao === 'BLOQUEADO' && (
                                        <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
                                          <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="font-medium text-red-700">Data Bloqueio:</span>
                                            <span className="col-span-2 text-red-900">
                                              {ponto.dt_bloqueio 
                                                ? format(new Date(ponto.dt_bloqueio), "dd/MM/yyyy", { locale: ptBR })
                                                : "Não informado"
                                              }
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="font-medium text-red-700">Motivo:</span>
                                            <span className="col-span-2 text-red-900">{ponto.motivo_bloqueio || "Não informado"}</span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="grid grid-cols-3 gap-2 text-sm">
                                        <span className="font-medium text-gray-600">Última Transação:</span>
                                        <span className="col-span-2 text-gray-900">
                                          {ponto.dataUltimaTransacao 
                                            ? format(new Date(ponto.dataUltimaTransacao), "dd/MM/yyyy", { locale: ptBR })
                                            : "Não informado"
                                          }
                                        </span>
                                      </div>
                                    </div>

                                    {/* Produtos Habilitados */}
                                    <div className="pt-3 border-t border-gray-100">
                                      <h5 className="font-medium text-gray-700 text-sm mb-3">Produtos Habilitados</h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2">
                                          {ponto.produtosHabilitados.consignado ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-600" />
                                          )}
                                          <span className={`text-xs ${ponto.produtosHabilitados.consignado ? "text-green-700" : "text-red-700"}`}>
                                            Consignado
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {ponto.produtosHabilitados.microsseguro ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-600" />
                                          )}
                                          <span className={`text-xs ${ponto.produtosHabilitados.microsseguro ? "text-green-700" : "text-red-700"}`}>
                                            Microsseguro
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {ponto.produtosHabilitados.lime ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-600" />
                                          )}
                                          <span className={`text-xs ${ponto.produtosHabilitados.lime ? "text-green-700" : "text-red-700"}`}>
                                            Lime
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {ponto.produtosHabilitados.conta ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-600" />
                                          )}
                                          <span className={`text-xs ${ponto.produtosHabilitados.conta ? "text-green-700" : "text-red-700"}`}>
                                            Conta
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Coluna 3: Contato e Dados Complementares */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                                      <Heart className="h-4 w-4" />
                                      Contato & Dados
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Tel. p/ Contato:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.telefoneLoja || "Não informado"}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Contato:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.nomeContato || "Não informado"}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">Chave Loja:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.chaveLoja}</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">PACB:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.nrPacb}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="font-medium text-gray-600">CNPJ:</span>
                                        <span className="col-span-2 text-gray-900">{ponto.cnpj}</span>
                                      </div>

                                    </div>

                                    {/* Informações Adicionais */}
                                    <div className="pt-3 border-t border-gray-100">
                                      <h5 className="font-medium text-gray-700 text-sm mb-3">Resumo de Transações</h5>
                                      <div className="grid grid-cols-4 gap-1 text-center">
                                        <div className="bg-gray-100 rounded p-2">
                                          <div className="text-xs font-medium text-gray-600">M-3</div>
                                          <div className={`text-lg font-bold ${ponto.mesM3 === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ponto.mesM3}
                                          </div>
                                        </div>
                                        <div className="bg-gray-100 rounded p-2">
                                          <div className="text-xs font-medium text-gray-600">M-2</div>
                                          <div className={`text-lg font-bold ${ponto.mesM2 === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ponto.mesM2}
                                          </div>
                                        </div>
                                        <div className="bg-gray-100 rounded p-2">
                                          <div className="text-xs font-medium text-gray-600">M-1</div>
                                          <div className={`text-lg font-bold ${ponto.mesM1 === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ponto.mesM1}
                                          </div>
                                        </div>
                                        <div className="bg-gray-100 rounded p-2">
                                          <div className="text-xs font-medium text-gray-600">M-0</div>
                                          <div className={`text-lg font-bold ${ponto.mesM0 === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ponto.mesM0}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </React.Fragment>
                       ))}
                     </TableBody>
                   </Table>
                </div>

                {/* Contador de resultados */}
                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                  <div className="text-sm text-gray-500">
                    Exibindo {dadosVisiveis.length} de {totalResultados} {totalResultados === 1 ? 'loja' : 'lojas'}
                  </div>
                  {hasMoreResults && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleLoadMore}>
                        Carregar mais {proximaCarga} {proximaCarga === 1 ? 'registro' : 'registros'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleShowAll}>
                        Mostrar tudo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
                     </TabsContent>

           
        </Tabs>
        </div>
      </div>

      {/* Modal de Tratativa */}
      {pontoSelecionado && (
        <TratativaModal
          isOpen={modalTratativaAberto}
          onClose={handleFecharTratativa}
          onSuccess={handleSucessoTratativa}
          pontoAtivo={{
            chaveLoja: pontoSelecionado.chaveLoja,
            nomeLoja: pontoSelecionado.nomeLoja
          }}
        />
      )}
    </div>
  );
};

export default PontosAtivos;

