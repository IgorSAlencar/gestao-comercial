import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { eventApi, Event, userApi, User } from "@/services/api";
import { format, isToday, isPast, isFuture, addDays, isThisWeek, isThisMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendaStats from "./AgendaStats";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SupervisorAgenda {
  id: string;
  nome: string;
  cargo: string;
  totalAgendamentos: number;
  agendamentosHoje: number;
  agendamentosSemana: number;
  agendamentosMes: number;
  proximaVisita: Event | null;
}

const DashboardGerencial: React.FC = () => {
  const navigate = useNavigate();
  const { user, isManager, isCoordinator, isAdmin } = useAuth();
  
  // Buscar supervisores para as estatísticas
  const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['supervisors-dashboard', user?.id],
    queryFn: async () => {
      if (isManager || isCoordinator || isAdmin) {
        try {
          if (isAdmin) {
            return await userApi.getUsersByRole("supervisor");
          } else {
            const allSubordinates = await userApi.getSubordinates(user?.id || '');
            return allSubordinates.filter(user => user.role === "supervisor");
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

  // Buscar eventos para o cálculo das estatísticas
  const { data: events = [], isLoading: isLoadingEvents, isError: isErrorEvents } = useQuery({
    queryKey: ['events-dashboard', user?.id],
    queryFn: async () => {
      try {
        // Buscar eventos de um período amplo (últimos 30 dias + próximos 30 dias)
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        
        console.log(`Buscando eventos da equipe de ${startDate} até ${endDate}`);
        
        // Buscar eventos de toda a equipe
        const events = await eventApi.getTeamEvents(startDate, endDate);
        
        console.log(`Recebidos ${events.length} eventos da equipe`);
        return events;
      } catch (error) {
        console.error("Erro ao buscar eventos para o dashboard:", error);
        return [];
      }
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
    retry: 1, // Limitar a uma nova tentativa se falhar
  });

  // Estado para armazenar os dados processados
  const [supervisoresAgenda, setSupervisoresAgenda] = useState<SupervisorAgenda[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    agendamentosSemana: 0,
    supervisoresSemAgendamento: 0,
    supervisoresComAgendamentoHoje: 0
  });

  // Processar os dados quando estiverem disponíveis
  useEffect(() => {
    if (supervisors.length > 0) {
      processarDados(supervisors, events);
    }
  }, [supervisors, events]);

  // Função para processar os dados dos supervisores e eventos
  const processarDados = (supervisores: User[], eventos: Event[]) => {
    try {
      console.log(`Processando dados: ${supervisores.length} supervisores, ${eventos.length} eventos`);
      
      // Criar um mapa de supervisores para facilitar a busca
      const supervisorMap = new Map<string, User>();
      supervisores.forEach(supervisor => {
        supervisorMap.set(supervisor.id, supervisor);
      });

      // Agrupar eventos por supervisor
      const eventosPorSupervisor = new Map<string, Event[]>();
      
      // Inicializar o mapa com arrays vazios para todos os supervisores
      supervisores.forEach(supervisor => {
        eventosPorSupervisor.set(supervisor.id, []);
      });
      
      // Adicionar eventos aos supervisores correspondentes
      eventos.forEach(evento => {
        if (evento.supervisorId && supervisorMap.has(evento.supervisorId)) {
          const eventosDoSupervisor = eventosPorSupervisor.get(evento.supervisorId) || [];
          eventosPorSupervisor.set(evento.supervisorId, [...eventosDoSupervisor, evento]);
        }
      });
      
      // Processar dados para cada supervisor
      const supervisoresComAgenda: SupervisorAgenda[] = [];
      
      supervisores.forEach(supervisor => {
        const eventosDoSupervisor = eventosPorSupervisor.get(supervisor.id) || [];
        
        // Contar eventos por período
        const eventosHoje = eventosDoSupervisor.filter(e => isToday(new Date(e.dataInicio)));
        const eventosSemana = eventosDoSupervisor.filter(e => isThisWeek(new Date(e.dataInicio)));
        const eventosMes = eventosDoSupervisor.filter(e => isThisMonth(new Date(e.dataInicio)));
        
        // Encontrar a próxima visita (apenas eventos futuros)
        const eventosFuturos = eventosDoSupervisor
          .filter(e => isFuture(new Date(e.dataInicio)))
          .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
        
        const proximaVisita = eventosFuturos.length > 0 ? eventosFuturos[0] : null;
        
        // Adicionar à lista de supervisores com suas agendas
        supervisoresComAgenda.push({
          id: supervisor.id,
          nome: supervisor.name,
          cargo: supervisor.role || "supervisor",
          totalAgendamentos: eventosDoSupervisor.length,
          agendamentosHoje: eventosHoje.length,
          agendamentosSemana: eventosSemana.length,
          agendamentosMes: eventosMes.length,
          proximaVisita
        });
      });
      
      // Ordenar supervisores: primeiro os que não têm agendamento, depois por quantidade (crescente)
      supervisoresComAgenda.sort((a, b) => {
        if (a.totalAgendamentos === 0 && b.totalAgendamentos === 0) return 0;
        if (a.totalAgendamentos === 0) return -1;
        if (b.totalAgendamentos === 0) return 1;
        return a.totalAgendamentos - b.totalAgendamentos;
      });
      
      // Calcular estatísticas
      const totalAgendamentos = eventos.length;
      const agendamentosHoje = eventos.filter(e => isToday(new Date(e.dataInicio))).length;
      const agendamentosSemana = eventos.filter(e => isThisWeek(new Date(e.dataInicio))).length;
      const supervisoresSemAgendamento = supervisoresComAgenda.filter(s => s.totalAgendamentos === 0).length;
      const supervisoresComAgendamentoHoje = supervisoresComAgenda.filter(s => s.agendamentosHoje > 0).length;
      
      console.log(`Estatísticas calculadas: Total=${totalAgendamentos}, Hoje=${agendamentosHoje}, Semana=${agendamentosSemana}`);
      
      setSupervisoresAgenda(supervisoresComAgenda);
      setEstatisticas({
        totalAgendamentos,
        agendamentosHoje,
        agendamentosSemana,
        supervisoresSemAgendamento,
        supervisoresComAgendamentoHoje
      });
    } catch (error) {
      console.error("Erro ao processar dados:", error);
      // Em caso de erro, definir valores padrão
      setSupervisoresAgenda([]);
      setEstatisticas({
        totalAgendamentos: 0,
        agendamentosHoje: 0,
        agendamentosSemana: 0,
        supervisoresSemAgendamento: 0,
        supervisoresComAgendamentoHoje: 0
      });
    }
  };
  
  const navegarPara = (caminho: string) => {
    navigate(caminho);
  };
  
  const formatarData = (dataISO: string | Date) => {
    if (!dataISO) return "Data indisponível";
    return format(new Date(dataISO), "dd/MM/yyyy", {locale: ptBR});
  };
  
  const formatarHora = (dataISO: string | Date) => {
    if (!dataISO) return "--:--";
    return format(new Date(dataISO), "HH:mm", {locale: ptBR});
  };
  
  const formatarPeriodo = (dataInicioISO: string | Date, dataFimISO: string | Date) => {
    if (!dataInicioISO || !dataFimISO) return "Período indisponível";
    
    const inicio = new Date(dataInicioISO);
    const fim = new Date(dataFimISO);
    
    const dataFormatada = format(inicio, "dd/MM/yyyy", {locale: ptBR});
    const horaInicio = format(inicio, "HH:mm", {locale: ptBR});
    const horaFim = format(fim, "HH:mm", {locale: ptBR});
    
    return `${dataFormatada} ${horaInicio}-${horaFim}`;
  };
  
  const isLoading = isLoadingSupervisors || isLoadingEvents;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-blue-600">Carregando agenda da equipe...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Novo componente de estatísticas da agenda */}
      <AgendaStats />
      
      {/* Resumo de Supervisores */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Supervisores</h2>
        
        {isErrorEvents ? (
          <div className="p-6 border-2 border-red-100 bg-red-50 rounded-lg">
            <div className="flex items-center text-red-600 mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Erro ao carregar dados de supervisores</h3>
            </div>
            <p className="text-sm text-gray-600">
              Não foi possível carregar os dados de agendamentos dos supervisores. Verifique sua conexão com a internet ou tente novamente mais tarde.
            </p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : supervisoresAgenda.length === 0 ? (
          <div className="p-6 border-2 border-amber-100 bg-amber-50 rounded-lg">
            <div className="flex items-center text-amber-600 mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Nenhum supervisor encontrado</h3>
            </div>
            <p className="text-sm text-gray-600">
              Não foram encontrados supervisores em sua equipe ou não há dados de agendamentos disponíveis.
            </p>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar dados
              </Button>
              <Button 
                variant="default"
                onClick={() => navegarPara('/agenda')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ir para agenda
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supervisoresAgenda.map(supervisor => (
              <Card 
                key={supervisor.id} 
                className={`bg-white hover:shadow-md transition-shadow ${
                  supervisor.totalAgendamentos === 0 ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      supervisor.totalAgendamentos === 0 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{supervisor.nome}</h3>
                      <p className="text-xs text-gray-500 capitalize">{supervisor.cargo}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-bold text-gray-800">{supervisor.totalAgendamentos}</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-md">
                        <p className="text-xs text-gray-500">Hoje</p>
                        <p className="font-bold text-green-700">{supervisor.agendamentosHoje}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-md">
                        <p className="text-xs text-gray-500">Semana</p>
                        <p className="font-bold text-blue-700">{supervisor.agendamentosSemana}</p>
                      </div>
                    </div>
                    
                    {supervisor.proximaVisita ? (
                      <div className="border rounded-md p-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 mb-1">Próxima Visita:</p>
                        <p className="text-sm font-medium truncate">{supervisor.proximaVisita.titulo}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            <CalendarDays className="h-3 w-3 inline-block mr-1" />
                            {formatarPeriodo(
                              supervisor.proximaVisita.dataInicio,
                              supervisor.proximaVisita.dataFim
                            )}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => navegarPara(`/agenda?evento=${supervisor.proximaVisita!.id}`)}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-md p-3 bg-gray-50 text-center">
                        <p className="text-sm text-gray-500">Sem visitas agendadas</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="mt-1 h-7 px-2 text-xs text-blue-600"
                          onClick={() => navegarPara(`/agenda?supervisor=${supervisor.id}`)}
                        >
                          Agendar Visita
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardGerencial; 