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
  RefreshCw,
  Plus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { eventApi, Event, userApi, User } from "@/services/api";
import { format, isToday, isPast, isFuture, addDays, isWithinInterval, startOfWeek, endOfWeek, subDays } from "date-fns";
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
        
        // Buscar eventos de toda a equipe
        const events = await eventApi.getTeamEvents(startDate, endDate);
        
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
      // Log inicial para debug
      console.log('Dados recebidos:', {
        totalSupervisores: supervisores.length,
        supervisores: supervisores.map(s => ({ id: s.id, nome: s.name })),
        totalEventos: eventos.length,
        eventos: eventos.map(e => ({ 
          id: e.id, 
          titulo: e.titulo, 
          supervisorId: e.supervisorId,
          dataInicio: e.dataInicio
        }))
      });

      // Criar um mapa de supervisores para facilitar a busca
      const supervisorMap = new Map<string, User>();
      supervisores.forEach(supervisor => {
        supervisorMap.set(supervisor.id, supervisor);
      });

      // Criar um Set para rastrear eventos já processados
      const eventosProcessados = new Set<string>();

      // Agrupar eventos por supervisor
      const eventosPorSupervisor = new Map<string, Event[]>();
      
      // Inicializar o mapa com arrays vazios para todos os supervisores
      supervisores.forEach(supervisor => {
        eventosPorSupervisor.set(supervisor.id, []);
      });
      
      // Adicionar eventos aos supervisores correspondentes
      eventos.forEach(evento => {
        // Verificar se o evento já foi processado
        if (eventosProcessados.has(evento.id)) {
          console.warn(`Evento ${evento.id} já foi processado anteriormente. Ignorando duplicata.`);
          return;
        }

        const supervisorId = evento.supervisorId;
        const supervisorNoMapa = supervisorMap.has(supervisorId);

        console.log('Processando evento:', {
          id: evento.id,
          titulo: evento.titulo,
          supervisorId: supervisorId,
          supervisorNoMapa
        });

        if (supervisorNoMapa) {
          const eventosDoSupervisor = eventosPorSupervisor.get(supervisorId) || [];
          eventosDoSupervisor.push(evento);
          eventosPorSupervisor.set(supervisorId, eventosDoSupervisor);
          eventosProcessados.add(evento.id);
        }
      });

      // Log dos eventos agrupados
      console.log('Eventos agrupados por supervisor:');
      supervisores.forEach(supervisor => {
        const eventos = eventosPorSupervisor.get(supervisor.id) || [];
        console.log(`- ${supervisor.name} (${supervisor.id}): ${eventos.length} eventos`);
      });

      // Processar estatísticas para cada supervisor
      const supervisoresComAgenda = supervisores.map(supervisor => {
        const eventos = eventosPorSupervisor.get(supervisor.id) || [];
        
        console.log(`Processando supervisor ${supervisor.name}:`, {
          totalEventos: eventos.length,
          eventos
        });

        const hoje = new Date();
        const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
        const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

        const eventosHoje = eventos.filter(evento => 
          isToday(new Date(evento.dataInicio))
        ).length;

        const eventosSemana = eventos.filter(evento => {
          const dataEvento = new Date(evento.dataInicio);
          return isWithinInterval(dataEvento, { start: inicioSemana, end: fimSemana });
        }).length;

        const proximosEventos = eventos.filter(evento => 
          isFuture(new Date(evento.dataInicio))
        ).length;

        const dadosProcessados = {
          eventosHoje,
          eventosSemana,
          proximosEventos
        };

        console.log(`Dados processados do supervisor ${supervisor.name}:`, dadosProcessados);

        return {
          supervisor: supervisor.name,
          total: eventos.length,
          hoje: eventosHoje,
          semana: eventosSemana
        };
      });

      // Calcular estatísticas gerais
      const totalAgendamentos = Array.from(eventosProcessados).length;
      const agendamentosHoje = supervisoresComAgenda.reduce((total, sup) => total + sup.hoje, 0);
      const agendamentosSemana = supervisoresComAgenda.reduce((total, sup) => total + sup.semana, 0);
      const supervisoresSemAgendamento = supervisoresComAgenda.filter(sup => sup.total === 0).length;
      const supervisoresComAgendamentoHoje = supervisoresComAgenda.filter(sup => sup.hoje > 0).length;

      const estatisticas = {
        totalAgendamentos,
        agendamentosHoje,
        agendamentosSemana,
        supervisoresSemAgendamento,
        supervisoresComAgendamentoHoje,
        supervisoresComAgenda
      };

      console.log('Estatísticas finais:', estatisticas);
      setEstatisticas(estatisticas);

    } catch (error) {
      console.error('Erro ao processar dados:', error);
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
     
    </div>
  );
};

export default DashboardGerencial; 