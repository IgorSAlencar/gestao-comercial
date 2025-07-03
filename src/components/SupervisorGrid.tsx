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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
          {supervisores.map((supervisor, index) => {
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
              <div 
                key={supervisor.id} 
                className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-sm transform hover:-translate-y-1"
                style={{
                  animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="p-6">
                  {/* Cabeçalho com informações do supervisor */}
                  <div className="flex items-center mb-6">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mr-4 shadow-inner flex-shrink-0">
                      <UserIcon className="h-7 w-7 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-lg text-gray-900 truncate">{supervisor.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{supervisor.email}</p>
                    </div>
                  </div>

                  {/* Estatísticas principais */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Hoje</span>
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{eventosHoje.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-lg border border-amber-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900">Semana</span>
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{eventosSemana.length}</p>
                    </div>
                  </div>

                  {/* Barra de progresso e status */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">Concluídos: {eventosConcluidos.length}</span>
                      </div>
                      <div className="flex items-center text-red-700 bg-red-50 px-3 py-1 rounded-full">
                        <AlertCircle className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">Pendentes: {eventosPendentes.length}</span>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            Progresso
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {Math.round(porcentagemConcluidos)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                        <div 
                          style={{ width: `${porcentagemConcluidos}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {eventosMes.length} eventos este mês
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => onViewAgenda(supervisor.id)}
                      className="flex-1 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 border-blue-200"
                    >
                      <CalendarDays className="h-4 w-4 mr-2 text-blue-600" />
                      Agenda
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onViewRelatorio(supervisor.id)}
                      className="flex-1 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-gray-200"
                    >
                      <FileText className="h-4 w-4 mr-2 text-gray-600" />
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
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate max-w-[200px]">{supervisor.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{supervisor.email}</div>
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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SupervisorGrid; 