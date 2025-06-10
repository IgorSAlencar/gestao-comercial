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
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { eventApi, Event, User } from "@/services/api";
import { format, isToday, isPast, isFuture, addDays, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const { user, subordinates, isManager, isCoordinator } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<Event[]>([]);
  const [supervisores, setSupervisores] = useState<SupervisorAgenda[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    agendamentosSemana: 0,
    supervisoresSemAgendamento: 0,
    supervisoresComAgendamentoHoje: 0
  });
  
  useEffect(() => {
    const carregarEventos = async () => {
      try {
        setLoading(true);
        
        // Em um sistema real, você buscaria os eventos de toda a equipe
        // Para fins de simulação, vamos criar dados fictícios baseados nos subordinados
        
        // Simulação: buscar eventos da equipe para os próximos 30 dias
        const hoje = new Date();
        const emTrintaDias = addDays(hoje, 30);
        const dataInicio = format(hoje, 'yyyy-MM-dd');
        const dataFim = format(emTrintaDias, 'yyyy-MM-dd');
        
        // Em produção: const eventosEquipe = await eventApi.getTeamEvents(dataInicio, dataFim);
        // Simulando eventos para cada subordinado
        const eventosSimulados: Event[] = [];
        const supervisoresAgenda: SupervisorAgenda[] = [];
        
        // Usar os subordinados reais se disponíveis, ou simular alguns
        const membrosEquipe = subordinates.length > 0 ? subordinates : [
          { id: "1", name: "Carlos Silva", role: "supervisor" },
          { id: "2", name: "Ana Oliveira", role: "supervisor" },
          { id: "3", name: "Roberto Martins", role: "supervisor" },
          { id: "4", name: "Juliana Costa", role: "supervisor" },
          { id: "5", name: "Pedro Santos", role: "supervisor" }
        ];
        
        // Criar eventos simulados para cada supervisor
        membrosEquipe.forEach(supervisor => {
          // Alguns supervisores terão eventos, outros não
          const temEventos = Math.random() > 0.2; // 80% de chance de ter eventos
          
          let eventosDoSupervisor: Event[] = [];
          
          if (temEventos) {
            // Criar entre 0 e 6 eventos para cada supervisor
            const numEventos = Math.floor(Math.random() * 7);
            
            for (let i = 0; i < numEventos; i++) {
              // Distribuir eventos ao longo dos próximos 14 dias
              const diasAFrente = Math.floor(Math.random() * 14);
              const horaInicio = 8 + Math.floor(Math.random() * 8); // Entre 8h e 16h
              
              const dataInicio = new Date();
              dataInicio.setDate(dataInicio.getDate() + diasAFrente);
              dataInicio.setHours(horaInicio, 0, 0, 0);
              
              const dataFim = new Date(dataInicio);
              dataFim.setHours(dataInicio.getHours() + 1 + Math.floor(Math.random() * 2));
              
              const evento: Event = {
                id: `evento-${supervisor.id}-${i}`,
                titulo: `Visita ${i + 1} - ${["Agência", "Correspondente", "Cliente PJ", "Posto"][Math.floor(Math.random() * 4)]}`,
                descricao: `Visita comercial agendada por ${supervisor.name}`,
                dataInicio: dataInicio.toISOString(),
                dataFim: dataFim.toISOString(),
                location: `${["Centro", "Zona Sul", "Zona Norte", "Zona Leste", "Zona Oeste"][Math.floor(Math.random() * 5)]}`,
                supervisorId: supervisor.id,
                supervisorName: supervisor.name,
                tratativa: isPast(dataFim) ? (Math.random() > 0.5 ? "Visita concluída com sucesso" : "") : "",
                tipo: "visita"
              };
              
              eventosDoSupervisor.push(evento);
              eventosSimulados.push(evento);
            }
          }
          
          // Contar eventos por período
          const eventosHoje = eventosDoSupervisor.filter(e => isToday(new Date(e.dataInicio)));
          const eventosSemana = eventosDoSupervisor.filter(e => isThisWeek(new Date(e.dataInicio)));
          const eventosMes = eventosDoSupervisor.filter(e => isThisMonth(new Date(e.dataInicio)));
          
          // Encontrar a próxima visita
          const eventosFuturos = eventosDoSupervisor
            .filter(e => isFuture(new Date(e.dataInicio)))
            .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
          
          const proximaVisita = eventosFuturos.length > 0 ? eventosFuturos[0] : null;
          
          // Adicionar à lista de supervisores com suas agendas
          supervisoresAgenda.push({
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
        supervisoresAgenda.sort((a, b) => {
          if (a.totalAgendamentos === 0 && b.totalAgendamentos === 0) return 0;
          if (a.totalAgendamentos === 0) return -1;
          if (b.totalAgendamentos === 0) return 1;
          return a.totalAgendamentos - b.totalAgendamentos;
        });
        
        // Calcular estatísticas
        const totalAgendamentos = eventosSimulados.length;
        const agendamentosHoje = eventosSimulados.filter(e => isToday(new Date(e.dataInicio))).length;
        const agendamentosSemana = eventosSimulados.filter(e => isThisWeek(new Date(e.dataInicio))).length;
        const supervisoresSemAgendamento = supervisoresAgenda.filter(s => s.totalAgendamentos === 0).length;
        const supervisoresComAgendamentoHoje = supervisoresAgenda.filter(s => s.agendamentosHoje > 0).length;
        
        setEventos(eventosSimulados);
        setSupervisores(supervisoresAgenda);
        setEstatisticas({
          totalAgendamentos,
          agendamentosHoje,
          agendamentosSemana,
          supervisoresSemAgendamento,
          supervisoresComAgendamentoHoje
        });
      } catch (error) {
        console.error("Erro ao carregar eventos da equipe:", error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarEventos();
  }, [subordinates]);
  
  const navegarPara = (caminho: string) => {
    navigate(caminho);
  };
  
  const formatarData = (dataISO: string) => {
    return format(new Date(dataISO), "dd/MM/yyyy", {locale: ptBR});
  };
  
  const formatarHora = (dataISO: string) => {
    return format(new Date(dataISO), "HH:mm", {locale: ptBR});
  };
  
  const formatarPeriodo = (dataInicioISO: string, dataFimISO: string) => {
    const inicio = new Date(dataInicioISO);
    const fim = new Date(dataFimISO);
    
    const dataFormatada = format(inicio, "dd/MM/yyyy", {locale: ptBR});
    const horaInicio = format(inicio, "HH:mm", {locale: ptBR});
    const horaFim = format(fim, "HH:mm", {locale: ptBR});
    
    return `${dataFormatada} ${horaInicio}-${horaFim}`;
  };
  
  if (loading) {
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
      {/* Resumo geral das agendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-blue-200 shadow hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de Agendamentos</p>
                <h3 className="text-2xl font-bold text-gray-800">{estatisticas.totalAgendamentos}</h3>
                <p className="text-xs text-gray-500 mt-1">Nos próximos 30 dias</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-blue-200 shadow hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Agendamentos Hoje</p>
                <h3 className="text-2xl font-bold text-gray-800">{estatisticas.agendamentosHoje}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {estatisticas.supervisoresComAgendamentoHoje} supervisores com agenda hoje
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-blue-200 shadow hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Semana Atual</p>
                <h3 className="text-2xl font-bold text-gray-800">{estatisticas.agendamentosSemana}</h3>
                <p className="text-xs text-gray-500 mt-1">Agendamentos esta semana</p>
              </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-white border-2 ${estatisticas.supervisoresSemAgendamento > 0 ? 'border-red-200' : 'border-green-200'} shadow hover:shadow-md transition-shadow`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Supervisores sem Agenda</p>
                <h3 className={`text-2xl font-bold ${estatisticas.supervisoresSemAgendamento > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {estatisticas.supervisoresSemAgendamento}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {estatisticas.supervisoresSemAgendamento > 0 
                    ? "Precisam agendar visitas" 
                    : "Todos têm agendamentos"}
                </p>
              </div>
              <div className={`h-10 w-10 ${estatisticas.supervisoresSemAgendamento > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                {estatisticas.supervisoresSemAgendamento > 0 
                  ? <AlertCircle className="h-5 w-5 text-red-600" /> 
                  : <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Agenda da Equipe */}
      <Card className="border-2 border-blue-200 bg-white shadow hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-blue-800">Agenda da Equipe</CardTitle>
              <CardDescription>Status de agendamento de visitas por supervisor</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => navegarPara('/agenda')}
            >
              Ver Agenda Completa <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supervisores.map(supervisor => (
              <div 
                key={supervisor.id} 
                className={`p-4 rounded-lg border-l-4 ${
                  supervisor.totalAgendamentos === 0 
                    ? 'border-l-red-500 bg-red-50' 
                    : supervisor.agendamentosHoje > 0
                      ? 'border-l-green-500 bg-green-50'
                      : 'border-l-blue-500 bg-blue-50'
                } hover:shadow-sm transition-shadow`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div>
                    <div className="font-medium">{supervisor.nome}</div>
                    <p className="text-sm text-gray-600">{supervisor.cargo}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-white shadow-sm rounded-md text-sm">
                      <span className="font-medium">{supervisor.totalAgendamentos}</span> total
                    </div>
                    <div className="px-3 py-1 bg-white shadow-sm rounded-md text-sm">
                      <span className="font-medium">{supervisor.agendamentosHoje}</span> hoje
                    </div>
                    <div className="px-3 py-1 bg-white shadow-sm rounded-md text-sm">
                      <span className="font-medium">{supervisor.agendamentosSemana}</span> esta semana
                    </div>
                  </div>
                </div>
                
                {supervisor.totalAgendamentos === 0 ? (
                  <div className="mt-3 flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Sem agendamentos nos próximos 30 dias
                  </div>
                ) : supervisor.proximaVisita ? (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 font-medium">Próxima visita:</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {formatarPeriodo(supervisor.proximaVisita.dataInicio, supervisor.proximaVisita.dataFim)}
                      </span>
                      <span className="text-sm flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        {supervisor.proximaVisita.location || "Local não definido"}
                      </span>
                      <span className="text-sm font-medium">{supervisor.proximaVisita.titulo}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          
          {supervisores.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum supervisor encontrado na equipe</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Próximos Agendamentos */}
      <Card className="border-2 border-indigo-200 bg-white shadow hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-indigo-800">Próximas Visitas</CardTitle>
              <CardDescription>Visitas agendadas para os próximos dias</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eventos.filter(e => isFuture(new Date(e.dataInicio))).length > 0 ? (
            <div className="space-y-3">
              {eventos
                .filter(e => isFuture(new Date(e.dataInicio)))
                .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
                .slice(0, 5) // Mostrar apenas os próximos 5 eventos
                .map(evento => (
                  <div 
                    key={evento.id} 
                    className="p-3 rounded-md border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => navegarPara(`/agenda?evento=${evento.id}`)}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium">{evento.titulo}</div>
                      <div className="text-sm text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {formatarData(evento.dataInicio)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {formatarHora(evento.dataInicio)} - {formatarHora(evento.dataFim)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {evento.location || "Local não definido"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Responsável: {evento.supervisorName}
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
              <p className="text-gray-500">Não há visitas agendadas para os próximos dias</p>
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
  );
};

export default DashboardGerencial; 