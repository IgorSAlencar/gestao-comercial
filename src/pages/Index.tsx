import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  BarChart2,
  Users,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Phone,
  CalendarDays,
  MapPin,
  MessageSquare,
  ChevronRight,
  Loader2,
  CreditCard,
  Shield,
  Flame,
  AlertCircle,
  ChartBar,
  TrendingDown,
  Activity,
  Plus,
  MoreHorizontal,
  Info,
  Search,
  Pin,
  Download,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import DashboardGerencial from "@/components/DashboardGerencial";
import AgendaStats from "@/components/AgendaStats";
import { eventApi, Event, hotListApi } from "@/services/api";
import { format, isPast, isToday, parseISO, addHours, startOfWeek, endOfWeek, isWithinInterval, isFuture, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import axios from 'axios';

const Index = () => {
  const navigate = useNavigate();
  const { user, isManager, isCoordinator, isSupervisor, isAdmin } = useAuth();
  
  const [alertas, setAlertas] = useState([]);
  const [eventosHoje, setEventosHoje] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [totalLeadsUsuario, setTotalLeadsUsuario] = useState(0);
  const [totalLeadsPendentes, setTotalLeadsPendentes] = useState(0);
  const [estatisticas, setEstatisticas] = useState({
    totalAcoes: 0,
    concluidas: 0,
    pendentes: 0,
    prioridadeAlta: 0,
    contasAbertasSemana: 0,
    contasAbertasMes: 0
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [dataLoadedSuccessfully, setDataLoadedSuccessfully] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Função para verificar se um evento ocorre no dia atual
  const eventoHoje = (evento: Event) => {
    const dataInicio = new Date(evento.dataInicio);
    const dataFim = new Date(evento.dataFim);
    const hoje = new Date();
    
    // Definir horas para comparação apenas das datas
    hoje.setHours(0, 0, 0, 0);
    
    // Cria cópias das datas para não modificar os originais
    const inicioComparacao = new Date(dataInicio);
    const fimComparacao = new Date(dataFim);
    
    inicioComparacao.setHours(0, 0, 0, 0);
    fimComparacao.setHours(23, 59, 59, 999);
    
    // Um evento ocorre hoje se:
    // 1. Sua data de início é hoje, ou
    // 2. Sua data de fim é hoje, ou
    // 3. Ele começa antes de hoje e termina depois de hoje (evento de múltiplos dias)
    return (
      // Evento começa hoje
      (inicioComparacao.getFullYear() === hoje.getFullYear() &&
       inicioComparacao.getMonth() === hoje.getMonth() &&
       inicioComparacao.getDate() === hoje.getDate()) ||
      
      // Evento termina hoje
      (fimComparacao.getFullYear() === hoje.getFullYear() &&
       fimComparacao.getMonth() === hoje.getMonth() &&
       fimComparacao.getDate() === hoje.getDate()) ||
      
      // Evento contínuo que inclui hoje
      (inicioComparacao <= hoje && fimComparacao >= hoje)
    );
  };

  // Verificar se um evento já passou
  const eventoPassado = (evento: Event) => {
    return isPast(new Date(evento.dataFim));
  };
  
  // Verificar se um evento tem tratativa
  const temTratativa = (evento: Event) => {
    return evento.tratativa && evento.tratativa.trim() !== '';
  };

  // Função para verificar se um evento é da semana atual (apenas eventos futuros)
  const eventoDestaSemana = (evento: Event) => {
    const dataInicio = new Date(evento.dataInicio);
    const dataFim = new Date(evento.dataFim);
    const hoje = new Date();
    
    // Definir início da semana (segunda) e fim da semana (domingo)
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // 1 = segunda-feira
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
    
    // Para debug
    //console.log('Analisando evento:', {
      //titulo: evento.titulo,
      //dataInicio: format(dataInicio, 'dd/MM/yyyy HH:mm'),
      //dataFim: format(dataFim, 'dd/MM/yyyy HH:mm'),
      //inicioSemana: format(inicioSemana, 'dd/MM/yyyy HH:mm'),
      //fimSemana: format(fimSemana, 'dd/MM/yyyy HH:mm')
    //});
    
    // Um evento é considerado da semana atual se:
    // 1. Começa no futuro (não passou ainda)
    // 2. Está dentro do intervalo da semana atual
    const eventoFuturo = isFuture(dataInicio) || isToday(dataInicio);
    const dentroDaSemana = isWithinInterval(dataInicio, {
      start: inicioSemana,
      end: fimSemana
    }) || isWithinInterval(dataFim, {
      start: inicioSemana,
      end: fimSemana
    });
    
    const resultado = eventoFuturo && dentroDaSemana;
    
    // Log do resultado
    //console.log('Resultado análise:', {
      //titulo: evento.titulo,
      //eventoFuturo,
      //dentroDaSemana,
      //ehDaSemana: resultado
    //});
    
    return resultado;
  };
  
  // Função para incluir eventos de hoje, da semana e pendentes de tratativas
  const eventosParaMostrar = (eventos: Event[]) => {
    //console.log('Analisando eventos para mostrar:', eventos.length);
    
    // 1. Eventos de hoje (prioridade máxima)
    const eventosDeHoje = eventos.filter(eventoHoje);
    //console.log('Eventos de hoje:', eventosDeHoje.length);
    
    // 2. Eventos da semana atual (excluindo os de hoje)
    const eventosDaSemana = eventos.filter(evento => 
      eventoDestaSemana(evento) && !eventoHoje(evento) && !eventoPassado(evento)
    );
    //console.log('Eventos da semana (excluindo hoje):', eventosDaSemana.length);
    
    // 3. Eventos pendentes de tratativas (prioridade alta, independente da data)
    const eventosPendentes = eventos.filter(evento => 
      eventoPassado(evento) && !temTratativa(evento)
    );
    //console.log('Eventos pendentes de tratativas:', eventosPendentes.length);
    
    // 4. Combinar todos os eventos com prioridades
    const eventosParaExibir = [
      ...eventosDeHoje,           // Primeiro: eventos de hoje
      ...eventosPendentes,        // Segundo: eventos pendentes (independente da data)
      ...eventosDaSemana          // Terceiro: outros eventos da semana
    ];
    
    // Remover duplicatas baseado no ID
    const eventosUnicos = eventosParaExibir.filter((evento, index, array) => 
      array.findIndex(e => e.id === evento.id) === index
    );
    
    //console.log('Eventos únicos para exibir:', eventosUnicos.length);
    
    return eventosUnicos;
  };
  
  // Função consolidada para carregar todos os dados
  const carregarTodosDados = useCallback(async (tentativa = 0) => {
        if (!user) return;

    setLoading(true);
    setLoadingError(null);
    
    try {
      //console.log(`Carregando dados... Tentativa ${tentativa + 1}`);
      
      // Array para armazenar as promessas
      const promises = [];
      
      // 1. Carregar eventos
      const eventosPromise = (async () => {
        try {
          // Carregar todos os eventos (não apenas os de hoje)
          let eventosData;
          
          if (isManager || isCoordinator || isAdmin) {
            // Gerentes e coordenadores podem ver eventos de toda a equipe
            eventosData = await eventApi.getEvents(); // Sem filtro de data
          } else if (user?.id) {
            // Outros usuários veem apenas seus próprios eventos
            eventosData = await eventApi.getEvents(undefined, user.id); // Sem filtro de data
          } else {
            eventosData = [];
          }
          
          //console.log(`Eventos carregados:`, eventosData);
          //console.log(`Total de eventos: ${eventosData.length}`);
          
          return eventosData;
        } catch (error) {
          //console.error("Erro ao carregar eventos:", error);
          // Retorna array vazio em caso de erro para não quebrar o loading
          return [];
        }
      })();

      // 2. Carregar hotlist summary
      const hotlistPromise = (async () => {
        try {
        const hotListSummary = await hotListApi.getHotListSummary(user.id);
          //console.log('Hotlist summary carregado:', hotListSummary);
          return hotListSummary;
        } catch (error) {
          //console.error("Erro ao carregar hotlist:", error);
          // Retorna dados padrão em caso de erro
          return { leadsPendentes: 0, totalLeads: 0 };
        }
      })();
        
      // 3. Simular estatísticas (futuramente será uma API real)
      const estatisticasPromise = Promise.resolve({
          totalAcoes: 0,
          concluidas: 0,
          pendentes: 0,
          prioridadeAlta: 0,
          contasAbertasSemana: Math.floor(Math.random() * 30) + 10,
          contasAbertasMes: Math.floor(Math.random() * 120) + 50
        });
        
      // 4. Simular alertas (futuramente será uma API real)
      const alertasPromise = Promise.resolve([
          {
            id: 1,
            tipo: "comercial",
            titulo: "Oportunidade de venda",
            descricao: "Loja Jardins com potencial para abertura de 15 novas contas",
            prazo: new Date(Date.now() + 86400000 * 2),
            prioridade: "alta"
          },
          {
            id: 2,
            tipo: "contato",
            titulo: "Retorno pendente",
            descricao: "Correspondente Centro solicitou contato sobre linha de crédito",
            prazo: new Date(Date.now() + 86400000),
            prioridade: "media"
          },
          {
            id: 3,
            tipo: "visita",
            titulo: "Visita programada",
            descricao: "Agendar visita ao Posto Vila Nova - sem contato há 15 dias",
            prazo: new Date(Date.now() + 86400000 * 5),
            prioridade: "baixa"
          }
        ]);
      
      // Aguardar todas as promessas
      const [eventosData, hotListSummary, estatisticasData, alertasData] = await Promise.all([
        eventosPromise,
        hotlistPromise,
        estatisticasPromise,
        alertasPromise
      ]);
      
      // Atualizar todos os estados
      setEvents(eventosData);
      
      // Processar eventos para exibição (hoje, semana e pendentes)
      const hoje = new Date();
      //console.log(`Data atual para comparação: ${format(hoje, 'yyyy-MM-dd HH:mm:ss')}`);
      
      // Aplicar a lógica de filtragem para mostrar eventos relevantes
      const eventosRelevantes = eventosParaMostrar(eventosData);
      
      //console.log(`Eventos relevantes para exibição: ${eventosRelevantes.length}`, eventosRelevantes);
      setEventosHoje(eventosRelevantes);
      
      setTotalLeadsPendentes(hotListSummary.leadsPendentes);
      setTotalLeadsUsuario(hotListSummary.totalLeads || 0);
      setEstatisticas(estatisticasData);
      setAlertas(alertasData);
      
      // Marcar como carregado com sucesso
      setDataLoadedSuccessfully(true);
      setRetryCount(0);
      
      //console.log("Todos os dados carregados com sucesso!");
      
      } catch (error) {
      //console.error("Erro ao carregar dados:", error);
      setLoadingError("Erro ao carregar dados. Tentando novamente...");
      
      // Retry automático até 3 tentativas
      if (tentativa < 2) {
        setTimeout(() => {
          setRetryCount(tentativa + 1);
          carregarTodosDados(tentativa + 1);
        }, 1500 * (tentativa + 1)); // Delay progressivo
      } else {
        setLoadingError("Não foi possível carregar os dados. Clique em 'Recarregar' para tentar novamente.");
      }
      } finally {
        setLoading(false);
      }
  }, [user, isManager, isCoordinator, isAdmin]);
    
  // Função para recarregar manualmente
  const recarregarDados = useCallback(() => {
    setRetryCount(0);
    setDataLoadedSuccessfully(false);
    carregarTodosDados(0);
  }, [carregarTodosDados]);
  
  // Efeito para carregar dados quando o usuário estiver disponível
  useEffect(() => {
    if (user && user.id) {
      carregarTodosDados(0);
    }
  }, [user, carregarTodosDados]);
  
  // Função para verificar se as datas de início e fim são iguais
  const datasIguais = (dataInicio: Date | string, dataFim: Date | string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    return (
      inicio.getFullYear() === fim.getFullYear() &&
      inicio.getMonth() === fim.getMonth() &&
      inicio.getDate() === fim.getDate()
    );
  };
  
  // Função para formatar o range de datas
  const formatarRangeDatas = (dataInicio: Date | string, dataFim: Date | string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (datasIguais(inicio, fim)) {
      return format(inicio, "dd 'de' MMMM 'de' yyyy", {locale: ptBR});
    } else {
      return `${format(inicio, "dd 'de' MMM", {locale: ptBR})} até ${format(fim, "dd 'de' MMM 'de' yyyy", {locale: ptBR})}`;
    }
  };
  
  // Função para formatar horário
  const formatarHorario = (data) => {
    return format(new Date(data), "HH:mm", {locale: ptBR});
  };
  
  // Função para navegar para as diferentes telas
  const navegarPara = (caminho) => {
    navigate(caminho);
  };
  
  // Função para navegar para um evento específico
  const navegarParaEvento = (eventoId: string) => {
    const evento = eventosHoje.find(e => e.id === eventoId);
    if (evento) {
      // Formata a data para o formato esperado pela URL (YYYY-MM-DD)
      const dataEvento = format(new Date(evento.dataInicio), 'yyyy-MM-dd');
      navigate(`/agenda?data=${dataEvento}&evento=${eventoId}`);
    } else {
      navigate('/agenda');
    }
  };
  
  // Determinar saudação baseada na hora do dia
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  
  // Função para formatar data
  const formatarData = (data) => {
    return format(new Date(data), "dd/MM/yyyy (EEEE)", {locale: ptBR});
  };
  
  // Adicionar o componente EventoCard no mesmo arquivo
  const EventoCard = ({ evento }) => {
    const isEventoHoje = eventoHoje(evento);
    const isEventoSemana = eventoDestaSemana(evento) && !isEventoHoje && !eventoPassado(evento);
    const isPendenteTratativa = eventoPassado(evento) && !temTratativa(evento);
    
    return (
      <div 
        className={`group p-4 rounded-lg border ${
          isPendenteTratativa ? 'border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white' :
          isEventoHoje ? 'border-blue-200 bg-gradient-to-r from-blue-50 via-white to-white' :
          isEventoSemana ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white' :
          'border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white'
        } cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5`}
        onClick={() => navegarParaEvento(evento.id)}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${
                isPendenteTratativa ? 'bg-rose-100 text-rose-600' :
                isEventoHoje ? 'bg-blue-100 text-blue-600' :
                isEventoSemana ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              } group-hover:scale-110 transition-transform`}>
                {isPendenteTratativa ? <AlertTriangle className="h-4 w-4" /> :
                 isEventoHoje ? <Calendar className="h-4 w-4" /> :
                 isEventoSemana ? <CalendarDays className="h-4 w-4" /> :
                 <Clock className="h-4 w-4" />}
              </div>
              <h4 className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                {evento.titulo}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded">
                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                <span>{formatarRangeDatas(evento.dataInicio, evento.dataFim)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{evento.location || "Sem local definido"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {isPendenteTratativa && (
            <div className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-medium rounded-full inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Pendente de Parecer
            </div>
          )}
          {isEventoHoje && (
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Hoje
            </div>
          )}
          {isEventoSemana && (
            <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Esta semana
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mostrar loading inicial até que os dados sejam carregados
  if (loading && !dataLoadedSuccessfully) {
    return (
      <div className="container mx-auto pb-12 space-y-6">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Flame className="h-3 w-3 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando dados...</h2>
          <p className="text-gray-600 text-center mb-4">
            Aguarde enquanto carregamos suas informações comerciais
          </p>
          {retryCount > 0 && (
            <p className="text-amber-600 text-sm">
              Tentativa {retryCount + 1} de 3...
            </p>
          )}
          {loadingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 max-w-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{loadingError}</span>
              </div>
              {retryCount >= 2 && (
                <Button 
                  onClick={recarregarDados}
                  className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-12 space-y-6">
      {/* Cabeçalho com saudação personalizada */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-2xl font-bold">{saudacao}, {user?.name || ""}!</h1>
        <p className="text-gray-500">
          {format(new Date(), "'Hoje é' EEEE, d 'de' MMMM", {locale: ptBR})}
        </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={recarregarDados}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 overflow-hidden relative h-full flex flex-col">
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-blue-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-400 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <CardContent className="pt-6 pr-24 flex flex-col flex-grow">
            <div>
              <p className="text-sm text-blue-600 font-medium">Programa</p>
              <h3 className="text-2xl font-bold text-blue-800">SUPERA</h3>
              <p className="text-xs text-blue-500 mt-1"></p>
            </div>
            <div className="flex space-x-3 mt-auto pt-4">
              <Button 
                onClick={() => navegarPara('/indicadores-alvo')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md h-10"
              >
                Ver Campanha
              </Button>

            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-sky-50 to-white border-sky-200 overflow-hidden relative h-full flex flex-col">
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-sky-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 transform -rotate-45">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <CardContent className="pt-6 pr-24 flex flex-col flex-grow">
            <div>
              <p className="text-sm text-sky-600 font-medium">Campanha</p>
              <h3 className="text-2xl font-bold text-sky-800">Destino<br/>Expresso</h3>
              <p className="text-xs text-sky-500 mt-1">Contratações em destaque</p>
            </div>
            <div className="mt-auto pt-4">
              <Button 
                onClick={() => navegarPara('/destino-expresso')}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md h-10"
              >
                Ver Campanha
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200 overflow-hidden relative h-full flex flex-col">
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-orange-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Flame className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-400 rounded-full border-2 border-white animate-ping"></div>
            </div>
          </div>
          <CardContent className="pt-6 pr-24 flex flex-col flex-grow">
            <div>
              <p className="text-sm text-orange-600 font-medium">Lista Quente</p>
              <h3 className="text-2xl font-bold text-orange-800">HotList</h3>
              <div className="flex flex-col gap-2 mt-2">
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {totalLeadsUsuario} leads ativos
                </div>
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {totalLeadsPendentes.toLocaleString('pt-BR')} leads pendentes
                </div>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <Button 
                onClick={() => navegarPara('/hotlist')}
                className="relative w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md h-10 group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/50 before:absolute before:inset-0 before:bg-gradient-to-t before:from-orange-600/50 before:via-orange-500/25 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
              >
                <span className="relative flex items-center justify-center gap-2 z-10">
                  Ver Leads
                  <Flame className="h-4 w-4 transition-transform group-hover:scale-125 group-hover:animate-pulse" />
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Conteúdo principal */}
      {(isManager || isAdmin) ? (
        /* Dashboard Gerencial para Gerentes, Coordenadores e Admins */
        <DashboardGerencial />
      ) : (
        /* Conteúdo de Agenda e Ações para outros usuários */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Agenda do Dia */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agenda do Dia */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Elementos decorativos de fundo */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-100/20 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
              
              <CardHeader className="pb-3 relative">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800">
                      Agenda Comercial
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Eventos de hoje, da semana e pendentes de tratativas
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-300 group"
                    onClick={() => navegarPara('/agenda')}
                  >
                    Ver Completa 
                    <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {loading && !dataLoadedSuccessfully ? (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
                        <div className="absolute inset-0 h-8 w-8 border-4 border-slate-100 rounded-full"></div>
                      </div>
                      <p className="text-sm text-slate-600 animate-pulse">Carregando eventos...</p>
                    </div>
                  </div>
                ) : eventosHoje.length > 0 ? (
                  <div className="pt-4 border-t border-slate-200">
                    {/* Seções de eventos */}
                    <div className="space-y-6">
                      {/* Eventos de Hoje */}
                      {eventosHoje.filter(eventoHoje).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                            <div className="p-1 rounded-md bg-blue-100">
                              <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                            Eventos de Hoje
                          </h3>
                          <div className="space-y-3">
                            {eventosHoje.filter(eventoHoje).map((evento) => (
                              <EventoCard key={evento.id} evento={evento} />
                            ))}
                                </div>
                              </div>
                      )}

                      {/* Eventos Pendentes de Parecer */}
                      {eventosHoje.filter(e => eventoPassado(e) && !temTratativa(e)).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                            <div className="p-1 rounded-md bg-rose-100">
                              <AlertTriangle className="h-4 w-4 text-rose-600" />
                            </div>
                            Pendentes de Parecer
                          </h3>
                          <div className="space-y-3">
                            {eventosHoje.filter(e => eventoPassado(e) && !temTratativa(e)).map((evento) => (
                              <EventoCard key={evento.id} evento={evento} />
                            ))}
                          </div>
                              </div>
                            )}

                      {/* Eventos da Semana */}
                      {eventosHoje.filter(e => eventoDestaSemana(e) && !eventoHoje(e) && !eventoPassado(e)).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                            <div className="p-1 rounded-md bg-emerald-100">
                              <CalendarDays className="h-4 w-4 text-emerald-600" />
                              </div>
                            Próximos Eventos da Semana
                          </h3>
                          <div className="space-y-3">
                            {eventosHoje.filter(e => eventoDestaSemana(e) && !eventoHoje(e) && !eventoPassado(e)).map((evento) => (
                              <EventoCard key={evento.id} evento={evento} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <div className="relative inline-block">
                      <CalendarDays className="h-16 w-16 text-slate-300 mx-auto mb-3 transform -rotate-6" />
                      <div className="absolute top-0 left-0 h-16 w-16 border-4 border-slate-100 rounded-lg transform rotate-6"></div>
                    </div>
                    <p className="text-gray-500 mb-2">Não há eventos relevantes</p>
                    <p className="text-sm text-gray-400 mb-4">Não foram encontrados eventos para hoje, desta semana ou pendentes de tratativas</p>
                    
                    {/* Debug info - mostra informações úteis sobre o carregamento */}
                    {dataLoadedSuccessfully && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600">
                          <span className="font-medium">Debug:</span> {events.length} eventos carregados, 
                          {eventosHoje.length} eventos relevantes
                        </p>
                        {events.length > 0 && (
                          <p className="text-xs text-blue-500 mt-1">
                            Há eventos no sistema, mas nenhum relevante (hoje: {format(new Date(), 'dd/MM/yyyy')}, semana atual ou pendentes)
                          </p>
                        )}
                        {events.length === 0 && (
                          <p className="text-xs text-blue-500 mt-1">
                            Nenhum evento encontrado no sistema
                          </p>
                        )}
                                                 <p className="text-xs text-blue-400 mt-1">
                           Abra o console do navegador (F12) para ver mais detalhes
                         </p>
                         <div className="flex gap-2 mt-2">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => setShowDebugInfo(!showDebugInfo)}
                             className="text-xs h-6 px-2 border-blue-300 text-blue-600 hover:bg-blue-100"
                           >
                             {showDebugInfo ? 'Ocultar' : 'Mostrar'} Debug
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={recarregarDados}
                             className="text-xs h-6 px-2 border-blue-300 text-blue-600 hover:bg-blue-100"
                           >
                             <RefreshCw className="h-3 w-3 mr-1" />
                             Recarregar
                           </Button>
                         </div>
                         {showDebugInfo && (
                           <div className="mt-3 p-2 bg-gray-50 rounded text-left">
                             <p className="text-xs font-medium text-gray-700 mb-1">Eventos carregados:</p>
                             {events.length > 0 ? (
                               <div className="space-y-1">
                                 {events.slice(0, 3).map((evento, index) => (
                                   <div key={index} className="text-xs text-gray-600">
                                     • {evento.titulo} - {format(new Date(evento.dataInicio), 'dd/MM/yyyy')}
                                   </div>
                                 ))}
                                 {events.length > 3 && (
                                   <p className="text-xs text-gray-500">... e mais {events.length - 3} eventos</p>
                                 )}
                               </div>
                             ) : (
                               <p className="text-xs text-gray-500">Nenhum evento encontrado</p>
                             )}
                           </div>
                         )}
                       </div>
                     )}
                    
                    <Button 
                      variant="outline" 
                      className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-0.5"
                      onClick={() => navegarPara('/agenda')}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Adicionar Evento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        
          {/* Coluna 2: Ações Diárias, Estratégias e Acesso Rápido */}
          <div className="space-y-6">
            {/* Links para Estratégias Comerciais */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Elementos decorativos de fundo */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full transform translate-x-32 -translate-y-32 pointer-events-none"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-lg text-slate-800">Estratégias Comerciais</CardTitle>
                <CardDescription className="text-slate-600">Acesse os produtos prioritários para atendimento</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline"
                    className="relative border-2 bg-gradient-to-r from-blue-50 via-white to-white border-blue-200 hover:border-blue-300 hover:shadow-md justify-start transition-all duration-300 group overflow-hidden"
                    onClick={() => navegarPara('/estrategia/abertura-conta')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center">
                      <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 mr-2 group-hover:scale-110 transition-transform">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900">Abertura de Contas</span>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="relative border-2 bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-200 hover:border-emerald-300 hover:shadow-md justify-start transition-all duration-300 group overflow-hidden"
                    onClick={() => navegarPara('/estrategia/credito')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center">
                      <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 mr-2 group-hover:scale-110 transition-transform">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900">Crédito</span>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="relative border-2 bg-gradient-to-r from-violet-50 via-white to-white border-violet-200 hover:border-violet-300 hover:shadow-md justify-start transition-all duration-300 group overflow-hidden"
                    onClick={() => navegarPara('/estrategia/seguro')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center">
                      <div className="p-1.5 rounded-md bg-violet-100 text-violet-600 mr-2 group-hover:scale-110 transition-transform">
                        <Shield className="h-4 w-4" />
                      </div>
                      <span className="text-slate-700 group-hover:text-slate-900">Seguros</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
