import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  CalendarDays,
  AlertCircle,
  Clock,
  CheckCircle,
  MapPin,
  ChevronRight,
  BarChart,
  BarChart2,
  Plus,
  Search,
  PieChart,
  X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { eventApi, Event, userApi, eventCategoryApi } from "@/services/api";
import { format, isToday, isPast, isFuture, isThisWeek, isThisMonth, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import SupervisorGridDialog from "./SupervisorGridDialog";

// Tipo para as categorias dinâmicas
interface EventCategory {
  id: number;
  name: string;
  description?: string;
  subcategories?: EventSubcategory[];
}

interface EventSubcategory {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
}

interface AgendaSummary {
  totalAgendamentos: number;
  agendamentosHoje: number;
  agendamentosSemana: number;
  agendamentosConcluidos: number;
  agendamentosPendentes: number;
  totalSupervisores: number;
  supervisoresSemAgenda: number;
  supervisoresComAgendaHoje: number;
  proximosAgendamentos: Event[];
  // Categorias dinâmicas de eventos
  categoriasDinamicas: Record<string, number>;
}

const AgendaStats: React.FC = () => {
  const { user, isManager, isCoordinator, isAdmin } = useAuth();
  const [summary, setSummary] = useState<AgendaSummary>({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    agendamentosSemana: 0,
    agendamentosConcluidos: 0,
    agendamentosPendentes: 0,
    totalSupervisores: 0,
    supervisoresSemAgenda: 0,
    supervisoresComAgendaHoje: 0,
    proximosAgendamentos: [],
    categoriasDinamicas: {}
  });

  const navigate = useNavigate();
  const [showSupervisoresSemAgenda, setShowSupervisoresSemAgenda] = useState(false);
  const [showSupervisorGrid, setShowSupervisorGrid] = useState(false);

  // Buscar categorias de eventos da API
  const { data: eventCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['eventCategories-stats'],
    queryFn: async () => {
      try {
        //console.log('[AgendaStats] Buscando categorias de eventos...');
        const categories = await eventCategoryApi.getCategories();
        //console.log('[AgendaStats] Categorias carregadas:', categories);
        return categories;
      } catch (error) {
        //console.error('[AgendaStats] Erro ao buscar categorias, usando categorias padrão:', error);
        // Fallback para categorias padrão
        return [
          { id: 1, name: "Prospecção", description: "Eventos de prospecção" },
          { id: 2, name: "Visitas Operacionais", description: "Visitas operacionais" },
          { id: 3, name: "Visitas de Negociação", description: "Visitas de negociação" },
          { id: 4, name: "Outros", description: "Outros tipos de eventos" }
        ];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar supervisores para a estatística
  const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['supervisors-stats', user?.id],
    queryFn: async () => {
      if (isManager || isCoordinator) {
        try {
          const allSubordinates = await userApi.getSubordinates(user?.id || '');
          // Filtrar apenas supervisores
          return allSubordinates.filter(user => user.role === "supervisor");
        } catch (error) {
          console.error("Erro ao buscar supervisores:", error);
          return [];
        }
      } else if (isAdmin) {
        try {
          return await userApi.getUsersByRole("supervisor");
        } catch (error) {
          console.error("Erro ao buscar supervisores:", error);
          return [];
        }
      }
      return [];
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
  });

  // Buscar eventos para o cálculo das estatísticas
  const { data: events = [], isLoading: isLoadingEvents, isError: isErrorEvents } = useQuery({
    queryKey: ['events-stats', user?.id],
    queryFn: async () => {
      try {
        // Usar exatamente o mesmo período que o componente Home utiliza
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        const dataInicio = format(primeiroDiaMes, 'yyyy-MM-dd');
        const dataFim = format(ultimoDiaMes, 'yyyy-MM-dd');
        
        //console.log(`[AgendaStats] Buscando eventos apenas do mês atual: ${dataInicio} até ${dataFim}`);
        
        // Usar a mesma API que o Equipe.tsx usa para consultar eventos
        return await eventApi.getEvents(dataInicio, dataFim);
      } catch (error) {
        //console.error("[AgendaStats] Erro ao buscar eventos para estatísticas:", error);
        return [];
      }
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
    retry: 1,
  });

  // Calcular estatísticas quando os dados estiverem disponíveis
  useEffect(() => {
    if (supervisors.length > 0 && eventCategories.length > 0) {
      try {
        //console.log(`[AgendaStats] Processando ${events.length} eventos para ${supervisors.length} supervisores`);
        //console.log(`[AgendaStats] Categorias disponíveis:`, eventCategories.map(c => c.name));
        
        // Mapear os IDs dos supervisores para facilitar a busca
        const supervisorIds = new Set(supervisors.map(s => s.id));
        
        // Primeiro organizar eventos por supervisor, como no Equipe.tsx
        const eventosPorSupervisor: Record<string, Event[]> = {};
        let totalEventosMes = 0; // Contador para eventos do mês
        
        // Preencher eventos para cada usuário - apenas contando cada evento uma vez
        events.forEach(evento => {
          if (evento.supervisorId && supervisorIds.has(evento.supervisorId)) {
            if (!eventosPorSupervisor[evento.supervisorId]) {
              eventosPorSupervisor[evento.supervisorId] = [];
            }
            eventosPorSupervisor[evento.supervisorId].push(evento);
          }
        });
        
        // Calcular o total exato de eventos do mês (sem duplicações)
        Object.values(eventosPorSupervisor).forEach(supervisorEventos => {
          totalEventosMes += supervisorEventos.length;
        });
        
        // Mostrar no console para fins de depuração
        //console.log('[AgendaStats] Eventos por supervisor:');
        Object.entries(eventosPorSupervisor).forEach(([supervisorId, eventos]) => {
          const supervisor = supervisors.find(s => s.id === supervisorId);
          //console.log(`- ${supervisor?.name || supervisorId}: ${eventos.length} eventos`);
        });
          //
        
        // Data atual para cálculos
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Eventos de hoje - usar mesmo formato do Equipe.tsx
        let totalEventosHoje = 0;
        let supervisoresComEventoHoje = new Set();
        
        // Eventos da semana - usar mesmo formato do Equipe.tsx
        const inicioSemana = startOfWeek(hoje, {weekStartsOn: 1}); // Segunda como início da semana
        const fimSemana = endOfWeek(hoje, {weekStartsOn: 1});
        let totalEventosSemana = 0;
        
        // Eventos concluídos e pendentes
        let totalConcluidos = 0;
        let totalPendentes = 0;
        
        // Supervisores sem eventos futuros
        const supervisoresComEventoFuturo = new Set();
        
        // Eventos futuros para exibição
        let todosEventosFuturos: Event[] = [];
        
        // Contadores dinâmicos para categorias de eventos
        const categoriaCounters: Record<string, number> = {};
        
        // Inicializar contadores para todas as categorias
        eventCategories.forEach(categoria => {
          categoriaCounters[categoria.name] = 0;
        });

        // Calcular estatísticas por supervisor
        const estatisticasPorSupervisor: Record<string, {
          totalEventos: number;
          eventosHoje: number;
          eventosSemana: number;
          eventosConcluidos: number;
          eventosPendentes: number;
          categorias: {
            prospeccao: number;
            visitasOperacionais: number;
            visitasNegociacao: number;
            outros: number;
          };
        }> = {};

        // Inicializar estatísticas para cada supervisor
        supervisors.forEach(supervisor => {
          estatisticasPorSupervisor[supervisor.id] = {
            totalEventos: 0,
            eventosHoje: 0,
            eventosSemana: 0,
            eventosConcluidos: 0,
            eventosPendentes: 0,
            categorias: {
              prospeccao: 0,
              visitasOperacionais: 0,
              visitasNegociacao: 0,
              outros: 0
            }
          };
        });
        
        // Processar estatísticas por supervisor
        Object.entries(eventosPorSupervisor).forEach(([supervisorId, supervisorEventos]) => {
          
          // Contar eventos por categoria
          supervisorEventos.forEach(evento => {
            // Contar por tipo de evento/categoria usando as categorias dinâmicas
            const eventoCategoria = evento.location || "Outros";
            
            // Verificar se a categoria existe nas categorias carregadas
            const categoriaEncontrada = eventCategories.find(c => c.name === eventoCategoria);
            
            if (categoriaEncontrada) {
              categoriaCounters[categoriaEncontrada.name]++;
            } else {
              // Se não encontrar a categoria específica, contar como "Outros"
              const outrosCategoria = eventCategories.find(c => c.name === "Outros");
              if (outrosCategoria) {
                categoriaCounters[outrosCategoria.name]++;
              } else {
                // Se não tiver categoria "Outros", usar a primeira categoria disponível
                if (eventCategories.length > 0) {
                  categoriaCounters[eventCategories[0].name]++;
                }
              }
            }
          });
          
          // Eventos de hoje
          const eventosHoje = supervisorEventos.filter(e => {
            const dataEvento = new Date(e.dataInicio);
            dataEvento.setHours(0, 0, 0, 0);
            return dataEvento.getTime() === hoje.getTime();
          });
          
          if (eventosHoje.length > 0) {
            totalEventosHoje += eventosHoje.length;
            supervisoresComEventoHoje.add(supervisorId);
          }
          
          // Eventos da semana
          const eventosSemana = supervisorEventos.filter(e => {
            const dataInicio = new Date(e.dataInicio);
            dataInicio.setHours(0, 0, 0, 0);
            return dataInicio >= inicioSemana && dataInicio <= fimSemana;
          });
          
          totalEventosSemana += eventosSemana.length;
          
          // Eventos concluídos
          const eventosConcluidos = supervisorEventos.filter(e => {
            const dataFim = new Date(e.dataFim);
            return isPast(dataFim) && e.tratativa && e.tratativa.trim() !== '';
          });
          
          totalConcluidos += eventosConcluidos.length;
          
          // Eventos pendentes
          const eventosPendentes = supervisorEventos.filter(e => {
            const dataFim = new Date(e.dataFim);
            return isPast(dataFim) && (!e.tratativa || e.tratativa.trim() === '');
          });
          
          totalPendentes += eventosPendentes.length;
          
          // Adicionar os eventos desta semana para exibição no card de próximos agendamentos
          if (eventosSemana.length > 0) {
            supervisoresComEventoFuturo.add(supervisorId);
            todosEventosFuturos = [...todosEventosFuturos, ...eventosSemana];
          }
        });
        
        // Ordenar eventos da semana por data e limitar a 5
        todosEventosFuturos.sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
        todosEventosFuturos = todosEventosFuturos.slice(0, 5);
        
        // Contar supervisores sem eventos futuros
        const supervisoresSemEventoFuturo = supervisors.filter(
          s => !supervisoresComEventoFuturo.has(s.id)
        ).length;
        
        console.log(`[AgendaStats] Estatísticas calculadas: Total=${totalEventosMes}, Hoje=${totalEventosHoje}, Semana=${totalEventosSemana}, Concluídos=${totalConcluidos}, Pendentes=${totalPendentes}`);
        console.log(`[AgendaStats] Supervisores sem agenda na semana: ${supervisoresSemEventoFuturo}`);
        console.log(`[AgendaStats] Categorias dinâmicas:`, categoriaCounters);
        
        // Atualizar o resumo
        setSummary({
          totalAgendamentos: totalEventosMes,
          agendamentosHoje: totalEventosHoje,
          agendamentosSemana: totalEventosSemana,
          agendamentosConcluidos: totalConcluidos,
          agendamentosPendentes: totalPendentes,
          totalSupervisores: supervisors.length,
          supervisoresSemAgenda: supervisoresSemEventoFuturo,
          supervisoresComAgendaHoje: supervisoresComEventoHoje.size,
          proximosAgendamentos: todosEventosFuturos,
          categoriasDinamicas: categoriaCounters
        });
      } catch (error) {
        console.error("[AgendaStats] Erro ao processar dados para estatísticas:", error);
      }
    }
  }, [supervisors, events, eventCategories]);

  // Formatar data e hora
  const formatDateTime = (dataISO: string | Date) => {
    return format(new Date(dataISO), "dd/MM/yyyy HH:mm", {locale: ptBR});
  };

  // Verificar se está carregando
  const isLoading = isLoadingSupervisors || isLoadingEvents;

  // Organizar eventos por supervisor
  const eventosPorSupervisor = React.useMemo(() => {
    const eventosMap: Record<string, Event[]> = {};
    
    events.forEach(evento => {
      if (evento.supervisorId) {
        if (!eventosMap[evento.supervisorId]) {
          eventosMap[evento.supervisorId] = [];
        }
        eventosMap[evento.supervisorId].push(evento);
      }
    });
    
    return eventosMap;
  }, [events]);

  // Função para navegar para a agenda de um supervisor
  const handleViewAgenda = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    if (supervisor) {
      navigate(`/agenda?supervisor=${supervisorId}&filter=${encodeURIComponent(supervisor.name.toLowerCase())}`);
    } else {
      navigate(`/agenda?supervisor=${supervisorId}`);
    }
  };

  // Função para navegar para o relatório de um supervisor
  const handleViewRelatorio = (supervisorId: string) => {
    navigate(`/relatorios?supervisor=${supervisorId}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Estatísticas de Agenda</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : isErrorEvents ? (
        <div className="p-6 border-2 border-red-100 bg-red-50 rounded-lg">
          <div className="flex items-center text-red-600 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Erro ao carregar dados de agendamentos</h3>
          </div>
          <p className="text-sm text-gray-600">
            Não foi possível carregar os dados de agendamentos. Verifique sua conexão com a internet ou tente novamente mais tarde.
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="p-6 border-2 border-amber-100 bg-amber-50 rounded-lg">
          <div className="flex items-center text-amber-600 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Nenhum agendamento encontrado</h3>
          </div>
          <p className="text-sm text-gray-600">
            Não foram encontrados agendamentos para o período selecionado. Verifique se há eventos cadastrados para a sua equipe.
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => navigate('/agenda')}
          >
            Ir para agenda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total de Agendamentos</p>
                  <h3 className="text-2xl font-bold text-gray-800">{summary.totalAgendamentos}</h3>
                  <div className="flex flex-col text-xs mt-1">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium mr-1">{summary.agendamentosConcluidos}</span>
                      <span className="text-gray-500">concluídos</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 text-red-600 mr-1" />
                      <span className="text-red-600 font-medium mr-1">{summary.agendamentosPendentes}</span>
                      <span className="text-gray-500">pendentes de tratativa</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    Eventos do mês atual
                  </p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowSupervisorGrid(true)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Ver Supervisores
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Agendamentos Hoje</p>
                  <h3 className="text-2xl font-bold text-gray-800">{summary.agendamentosHoje}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">{summary.supervisoresComAgendaHoje}</span> supervisores com eventos hoje
                  </p>
                  <p className="text-xs text-gray-600 mt-1 italic">
                    Eventos com início no dia de hoje
                  </p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Eventos da Semana</p>
                  <h3 className="text-2xl font-bold text-gray-800">{summary.agendamentosSemana}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(startOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})} - {format(endOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 italic">
                    Eventos com início nesta semana
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-gradient-to-br from-red-50 to-white border-red-200 shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowSupervisoresSemAgenda(!showSupervisoresSemAgenda)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Supervisores sem Agenda</p>
                  <h3 className="text-2xl font-bold text-gray-800">{summary.supervisoresSemAgenda}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    de <span className="font-medium">{summary.totalSupervisores}</span> supervisores
                  </p>
                  <p className="text-xs text-gray-600 mt-1 italic">
                    Sem eventos agendados para esta semana
                  </p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Caixa de Supervisores sem Agenda */}
      {!isLoading && showSupervisoresSemAgenda && summary.supervisoresSemAgenda > 0 && (
        <Card className="border-2 border-red-100 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                Supervisores sem Agenda na Semana
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowSupervisoresSemAgenda(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Os seguintes supervisores não possuem agendamentos nesta semana ({format(startOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})} - 
              {format(endOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {supervisors
                .filter(supervisor => {
                  // Verificar se o supervisor tem algum evento nesta semana
                  const hoje = new Date();
                  const inicioSemana = startOfWeek(hoje, {weekStartsOn: 1});
                  const fimSemana = endOfWeek(hoje, {weekStartsOn: 1});
                  
                  return !events.some(event => 
                    event.supervisorId === supervisor.id && 
                    new Date(event.dataInicio) >= inicioSemana && 
                    new Date(event.dataInicio) <= fimSemana
                  );
                })
                .map(supervisor => {
                  // Calcular estatísticas específicas para este supervisor
                  const supervisorEvents = events.filter(event => event.supervisorId === supervisor.id);
                  const eventosHoje = supervisorEvents.filter(event => {
                    const dataEvento = new Date(event.dataInicio);
                    dataEvento.setHours(0, 0, 0, 0);
                    return dataEvento.getTime() === new Date().setHours(0, 0, 0, 0);
                  });
                  
                  const eventosConcluidos = supervisorEvents.filter(event => {
                    const dataFim = new Date(event.dataFim);
                    return isPast(dataFim) && event.tratativa && event.tratativa.trim() !== '';
                  });
                  
                  const eventosPendentes = supervisorEvents.filter(event => {
                    const dataFim = new Date(event.dataFim);
                    return isPast(dataFim) && (!event.tratativa || event.tratativa.trim() === '');
                  });
                  
                  return (
                    <div key={supervisor.id} className="p-3 bg-white rounded-md border border-red-200">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <span className="font-medium">{supervisor.name}</span>
                            <p className="text-xs text-gray-500">Nenhum evento agendado para esta semana</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/agenda?supervisor=${supervisor.id}`)}
                            className="flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            Ver Agenda
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              navigate(`/agenda?supervisor=${supervisor.id}&new=true`);
                            }}
                            className="bg-bradesco-blue"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agendar
                          </Button>
                        </div>
                      </div>
                      
                      {/* Estatísticas do supervisor */}
                      <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                        <div className="bg-gray-50 p-2 rounded-md">
                          <p className="text-gray-500 text-xs">Total</p>
                          <p className="font-medium">{supervisorEvents.length}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-md">
                          <p className="text-gray-500 text-xs">Hoje</p>
                          <p className="font-medium">{eventosHoje.length}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-md">
                          <p className="text-green-600 text-xs">Concluídos</p>
                          <p className="font-medium text-green-700">{eventosConcluidos.length}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-md">
                          <p className="text-red-600 text-xs">Pendentes</p>
                          <p className="font-medium text-red-700">{eventosPendentes.length}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {supervisors.filter(supervisor => {
                const hoje = new Date();
                const inicioSemana = startOfWeek(hoje, {weekStartsOn: 1});
                const fimSemana = endOfWeek(hoje, {weekStartsOn: 1});
                
                return !events.some(event => 
                  event.supervisorId === supervisor.id && 
                  new Date(event.dataInicio) >= inicioSemana && 
                  new Date(event.dataInicio) <= fimSemana
                );
              }).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p>Todos os supervisores possuem agenda para esta semana. Parabéns!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Categorias de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-600" />
              Categorias de Eventos
            </CardTitle>
            <CardDescription>
              Distribuição de eventos por categoria no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || isLoadingCategories ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between items-center mb-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {eventCategories.map((categoria, index) => {
                  const count = summary.categoriasDinamicas[categoria.name] || 0;
                  const colors = [
                    { bg: 'bg-blue-50 hover:bg-blue-100', icon: 'bg-blue-500', iconColor: 'text-white' },
                    { bg: 'bg-green-50 hover:bg-green-100', icon: 'bg-green-500', iconColor: 'text-white' },
                    { bg: 'bg-amber-50 hover:bg-amber-100', icon: 'bg-amber-500', iconColor: 'text-white' },
                    { bg: 'bg-purple-50 hover:bg-purple-100', icon: 'bg-purple-500', iconColor: 'text-white' },
                    { bg: 'bg-red-50 hover:bg-red-100', icon: 'bg-red-500', iconColor: 'text-white' },
                    { bg: 'bg-gray-50 hover:bg-gray-100', icon: 'bg-gray-500', iconColor: 'text-white' }
                  ];
                  const colorScheme = colors[index % colors.length];
                  
                  const icons = [Search, Users, BarChart, Calendar, Clock, MapPin];
                  const IconComponent = icons[index % icons.length];
                  
                  return (
                    <div 
                      key={categoria.id}
                      className={`flex justify-between items-center p-2 ${colorScheme.bg} rounded-md cursor-pointer transition-all`}
                      onClick={() => navigate(`/agenda?filter=${encodeURIComponent(categoria.name.toLowerCase())}`)}
                    >
                      <div className="flex items-center">
                        <div className={`h-7 w-7 ${colorScheme.icon} rounded-full flex items-center justify-center mr-2`}>
                          <IconComponent className={`h-3.5 w-3.5 ${colorScheme.iconColor}`} />
                        </div>
                        <span className="font-medium">{categoria.name}</span>
                      </div>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  );
                })}
                
                {Object.values(summary.categoriasDinamicas).reduce((a, b) => a + b, 0) === 0 && (
                  <div className="text-center py-3 text-gray-500">
                    Não há eventos cadastrados neste mês
                  </div>
                )}
              </div>
            )}
            
          </CardContent>
        </Card>
        
        {/* Agenda da Semana */}
        <Card className="border-2 border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Agenda da Semana</CardTitle>
            <CardDescription>
              Eventos agendados para esta semana ({format(startOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})} - {format(endOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between border-b pb-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : summary.proximosAgendamentos.length > 0 ? (
              <div className="space-y-4">
                {summary.proximosAgendamentos.map(evento => (
                  <div key={evento.id} className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h4 className="font-medium">{evento.titulo}</h4>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{evento.supervisorName}</span>
                        <span className="mx-1">•</span>
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{evento.municipio}, {evento.uf}</span>
                      </div>
                      {/* Adicionando indicador de categoria */}
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          eventCategories.find(c => c.name === evento.location)
                            ? eventCategories.findIndex(c => c.name === evento.location) % 6 === 0 ? "bg-blue-100 text-blue-800" :
                              eventCategories.findIndex(c => c.name === evento.location) % 6 === 1 ? "bg-green-100 text-green-800" :
                              eventCategories.findIndex(c => c.name === evento.location) % 6 === 2 ? "bg-amber-100 text-amber-800" :
                              eventCategories.findIndex(c => c.name === evento.location) % 6 === 3 ? "bg-purple-100 text-purple-800" :
                              eventCategories.findIndex(c => c.name === evento.location) % 6 === 4 ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {evento.location || "Evento"}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                      <Clock className="h-3 w-3 inline-block mr-1" />
                      {format(new Date(evento.dataInicio), "dd/MM/yyyy", {locale: ptBR})}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Não há agendamentos para esta semana
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botões de ação alinhados horizontalmente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="w-full border-dashed border-blue-200 hover:bg-blue-50"
          onClick={() => navigate('/agenda')}
        >
          Ver todos os eventos
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-dashed border-green-200 hover:bg-green-50"
          onClick={() => navigate('/agenda')}
        >
          Ver todos os agendamentos
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Modal de Supervisores */}
      <SupervisorGridDialog 
        open={showSupervisorGrid}
        onOpenChange={setShowSupervisorGrid}
        supervisores={supervisors}
        eventos={eventosPorSupervisor}
        onViewAgenda={handleViewAgenda}
        onViewRelatorio={handleViewRelatorio}
      />
    </div>
  );
};

export default AgendaStats; 