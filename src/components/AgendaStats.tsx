import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  X,
  ChevronLeft,
  Filter,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { eventApi, Event, userApi, eventCategoryApi, User } from "@/services/api";
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
  const [currentPage, setCurrentPage] = useState(0);
  
  // Estados para filtros hierárquicos
  const [selectedGerenteFilter, setSelectedGerenteFilter] = useState<string>("all");
  const [selectedCoordenadorFilter, setSelectedCoordenadorFilter] = useState<string>("all");
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>("all");
  
  // Estado para controlar a expansão das descrições dos eventos
  const [expandedDescricoes, setExpandedDescricoes] = useState<Set<string>>(new Set());
  
  const EVENTS_PER_PAGE = 5;

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

  // Buscar gerentes (apenas para admin)
  const { data: gerentes = [], isLoading: isLoadingGerentes } = useQuery({
    queryKey: ['gerentes-stats'],
    queryFn: async () => {
      if (isAdmin) {
        try {
          return await userApi.getUsersByRole("gerente");
        } catch (error) {
          console.error("Erro ao buscar gerentes:", error);
          return [];
        }
      }
      return [];
    },
    enabled: isAdmin,
  });

  // Buscar coordenadores (baseado no gerente selecionado)
  const { data: coordenadores = [], isLoading: isLoadingCoordenadores } = useQuery({
    queryKey: ['coordenadores-stats', selectedGerenteFilter],
    queryFn: async () => {
      if (isAdmin && selectedGerenteFilter !== "all") {
        try {
          const subordinados = await userApi.getSubordinates(selectedGerenteFilter);
          return subordinados.filter(user => user.role === "coordenador");
        } catch (error) {
          console.error("Erro ao buscar coordenadores:", error);
          return [];
        }
      } else if (isAdmin && selectedGerenteFilter === "all") {
        try {
          return await userApi.getUsersByRole("coordenador");
        } catch (error) {
          console.error("Erro ao buscar coordenadores:", error);
          return [];
        }
      } else if (isCoordinator) {
        // Se o usuário for coordenador, não precisa buscar outros coordenadores
        return [];
      }
      return [];
    },
    enabled: isAdmin || isCoordinator,
  });

  // Buscar supervisores para a estatística
  const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['supervisors-stats', user?.id, selectedGerenteFilter, selectedCoordenadorFilter],
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
          if (selectedCoordenadorFilter !== "all") {
            // Buscar supervisores do coordenador selecionado
            const subordinados = await userApi.getSubordinates(selectedCoordenadorFilter);
            return subordinados.filter(user => user.role === "supervisor");
          } else if (selectedGerenteFilter !== "all") {
            // Buscar todos os supervisores do gerente selecionado
            const coordenadores = await userApi.getSubordinates(selectedGerenteFilter);
            const coordenadoresIds = coordenadores
              .filter(user => user.role === "coordenador")
              .map(user => user.id);
            
            const supervisoresList: User[] = [];
            for (const coordenadorId of coordenadoresIds) {
              const supervisoresDoCoord = await userApi.getSubordinates(coordenadorId);
              supervisoresList.push(...supervisoresDoCoord.filter(user => user.role === "supervisor"));
            }
            return supervisoresList;
          } else {
            // Buscar todos os supervisores
            return await userApi.getUsersByRole("supervisor");
          }
        } catch (error) {
          console.error("Erro ao buscar supervisores:", error);
          return [];
        }
      }
      return [];
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
  });

  // Resetar filtros subordinados quando filtro superior muda
  useEffect(() => {
    if (selectedGerenteFilter === "all") {
      setSelectedCoordenadorFilter("all");
      setSelectedSupervisorFilter("all");
    }
  }, [selectedGerenteFilter]);

  useEffect(() => {
    if (selectedCoordenadorFilter === "all") {
      setSelectedSupervisorFilter("all");
    }
  }, [selectedCoordenadorFilter]);

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

  // Reset da página quando os eventos mudam ou filtros mudam
  useEffect(() => {
    setCurrentPage(0);
  }, [summary.proximosAgendamentos.length, selectedSupervisorFilter, selectedCoordenadorFilter, selectedGerenteFilter]);

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
        
        // Ordenar eventos da semana por data
        todosEventosFuturos.sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
        
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

  // Filtrar eventos da semana baseado nos filtros hierárquicos
  const filteredProximosAgendamentos = React.useMemo(() => {
    let eventos = summary.proximosAgendamentos;

    // Se há filtro específico de supervisor, usar apenas ele
    if (selectedSupervisorFilter !== "all") {
      return eventos.filter(evento => evento.supervisorId === selectedSupervisorFilter);
    }

    // Para admin, aplicar filtros hierárquicos se não há supervisor específico
    if (isAdmin) {
      // Se há coordenador selecionado, pegar eventos de todos seus supervisores
      if (selectedCoordenadorFilter !== "all") {
        const supervisoresDoCoord = supervisors.map(s => s.id);
        return eventos.filter(evento => 
          evento.supervisorId && supervisoresDoCoord.includes(evento.supervisorId)
        );
      }
      
      // Se há gerente selecionado, pegar eventos de todos supervisores do gerente
      if (selectedGerenteFilter !== "all") {
        const supervisoresDoGerente = supervisors.map(s => s.id);
        return eventos.filter(evento => 
          evento.supervisorId && supervisoresDoGerente.includes(evento.supervisorId)
        );
      }
    }

    // Caso padrão: retornar todos os eventos
    return eventos;
  }, [summary.proximosAgendamentos, selectedSupervisorFilter, selectedCoordenadorFilter, selectedGerenteFilter, supervisors, isAdmin]);

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

  // Funções para controlar a expansão das descrições
  const toggleDescricaoExpansion = (eventId: string) => {
    setExpandedDescricoes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const isDescricaoExpanded = (eventId: string) => {
    return expandedDescricoes.has(eventId);
  };

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
        <Card className="border-2 border-gray-100 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-600" />
              Categorias de Eventos
            </CardTitle>
            <CardDescription>
              Distribuição de eventos por categoria no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading || isLoadingCategories ? (
              <div className="space-y-3 min-h-[120px]">
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
                  <div className="text-center py-6 text-gray-500">
                    Não há eventos cadastrados neste mês
                  </div>
                )}
              </div>
            )}
            
            {/* Botão Ver todos os eventos */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="w-full border-dashed border-blue-200 hover:bg-blue-50"
                onClick={() => navigate('/agenda')}
              >
                Ver todos os eventos
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Agenda da Semana */}
        <Card className="border-2 border-gray-100 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-green-600" />
              Agenda da Semana
            </CardTitle>
            <CardDescription>
              Eventos agendados para esta semana ({format(startOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})} - {format(endOfWeek(new Date(), {weekStartsOn: 1}), "dd/MM", {locale: ptBR})})
            </CardDescription>
            <div className="flex items-center justify-between mt-4">
              {/* Filtros hierárquicos */}
              <div className="flex items-center gap-2 flex-wrap">
                {(selectedGerenteFilter !== "all" || selectedCoordenadorFilter !== "all" || selectedSupervisorFilter !== "all") ? (
                  <X 
                    className="h-4 w-4 text-red-600 hover:text-red-700 cursor-pointer" 
                    onClick={() => {
                      setSelectedGerenteFilter("all");
                      setSelectedCoordenadorFilter("all");
                      setSelectedSupervisorFilter("all");
                    }}
                  />
                ) : (
                  <Filter className="h-4 w-4 text-gray-500" />
                )}
                
                {/* Filtro de Gerente (apenas para Admin) */}
                {isAdmin && (
                  <Select value={selectedGerenteFilter} onValueChange={setSelectedGerenteFilter}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Gerente..."/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Gerente</SelectItem>
                      {gerentes.map(gerente => (
                        <SelectItem key={gerente.id} value={gerente.id}>{gerente.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Filtro de Coordenador (apenas para Admin) */}
                {isAdmin && (
                  <Select value={selectedCoordenadorFilter} onValueChange={setSelectedCoordenadorFilter}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Coordenador..."/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{selectedGerenteFilter === "all" ? "Coordenador" : "Coordenador"}</SelectItem>
                      {coordenadores.map(coordenador => (
                        <SelectItem key={coordenador.id} value={coordenador.id}>{coordenador.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Filtro de Supervisor */}
                <Select value={selectedSupervisorFilter} onValueChange={setSelectedSupervisorFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Supervisor..."/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAdmin 
                      ? (selectedCoordenadorFilter !== "all" 
                          ? "Gerente Comercial"
                          : selectedGerenteFilter !== "all" 
                            ? "Gerente Comercial"
                            : "Gerente Comercial")
                      : "Gerente Comercial"}</SelectItem>
                    {supervisors.map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Controles de paginação */}
              {filteredProximosAgendamentos.length > EVENTS_PER_PAGE && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-normal">
                    {Math.min((currentPage * EVENTS_PER_PAGE) + 1, filteredProximosAgendamentos.length)}-{Math.min((currentPage + 1) * EVENTS_PER_PAGE, filteredProximosAgendamentos.length)} de {filteredProximosAgendamentos.length}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProximosAgendamentos.length / EVENTS_PER_PAGE) - 1, prev + 1))}
                      disabled={(currentPage + 1) * EVENTS_PER_PAGE >= filteredProximosAgendamentos.length}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          
          {/* Linha divisória para separar filtros do conteúdo */}
          <div className="border-t border-gray-100 mx-6"></div>
          
          <CardContent className="pb-4 pt-4">
            {isLoading ? (
              <div className="space-y-4 min-h-[120px]">
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
            ) : filteredProximosAgendamentos.length > 0 ? (
              <div className="space-y-4">
                {filteredProximosAgendamentos
                  .slice(currentPage * EVENTS_PER_PAGE, (currentPage + 1) * EVENTS_PER_PAGE)
                  .map(evento => (
                  <div key={evento.id} className="border-b pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-medium text-sm truncate mb-1" title={evento.titulo}>
                          {evento.titulo}
                        </h4>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate" title={evento.supervisorName}>
                            {evento.supervisorName}
                          </span>
                          <span className="mx-1">•</span>
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate" title={`${evento.municipio}, ${evento.uf}`}>
                            {evento.municipio}, {evento.uf}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex-shrink-0 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(evento.dataInicio), "dd/MM", {locale: ptBR})}
                      </div>
                    </div>
                    {/* Badge de categoria com largura completa */}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full inline-block font-medium ${
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
                      
                      {/* Botão para mostrar descrição */}
                      {evento.other_description && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDescricaoExpansion(evento.id)}
                          className="h-6 w-6 p-0 hover:bg-gray-100 ml-2"
                          title={isDescricaoExpanded(evento.id) ? "Ocultar descrição" : "Ver descrição"}
                        >
                          <MessageSquare className="h-3 w-3 text-gray-500" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Descrição do evento - só aparece quando expandida */}
                    {evento.other_description && isDescricaoExpanded(evento.id) && (
                      <div className="mt-2">
                        <div className="border-t border-gray-100 pt-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-gray-500" />
                              <span className="text-xs font-medium text-gray-600">Descrição:</span>
                            </div>
                            {evento.other_description.length > 80 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDescricaoExpansion(evento.id)}
                                className="h-5 w-5 p-0 hover:bg-gray-100"
                                title="Ocultar descrição"
                              >
                                <ChevronUp className="h-2.5 w-2.5 text-gray-500" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {evento.other_description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {(() => {
                  if (selectedSupervisorFilter !== "all") {
                    const supervisor = supervisors.find(s => s.id === selectedSupervisorFilter);
                    return `Não há agendamentos para ${supervisor?.name || "este supervisor"} nesta semana`;
                  }
                  
                  if (isAdmin && selectedCoordenadorFilter !== "all") {
                    const coordenador = coordenadores.find(c => c.id === selectedCoordenadorFilter);
                    return `Não há agendamentos para a equipe de ${coordenador?.name || "este coordenador"} nesta semana`;
                  }
                  
                  if (isAdmin && selectedGerenteFilter !== "all") {
                    const gerente = gerentes.find(g => g.id === selectedGerenteFilter);
                    return `Não há agendamentos para a equipe de ${gerente?.name || "este gerente"} nesta semana`;
                  }
                  
                  return "Não há agendamentos para esta semana";
                })()}
              </div>
            )}
            
            {/* Botão Ver todos os agendamentos */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="w-full border-dashed border-green-200 hover:bg-green-50"
                onClick={() => navigate('/agenda')}
              >
                Ver todos os agendamentos
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Supervisores */}
      <SupervisorGridDialog 
        open={showSupervisorGrid}
        onOpenChange={setShowSupervisorGrid}
        supervisores={supervisors}
        eventos={eventosPorSupervisor}
        onViewAgenda={handleViewAgenda}
      />
    </div>
  );
};

export default AgendaStats; 