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
  BarChart2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { eventApi, Event, userApi } from "@/services/api";
import { format, isToday, isPast, isFuture, isThisWeek, isThisMonth, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

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
    proximosAgendamentos: []
  });

  const navigate = useNavigate();

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
        // Buscar eventos de um período amplo (últimos 30 dias + próximos 30 dias)
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        
        console.log(`[AgendaStats] Buscando eventos da equipe de ${startDate} até ${endDate}`);
        
        // Buscar eventos de toda a equipe
        const eventos = await eventApi.getTeamEvents(startDate, endDate);
        console.log(`[AgendaStats] Recebidos ${eventos.length} eventos da equipe`);
        return eventos;
      } catch (error) {
        console.error("[AgendaStats] Erro ao buscar eventos para estatísticas:", error);
        return [];
      }
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
    retry: 1,
  });

  // Calcular estatísticas quando os dados estiverem disponíveis
  useEffect(() => {
    if (supervisors.length > 0) {
      try {
        console.log(`[AgendaStats] Processando ${events.length} eventos para ${supervisors.length} supervisores`);
        
        // Mapear os IDs dos supervisores para facilitar a busca
        const supervisorIds = new Set(supervisors.map(s => s.id));
        
        // Filtrar eventos apenas dos supervisores da equipe
        const teamEvents = events.filter(event => 
          supervisorIds.has(event.supervisorId || '')
        );
        
        // Calcular eventos de hoje, da semana, concluídos e pendentes
        const hoje = new Date();
        const eventosHoje = teamEvents.filter(e => isToday(new Date(e.dataInicio)));
        const eventosSemana = teamEvents.filter(e => isThisWeek(new Date(e.dataInicio)));
        const eventosConcluidos = teamEvents.filter(e => 
          isPast(new Date(e.dataFim)) && e.tratativa && e.tratativa.trim() !== ''
        );
        const eventosPendentes = teamEvents.filter(e => 
          isPast(new Date(e.dataFim)) && (!e.tratativa || e.tratativa.trim() === '')
        );
        
        // Obter eventos futuros ordenados por data
        const eventosFuturos = teamEvents
          .filter(e => isFuture(new Date(e.dataInicio)))
          .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
          .slice(0, 5); // Apenas os 5 próximos
        
        // Calcular supervisores com agenda hoje
        const supervisoresComEventoHoje = new Set();
        eventosHoje.forEach(e => {
          if (e.supervisorId) supervisoresComEventoHoje.add(e.supervisorId);
        });
        
        // Identificar supervisores sem agenda no período
        const supervisoresComEvento = new Set();
        teamEvents.forEach(e => {
          if (e.supervisorId) supervisoresComEvento.add(e.supervisorId);
        });
        
        const supervisoresSemEvento = supervisors.filter(
          s => !supervisoresComEvento.has(s.id)
        ).length;
        
        console.log(`[AgendaStats] Estatísticas calculadas: Total=${teamEvents.length}, Hoje=${eventosHoje.length}, Semana=${eventosSemana.length}`);
        
        // Atualizar o resumo
        setSummary({
          totalAgendamentos: teamEvents.length,
          agendamentosHoje: eventosHoje.length,
          agendamentosSemana: eventosSemana.length,
          agendamentosConcluidos: eventosConcluidos.length,
          agendamentosPendentes: eventosPendentes.length,
          totalSupervisores: supervisors.length,
          supervisoresSemAgenda: supervisoresSemEvento,
          supervisoresComAgendaHoje: supervisoresComEventoHoje.size,
          proximosAgendamentos: eventosFuturos
        });
      } catch (error) {
        console.error("[AgendaStats] Erro ao processar dados para estatísticas:", error);
      }
    }
  }, [supervisors, events]);

  // Formatar data e hora
  const formatDateTime = (dataISO: string | Date) => {
    return format(new Date(dataISO), "dd/MM/yyyy HH:mm", {locale: ptBR});
  };

  // Verificar se está carregando
  const isLoading = isLoadingSupervisors || isLoadingEvents;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Estatísticas de Agenda</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
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
                  <div className="flex items-center text-xs mt-1">
                    <span className="text-green-600 font-medium mr-1">{summary.agendamentosConcluidos}</span>
                    <span className="text-gray-500">concluídos</span>
                    <span className="mx-1 text-gray-300">•</span>
                    <span className="text-red-600 font-medium mr-1">{summary.agendamentosPendentes}</span>
                    <span className="text-gray-500">pendentes</span>
                  </div>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
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
                    {summary.supervisoresComAgendaHoje} supervisores com agenda hoje
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
                  <p className="text-sm text-gray-500 mb-1">Semana Atual</p>
                  <h3 className="text-2xl font-bold text-gray-800">{summary.agendamentosSemana}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(startOfWeek(new Date(), {weekStartsOn: 0}), "dd/MM", {locale: ptBR})} - 
                    {format(endOfWeek(new Date(), {weekStartsOn: 0}), "dd/MM", {locale: ptBR})}
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-200 shadow hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Supervisores sem Agenda</p>
                  <h3 className="text-2xl font-bold text-gray-800">{summary.supervisoresSemAgenda}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    de {summary.totalSupervisores} supervisores
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
      
      {/* Próximos Agendamentos */}
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
          <CardDescription>
            Visualize os próximos eventos da sua equipe
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
                  </div>
                  <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                    <Clock className="h-3 w-3 inline-block mr-1" />
                    {formatDateTime(evento.dataInicio)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Não há agendamentos futuros para a equipe
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full border-dashed"
              onClick={() => window.location.href = '/agenda'}
            >
              Ver todos os agendamentos
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Supervisor sem Agenda */}
      {!isLoading && summary.supervisoresSemAgenda > 0 && (
        <Card className="border-2 border-red-100 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              Supervisores sem Agenda
            </CardTitle>
            <CardDescription>
              Os seguintes supervisores não possuem agendamentos nos próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {supervisors
                .filter(supervisor => {
                  // Verificar se o supervisor tem algum evento nos próximos 30 dias
                  return !events.some(event => 
                    event.supervisorId === supervisor.id && 
                    isFuture(new Date(event.dataInicio))
                  );
                })
                .map(supervisor => (
                  <div key={supervisor.id} className="p-3 bg-white rounded-md border border-red-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium">{supervisor.name}</span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => window.location.href = `/agenda?supervisor=${supervisor.id}`}
                    >
                      Agendar
                    </Button>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgendaStats; 