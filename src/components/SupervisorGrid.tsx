import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Event } from "@/services/api";
import { isPast, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import {
  User as UserIcon,
  Users,
  FileText,
  CalendarDays,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SupervisorGridProps {
  supervisores: User[];
  eventos: Record<string, Event[]>;
  onViewAgenda: (id: string) => void;
  onViewRelatorio: (id: string) => void;
}

const SupervisorGrid: React.FC<SupervisorGridProps> = ({ 
  supervisores, 
  eventos, 
  onViewAgenda, 
  onViewRelatorio 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  if (supervisores.length === 0) {
    return (
      <div className="text-center py-3 text-gray-500">
        Nenhum supervisor encontrado nesta equipe.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <div className="bg-gray-100 p-1 rounded-md inline-flex">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className="h-8"
          >
            <Users className="h-4 w-4" />
            <span className="ml-1">Grid</span>
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('table')}
            className="h-8"
          >
            <FileText className="h-4 w-4" />
            <span className="ml-1">Tabela</span>
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supervisores.map(supervisor => {
            const supervisorEventos = eventos[supervisor.id] || [];
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            // Cálculos para diferentes períodos
            const eventosHoje = supervisorEventos.filter(e => {
              const dataEvento = new Date(e.dataInicio);
              dataEvento.setHours(0, 0, 0, 0);
              return dataEvento.getTime() === hoje.getTime();
            });

            const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
            const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
            const eventosSemana = supervisorEventos.filter(e => {
              const dataEvento = new Date(e.dataInicio);
              return dataEvento >= inicioSemana && dataEvento <= fimSemana;
            });

            const inicioMes = startOfMonth(hoje);
            const fimMes = endOfMonth(hoje);
            const eventosMes = supervisorEventos.filter(e => {
              const dataEvento = new Date(e.dataInicio);
              return dataEvento >= inicioMes && dataEvento <= fimMes;
            });

            const eventosPendentes = supervisorEventos.filter(e => {
              const dataFim = new Date(e.dataFim);
              return isPast(dataFim) && (!e.tratativa || e.tratativa.trim() === '');
            });

            const eventosConcluidos = supervisorEventos.filter(e => {
              const dataFim = new Date(e.dataFim);
              return isPast(dataFim) && e.tratativa && e.tratativa.trim() !== '';
            });

            // Calcular porcentagens para o progresso
            const totalEventosPeriodo = eventosConcluidos.length + eventosPendentes.length;
            const porcentagemConcluidos = totalEventosPeriodo > 0 
              ? (eventosConcluidos.length / totalEventosPeriodo) * 100 
              : 0;

            return (
              <div key={supervisor.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4">
                  {/* Cabeçalho com informações do supervisor */}
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                      <UserIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{supervisor.name}</h3>
                      <p className="text-xs text-gray-500">{supervisor.email}</p>
                    </div>
                  </div>

                  {/* Estatísticas principais */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Hoje</span>
                        <Calendar className="h-3 w-3 text-blue-600" />
                      </div>
                      <p className="text-lg font-bold text-blue-700">{eventosHoje.length}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Esta Semana</span>
                        <Clock className="h-3 w-3 text-amber-600" />
                      </div>
                      <p className="text-lg font-bold text-amber-700">{eventosSemana.length}</p>
                    </div>
                  </div>

                  {/* Barra de progresso e status */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span className="text-xs">Concluídos: {eventosConcluidos.length}</span>
                      </div>
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span className="text-xs">Pendentes: {eventosPendentes.length}</span>
                      </div>
                    </div>
                    <Progress value={porcentagemConcluidos} className="h-2" />
                    <div className="text-center">
                      <span className="text-xs text-gray-500">
                        {eventosMes.length} eventos este mês
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewAgenda(supervisor.id)}
                      className="flex-1"
                    >
                      <CalendarDays className="h-3 w-3 mr-1" />
                      Agenda
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewRelatorio(supervisor.id)}
                      className="flex-1"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Relatório
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoje
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semana
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mês
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concluídos
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendentes
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supervisores.map(supervisor => {
                const supervisorEventos = eventos[supervisor.id] || [];
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                const stats = (() => {
                  // Eventos de hoje
                  const eventosHoje = supervisorEventos.filter(e => {
                    const dataEvento = new Date(e.dataInicio);
                    dataEvento.setHours(0, 0, 0, 0);
                    return dataEvento.getTime() === hoje.getTime();
                  });

                  // Eventos da semana
                  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
                  const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
                  const eventosSemana = supervisorEventos.filter(e => {
                    const dataEvento = new Date(e.dataInicio);
                    return dataEvento >= inicioSemana && dataEvento <= fimSemana;
                  });

                  // Eventos do mês
                  const inicioMes = startOfMonth(hoje);
                  const fimMes = endOfMonth(hoje);
                  const eventosMes = supervisorEventos.filter(e => {
                    const dataEvento = new Date(e.dataInicio);
                    return dataEvento >= inicioMes && dataEvento <= fimMes;
                  });

                  // Eventos concluídos e pendentes
                  const eventosConcluidos = supervisorEventos.filter(e => {
                    const dataFim = new Date(e.dataFim);
                    return isPast(dataFim) && e.tratativa && e.tratativa.trim() !== '';
                  });

                  const eventosPendentes = supervisorEventos.filter(e => {
                    const dataFim = new Date(e.dataFim);
                    return isPast(dataFim) && (!e.tratativa || e.tratativa.trim() === '');
                  });

                  return {
                    hoje: eventosHoje.length,
                    semana: eventosSemana.length,
                    mes: eventosMes.length,
                    concluidos: eventosConcluidos.length,
                    pendentes: eventosPendentes.length
                  };
                })();

                return (
                  <tr key={supervisor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                          <UserIcon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{supervisor.name}</div>
                          <div className="text-xs text-gray-500">{supervisor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Badge variant={stats.hoje > 0 ? "default" : "outline"} className={stats.hoje > 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}>
                        {stats.hoje}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Badge variant={stats.semana > 0 ? "default" : "outline"} className={stats.semana > 0 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}>
                        {stats.semana}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Badge variant={stats.mes > 0 ? "default" : "outline"} className={stats.mes > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {stats.mes}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Badge variant={stats.concluidos > 0 ? "default" : "outline"} className={stats.concluidos > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {stats.concluidos}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Badge variant={stats.pendentes > 0 ? "default" : "outline"} className={stats.pendentes > 0 ? "bg-red-100 text-red-800 hover:bg-red-100" : ""}>
                        {stats.pendentes}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onViewAgenda(supervisor.id)}
                          className="h-8 w-8 p-0"
                          title="Ver Agenda"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onViewRelatorio(supervisor.id)}
                          className="h-8 w-8 p-0"
                          title="Ver Relatório"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SupervisorGrid; 