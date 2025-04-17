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
  Briefcase,
  CalendarDays,
  MapPin,
  MessageSquare,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import CardsAcaoDiariaContas from "@/components/AcaoDiariaContas";
import { acaoDiariaApi, AcaoDiariaContas, eventApi, Event } from "@/services/api";
import { format, isPast, isToday, parseISO, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const navigate = useNavigate();
  const { user, isManager, isCoordinator, isSupervisor, isAdmin } = useAuth();
  
  const [acoesPendentes, setAcoesPendentes] = useState<AcaoDiariaContas[]>([]);
  const [alertas, setAlertas] = useState([]);
  const [eventosHoje, setEventosHoje] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loading, setLoading] = useState(true);
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
    const carregarDados = async () => {
      try {
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
    
    carregarDados();
    carregarEventos();
  }, [user?.id, isManager]);
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <p className="text-xs text-blue-500 mt-1">82% de metas alcançadas</p>
            </div>
            <div className="flex space-x-3 mt-auto pt-4">
              <Button 
                onClick={() => navegarPara('/indicadores-alvo')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md h-10"
              >
                Indicadores Alvo
              </Button>
              <Button 
                onClick={() => navegarPara('/pade')}
                className="flex-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-300 shadow-sm h-10"
              >
                PADE
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 overflow-hidden relative h-full flex flex-col">
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-blue-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-300 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <CardContent className="pt-6 pr-24 flex flex-col flex-grow">
            <div>
              <p className="text-sm text-blue-600 font-medium">Estruturas</p>
              <h3 className="text-2xl font-bold text-blue-800">23 <span className="text-sm font-normal text-blue-600">total</span></h3>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 bg-blue-50 rounded-lg p-2 shadow-sm">
              <div className="text-center px-2">
                <p className="text-xs text-blue-800 font-medium">Agências</p>
                <p className="text-lg font-bold text-blue-600">8</p>
              </div>
              <div className="h-10 border-r border-blue-200"></div>
              <div className="text-center px-2">
                <p className="text-xs text-blue-800 font-medium">PAs</p>
                <p className="text-lg font-bold text-blue-600">12</p>
              </div>
              <div className="h-10 border-r border-blue-200"></div>
              <div className="text-center px-2">
                <p className="text-xs text-blue-800 font-medium">UNs</p>
                <p className="text-lg font-bold text-blue-600">2</p>
              </div>
              <div className="h-10 border-r border-blue-200"></div>
              <div className="text-center px-2">
                <p className="text-xs text-blue-800 font-medium">Praça</p>
                <p className="text-lg font-bold text-blue-600">1</p>
              </div>
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
              <h3 className="text-2xl font-bold text-sky-800">Destino Expresso</h3>
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
        
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 overflow-hidden relative h-full flex flex-col">
          <div className="absolute -top-6 -right-6 h-24 w-24 bg-purple-100 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="relative">
              <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                  <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                  <path d="M1 21h22" />
                  <path d="M6 12h12" />
                  <path d="M12 12v9" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <CardContent className="pt-6 pr-24 flex flex-col flex-grow">
            <div>
              <p className="text-sm text-purple-600 font-medium">Campanha</p>
              <h3 className="text-2xl font-bold text-purple-800">Maratona Seguros</h3>
              <p className="text-xs text-purple-500 mt-1">Proteção para todos os clientes</p>
            </div>
            <div className="mt-auto pt-4">
              <Button 
                onClick={() => navegarPara('/maratona-seguros')}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md h-10"
              >
                Participar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Conteúdo principal */}
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
                    {isManager 
                      ? "Compromissos e visitas da equipe para hoje" 
                      : "Seus compromissos e visitas agendadas para hoje"
                    }
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

                      {isManager && evento.supervisorName && (
                        <div className="mt-1 text-xs text-gray-500">
                          Responsável: {evento.supervisorName}
                        </div>
                      )}

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
                  <Briefcase className="mr-2 h-4 w-4" />
                  Abertura de Contas
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-green-200 bg-green-50 hover:bg-green-100 justify-start"
                  onClick={() => navegarPara('/estrategia/credito')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Crédito
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 justify-start"
                  onClick={() => navegarPara('/estrategia/seguro')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Seguros
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Acesso Rápido */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg text-purple-800">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 hover:bg-purple-50"
                  onClick={() => navegarPara('/agenda')}
                >
                  <Calendar className="mr-2 h-4 w-4 text-purple-600" />
                  Agenda
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 hover:bg-purple-50"
                  onClick={() => navegarPara('/hotlist')}
                >
                  <Phone className="mr-2 h-4 w-4 text-purple-600" />
                  Hotlist
              </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 hover:bg-purple-50"
                  onClick={() => navegarPara('/estrategia-comercial')}
                >
                  <BarChart2 className="mr-2 h-4 w-4 text-purple-600" />
                  Estratégia Comercial
              </Button>
            </div>
            </CardContent>
          </Card>
          
          {/* Painel do Gerente (condicional) */}
          {isManager && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Painel Gerencial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Performance da Equipe</p>
                      <p className="text-sm text-gray-500">Mês Atual</p>
                    </div>
                    <div className="text-lg font-semibold text-green-600">78%</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Ações Pendentes</p>
                      <p className="text-sm text-gray-500">Equipe</p>
                    </div>
                    <div className="text-lg font-semibold text-amber-600">12</div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => navegarPara('/relatorios')}
                >
                  Relatórios Gerenciais
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
