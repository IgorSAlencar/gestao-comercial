import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import CardsAcaoDiariaContas from "@/components/AcaoDiariaContas";
import DashboardGerencial from "@/components/DashboardGerencial";
import AgendaStats from "@/components/AgendaStats";
import { acaoDiariaApi, AcaoDiariaContas, eventApi, Event, hotListApi } from "@/services/api";
import { format, isPast, isToday, parseISO, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user, isManager, isCoordinator, isSupervisor, isAdmin } = useAuth();
  
  const [acoesPendentes, setAcoesPendentes] = useState<AcaoDiariaContas[]>([]);
  const [alertas, setAlertas] = useState([]);
  const [eventosHoje, setEventosHoje] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loading, setLoading] = useState(true);
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
  
  // Função para carregar ações pendentes e eventos
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        // Buscar dados da HotList
        const hotListSummary = await hotListApi.getHotListSummary(user.id);
        setTotalLeadsUsuario(hotListSummary.totalLeads);
        setTotalLeadsPendentes(hotListSummary.leadsPendentes);

        // Carregar ações diárias
        const acoes = await acaoDiariaApi.getAcoesDiarias();
        setAcoesPendentes(acoes.filter(acao => acao.situacao !== "concluido"));
        
        // Simular estatísticas - em produção, estas viriam da API
        setEstatisticas({
          totalAcoes: acoes.length,
          concluidas: acoes.filter(acao => acao.situacao === "concluido").length,
          pendentes: acoes.filter(acao => acao.situacao !== "concluido").length,
          prioridadeAlta: acoes.filter(acao => acao.prioridade === "alta").length,
          contasAbertasSemana: Math.floor(Math.random() * 30) + 10,
          contasAbertasMes: Math.floor(Math.random() * 120) + 50
        });
        
        // Simular alertas - em produção, estes viriam da API
        setAlertas([
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
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    const carregarEventos = async () => {
      try {
        setLoadingEvents(true);
        // Carregar eventos do dia atual
        const dataHoje = format(new Date(), 'yyyy-MM-dd');
        
        let eventos;
        if (isManager) {
          // Gerentes e coordenadores podem ver eventos de toda a equipe
          eventos = await eventApi.getEvents(dataHoje);
        } else if (user?.id) {
          // Outros usuários veem apenas seus próprios eventos
          eventos = await eventApi.getEvents(dataHoje, user.id);
        } else {
          eventos = [];
        }
        
        console.log(`Eventos carregados para ${dataHoje}:`, eventos);
        setEventosHoje(eventos);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        setEventosHoje([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    fetchData();
    
    // Só carrega eventos se não for gerente ou coordenador
    if (!isManager) {
      carregarEventos();
    }
  }, [user]);
  
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
  
  // Verificar se um evento já passou
  const eventoPassado = (evento: Event) => {
    return isPast(new Date(evento.dataFim));
  };
  
  // Verificar se um evento tem tratativa
  const temTratativa = (evento: Event) => {
    return evento.tratativa && evento.tratativa.trim() !== '';
  };
  
  // Função para navegar para as diferentes telas
  const navegarPara = (caminho) => {
    navigate(caminho);
  };
  
  // Função para navegar para um evento específico
  const navegarParaEvento = (eventoId: string) => {
    navigate(`/agenda?evento=${eventoId}`);
  };
  
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
  
  // Determinar saudação baseada na hora do dia
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  
  // Função para formatar data
  const formatarData = (data) => {
    return format(new Date(data), "dd/MM/yyyy (EEEE)", {locale: ptBR});
  };
  
  // Modificar a função para incluir eventos pendentes de tratativas
  const eventosParaMostrar = (eventos: Event[]) => {
    // Filtrar eventos de hoje
    const eventosDeHoje = eventos.filter(eventoHoje);
    
    // Filtrar eventos pendentes (passados sem tratativa)
    const eventosPendentes = eventos.filter(evento => 
      eventoPassado(evento) && !temTratativa(evento) && !eventoHoje(evento)
    );
    
    // Combinar os arrays, primeiro os de hoje, depois os pendentes
    return [...eventosDeHoje, ...eventosPendentes.slice(0, 3)]; // Limitar a 3 eventos pendentes
  };

  return (
    <div className="container mx-auto pb-12 space-y-6">
      {/* Cabeçalho com saudação personalizada */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{saudacao}, {user?.name || ""}!</h1>
        <p className="text-gray-500">
          {format(new Date(), "'Hoje é' EEEE, d 'de' MMMM", {locale: ptBR})}
        </p>
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
              <Button 
                onClick={() => navegarPara('/pade')}
                className="flex-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-300 shadow-sm h-10"
              >
                Manual
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
                  {totalLeadsPendentes} leads pendentes
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
      {isManager ? (
        /* Dashboard Gerencial para Gerentes e Coordenadores */
        <DashboardGerencial />
      ) : (
        /* Conteúdo de Agenda e Ações para outros usuários */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Agenda do Dia */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agenda do Dia */}
            <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg text-indigo-800">Agenda Comercial</CardTitle>
                    <CardDescription>
                        Seus compromissos e visitas agendadas para hoje
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                    onClick={() => navegarPara('/agenda')}
                  >
                    Ver Completa <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEvents ? (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                      <p className="text-sm text-indigo-600">Carregando eventos...</p>
                    </div>
                  </div>
                ) : eventosHoje.length > 0 ? (
                  <div className="space-y-3">
                    {eventosParaMostrar(eventosHoje).map((evento) => (
                      <div 
                        key={evento.id} 
                        className={`p-3 rounded-md border-l-4 ${
                          !eventoHoje(evento) ? 'border-l-red-500 bg-red-50' :
                          eventoPassado(evento) && !temTratativa(evento) ? 'border-l-red-500 bg-red-50' : 
                          eventoPassado(evento) && temTratativa(evento) ? 'border-l-green-500 bg-green-50' : 
                          'border-l-indigo-500 bg-indigo-50'
                        } cursor-pointer hover:shadow-sm transition-shadow`}
                        onClick={() => navegarParaEvento(evento.id)}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                          <div className="font-medium">{evento.titulo}</div>
                          <div className="text-sm font-medium text-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md whitespace-nowrap">
                            <CalendarDays className="h-3.5 w-3.5 inline-block mr-1" />
                            {formatarRangeDatas(evento.dataInicio, evento.dataFim)}
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{evento.location || "Sem local definido"}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {!eventoHoje(evento) && (
                            <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded inline-block">
                              Pendente de tratativa
                            </div>
                          )}
                          {eventoHoje(evento) && eventoPassado(evento) && !temTratativa(evento) && (
                            <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded inline-block">
                              Evento finalizado sem tratativa
                            </div>
                          )}
                          {temTratativa(evento) && (
                            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded inline-block">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              Com tratativa
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
                    <p className="text-gray-500">Não há eventos agendados para hoje</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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
            {/* Ações Diárias */}
            <CardsAcaoDiariaContas />
            
            {/* Links para Estratégias Comerciais */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">Estratégias Comerciais</CardTitle>
                <CardDescription>Acesse os produtos prioritários para atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline"
                    className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 justify-start"
                    onClick={() => navegarPara('/estrategia/abertura-conta')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Abertura de Contas
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-2 border-green-200 bg-green-50 hover:bg-green-100 justify-start"
                    onClick={() => navegarPara('/estrategia/credito')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Crédito
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 justify-start"
                    onClick={() => navegarPara('/estrategia/seguro')}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Seguros
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
