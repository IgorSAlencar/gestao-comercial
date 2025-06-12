import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  RefreshCw, 
  CalendarDays, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Users,
  UserCheck,
  Briefcase
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { eventApi, Event, User } from "@/services/api";
import { format, addDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SupervisorStatsProps {
  id: string;
  eventos: Event[];
}

const SupervisorStats: React.FC<SupervisorStatsProps> = ({ id, eventos }) => {
  // Calculando as estatísticas sem fazer requisições adicionais
  const stats = useMemo(() => {
    // Calcular estatísticas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const eventosHoje = eventos.filter(e => {
      const dataEvento = new Date(e.dataInicio);
      dataEvento.setHours(0, 0, 0, 0);
      return dataEvento.getTime() === hoje.getTime();
    });
    
    const eventosFuturos = eventos.filter(e => {
      const dataEvento = new Date(e.dataInicio);
      return dataEvento > hoje;
    });
    
    const eventosSemTratativa = eventos.filter(e => {
      const dataFim = new Date(e.dataFim);
      return isPast(dataFim) && (!e.tratativa || e.tratativa.trim() === '');
    });
    
    return {
      totalEventos: eventos.length,
      eventosHoje: eventosHoje.length,
      eventosFuturos: eventosFuturos.length,
      eventosSemTratativa: eventosSemTratativa.length
    };
  }, [eventos]);

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div className="p-3 bg-blue-50 rounded-md">
        <p className="text-xs text-gray-500">Eventos Hoje</p>
        <p className="text-lg font-bold">{stats.eventosHoje}</p>
      </div>
      <div className="p-3 bg-green-50 rounded-md">
        <p className="text-xs text-gray-500">Eventos Futuros</p>
        <p className="text-lg font-bold">{stats.eventosFuturos}</p>
      </div>
      <div className="p-3 bg-amber-50 rounded-md">
        <p className="text-xs text-gray-500">Total de Eventos</p>
        <p className="text-lg font-bold">{stats.totalEventos}</p>
      </div>
      <div className="p-3 bg-red-50 rounded-md">
        <p className="text-xs text-gray-500">Sem Tratativa</p>
        <p className="text-lg font-bold">{stats.eventosSemTratativa}</p>
      </div>
    </div>
  );
};

interface TeamMemberCardProps {
  user: User;
  roleColor: string;
  eventos: Event[];
  onClick?: () => void;
  hasSubordinates?: boolean;
  isExpanded?: boolean;
  children?: React.ReactNode;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  user, 
  roleColor, 
  eventos, 
  onClick, 
  hasSubordinates = false,
  isExpanded = false,
  children 
}) => {
  // Determinando as cores de fundo com base no papel
  const getBgColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100';
      case 'gerente': return 'bg-blue-100';
      case 'coordenador': return 'bg-green-100';
      case 'supervisor': return 'bg-amber-100';
      default: return 'bg-gray-100';
    }
  };

  const navigate = useNavigate();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${roleColor} capitalize`}>
              {user.role}
            </Badge>
            {hasSubordinates && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClick} 
                className="h-8 w-8"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
          {/* Mostrar botões de ação apenas para supervisores */}
          {user.role === "supervisor" && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/agenda?supervisor=${user.id}`)}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Agenda
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/relatorios?supervisor=${user.id}`)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Relatório
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className={`h-16 w-16 rounded-full ${getBgColor(user.role)} flex items-center justify-center`}>
            <UserIcon className={`h-8 w-8 ${roleColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{user.name}</h3>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-1" />
                {user.email || "Email não disponível"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sempre mostrar estatísticas para supervisores */}
        {user.role === "supervisor" && (
          <SupervisorStats id={user.id} eventos={eventos} />
        )}
        
        {hasSubordinates && isExpanded && (
          <div className="mt-4 border-t pt-4">
            <div className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Membros da Equipe
            </div>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Novo componente para exibir supervisores em formato de tabela/grid
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
            
            // Cálculos rápidos para o card
            const eventosHoje = supervisorEventos.filter(e => {
              const dataEvento = new Date(e.dataInicio);
              dataEvento.setHours(0, 0, 0, 0);
              return dataEvento.getTime() === hoje.getTime();
            }).length;
            
            const eventosPendentes = supervisorEventos.filter(e => {
              const dataFim = new Date(e.dataFim);
              return isPast(dataFim) && (!e.tratativa || e.tratativa.trim() === '');
            }).length;

            return (
              <div key={supervisor.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                      <UserIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{supervisor.name}</h3>
                      <p className="text-xs text-gray-500">{supervisor.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">Hoje</p>
                      <p className="font-bold">{eventosHoje}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">Pendentes</p>
                      <p className="font-bold">{eventosPendentes}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-2 mt-3">
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
                  Futuros
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
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
                const stats = (() => {
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  
                  const eventosHoje = supervisorEventos.filter(e => {
                    const dataEvento = new Date(e.dataInicio);
                    dataEvento.setHours(0, 0, 0, 0);
                    return dataEvento.getTime() === hoje.getTime();
                  });
                  
                  const eventosFuturos = supervisorEventos.filter(e => {
                    const dataEvento = new Date(e.dataInicio);
                    return dataEvento > hoje;
                  });
                  
                  const eventosSemTratativa = supervisorEventos.filter(e => {
                    const dataFim = new Date(e.dataFim);
                    return isPast(dataFim) && (!e.tratativa || e.tratativa.trim() === '');
                  });
                  
                  return {
                    hoje: eventosHoje.length,
                    futuros: eventosFuturos.length,
                    total: supervisorEventos.length,
                    pendentes: eventosSemTratativa.length
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
                      <Badge variant={stats.futuros > 0 ? "default" : "outline"} className={stats.futuros > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {stats.futuros}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <Badge variant={stats.total > 0 ? "default" : "outline"} className={stats.total > 0 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}>
                        {stats.total}
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

const Equipe: React.FC = () => {
  const { 
    user, 
    subordinates, 
    loadingSubordinates, 
    refreshSubordinates, 
    allUsers,
    loadingAllUsers,
    refreshAllUsers,
    getUserSubordinates,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados para controle de loading e dados
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [allEventos, setAllEventos] = useState<Event[]>([]);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Estados para controle da hierarquia
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [secondLevelUsers, setSecondLevelUsers] = useState<User[]>([]);
  const [isLoadingSecondLevel, setIsLoadingSecondLevel] = useState(false);
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});
  const [subordinatesMap, setSubordinatesMap] = useState<Record<string, User[]>>({});
  const [isLoadingSubordinatesMap, setIsLoadingSubordinatesMap] = useState<Record<string, boolean>>({});
  
  // Ref para controlar o debounce dos eventos
  const isEventoJaCarregado = useRef(false);
  
  // Obter parâmetros da URL
  const userIdParam = searchParams.get('userId');
  
  // Primeiro efeito: carregar dados principais (usuários)
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingInitial(true);
      
      // Para admin, carregar todos os usuários
      if (isAdmin) {
        await refreshAllUsers();
      } else {
        // Para outros, carregar subordinados normalmente
        await refreshSubordinates();
      }
    };
    
    loadUsers();
  }, [isAdmin, refreshAllUsers, refreshSubordinates]);
  
  // Segundo efeito: configurar usuário ativo e carregar segundo nível
  useEffect(() => {
    // Somente execute quando os dados de usuários estiverem prontos
    if (loadingSubordinates || loadingAllUsers) return;
    
    const setupActiveUser = async () => {
      // Verificar se há um userId na URL (para admins)
      if (userIdParam && isAdmin && allUsers.length > 0) {
        const targetUser = allUsers.find(u => u.id === userIdParam);
        if (targetUser) {
          setActiveUser(targetUser);
          await loadSecondLevel(targetUser.id);
        }
      } else if (user) {
        // Usuário atual como ativo para não-admin
        setActiveUser(user);
        
        // Para gerentes e coordenadores, carregar seus subordinados diretos como segundo nível
        if (user.role === "gerente" || user.role === "coordenador") {
          await loadSecondLevel(user.id);
        }
      }
      
      setIsLoadingInitial(false);
    };
    
    setupActiveUser();
  }, [userIdParam, isAdmin, user, loadingSubordinates, loadingAllUsers, allUsers.length]);

  // Função para carregar o segundo nível (coordenadores para gerentes, supervisores para coordenadores)
  const loadSecondLevel = async (userId: string) => {
    setIsLoadingSecondLevel(true);
    try {
      const secondLevel = await getUserSubordinates(userId);
      
      // Se o usuário ativo for um gerente, garantir que só mostramos coordenadores no segundo nível
      if (activeUser?.role === "gerente") {
        const filteredSecondLevel = secondLevel.filter(user => user.role === "coordenador");
        console.log(`Filtrando segundo nível para gerente: ${filteredSecondLevel.length} coordenadores de ${secondLevel.length} usuários totais`);
        setSecondLevelUsers(filteredSecondLevel);
      } else {
        // Para coordenadores, mostrar apenas supervisores
        const filteredSecondLevel = secondLevel.filter(user => user.role === "supervisor");
        console.log(`Filtrando segundo nível para coordenador: ${filteredSecondLevel.length} supervisores de ${secondLevel.length} usuários totais`);
        setSecondLevelUsers(filteredSecondLevel);
      }
    } catch (error) {
      console.error("Erro ao carregar segundo nível:", error);
      setSecondLevelUsers([]);
    } finally {
      setIsLoadingSecondLevel(false);
    }
  };

  // Função para expandir/colapsar um usuário
  const toggleUserExpanded = async (userId: string) => {
    // Se já estiver expandido, apenas colapsa
    if (expandedUserIds[userId]) {
      setExpandedUserIds(prev => ({
        ...prev,
        [userId]: false
      }));
      return;
    }
    
    // Se ainda não tiver os subordinados deste usuário, carrega-os
    if (!subordinatesMap[userId]) {
      setIsLoadingSubordinatesMap(prev => ({
        ...prev,
        [userId]: true
      }));
      
      try {
        // Aqui buscamos os supervisores que são subordinados diretamente deste coordenador
        const userSubordinates = await getUserSubordinates(userId);
        // Filtrar apenas supervisores caso o usuário seja um coordenador
        const filteredSubordinates = userSubordinates.filter(sub => sub.role === "supervisor");
        
        setSubordinatesMap(prev => ({
          ...prev,
          [userId]: filteredSubordinates
        }));
      } catch (error) {
        console.error(`Erro ao carregar subordinados do usuário ${userId}:`, error);
      } finally {
        setIsLoadingSubordinatesMap(prev => ({
          ...prev,
          [userId]: false
        }));
      }
    }
    
    // Expande o usuário
    setExpandedUserIds(prev => ({
      ...prev,
      [userId]: true
    }));
  };

  // Função para carregar todos os eventos de uma vez
  const carregarTodosEventos = useCallback(async (forceReload = false) => {
    // Evitar múltiplas chamadas
    if (isLoadingEventos) return;
    
    // Se os eventos já foram carregados e não estamos forçando recarga, pule
    if (isEventoJaCarregado.current && !forceReload) {
      return;
    }
    
    setIsLoadingEventos(true);
    try {
      // Buscar eventos dos últimos 30 dias e próximos 30 dias
      const dataInicio = format(addDays(new Date(), -30), 'yyyy-MM-dd');
      const dataFim = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      
      // Uma única requisição para todos os eventos
      const eventos = await eventApi.getEvents(dataInicio, dataFim);
      setAllEventos(eventos);
      setLastRefresh(new Date());
      
      // Marcar que os eventos já foram carregados
      isEventoJaCarregado.current = true;
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setIsLoadingEventos(false);
    }
  }, [isLoadingEventos]);

  // Carregar eventos quando a tela inicializar
  useEffect(() => {
    if (!isLoadingInitial && activeUser && !isEventoJaCarregado.current) {
      carregarTodosEventos();
    }
  }, [isLoadingInitial, activeUser, carregarTodosEventos]);
  
  // Quando clicar no botão de atualizar, forçar a recarga
  const handleRefresh = () => {
    carregarTodosEventos(true);
  };

  // Organizar eventos por usuário
  const eventosPorUsuario = useMemo(() => {
    const eventosMap: Record<string, Event[]> = {};
    
    // Preencher eventos para cada usuário
    allEventos.forEach(evento => {
      if (evento.supervisorId) {
        if (!eventosMap[evento.supervisorId]) {
          eventosMap[evento.supervisorId] = [];
        }
        eventosMap[evento.supervisorId].push(evento);
      }
    });
    
    return eventosMap;
  }, [allEventos]);

  // Função para navegar para a agenda
  const navigateToAgenda = (supervisorId: string) => {
    // Obter o nome do supervisor para passar como parâmetro de filtro
    const supervisor = allUsers.find(u => u.id === supervisorId) || 
                      subordinates.find(u => u.id === supervisorId) || 
                      secondLevelUsers.find(u => u.id === supervisorId) ||
                      Object.values(subordinatesMap).flat().find(u => u.id === supervisorId);
    
    if (supervisor) {
      // Navegar para a agenda com o supervisor selecionado e preenchendo o termo de busca
      navigate(`/agenda?supervisor=${supervisorId}&filter=${encodeURIComponent(supervisor.name.toLowerCase())}`);
    } else {
      // Caso não encontre o supervisor (improvável), navega apenas com o ID
      navigate(`/agenda?supervisor=${supervisorId}`);
    }
  };

  // Função para navegar para o relatório
  const navigateToRelatorio = (supervisorId: string) => {
    navigate(`/relatorios?supervisor=${supervisorId}`);
  };

  // Verificar permissão para acessar esta página
  if (!user || (user.role !== "gerente" && user.role !== "coordenador" && user.role !== "admin")) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-xl font-bold mb-2">Acesso Não Autorizado</h1>
        <p className="text-gray-500 mb-4">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => navigate("/")}>Voltar para Home</Button>
      </div>
    );
  }

  // Exibir um loader enquanto carregamos os dados iniciais
  const isLoading = isLoadingInitial || loadingSubordinates || loadingAllUsers;

  // Função para obter a cor baseada no papel do usuário
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600';
      case 'gerente': return 'text-blue-600';
      case 'coordenador': return 'text-green-600';
      case 'supervisor': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  // Renderizar componente principal
  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? "Equipe Comercial" : "Minha Equipe"}</h1>
          <p className="text-gray-500">
            {isAdmin 
              ? "Visualize a estrutura hierárquica completa da equipe comercial" 
              : "Visualize a estrutura hierárquica da sua equipe"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <div className="text-sm text-gray-500 mr-2 flex items-center">
              <Calendar className="inline-block mr-1 h-4 w-4" />
              {format(lastRefresh, "dd/MM/yyyy HH:mm", {locale: ptBR})}
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoadingEventos}
            className="flex items-center gap-2"
          >
            {isLoadingEventos ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar Dados</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-md"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Admin seletor de gerentes */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Selecione um Gerente</CardTitle>
                <CardDescription>
                  Escolha um gerente para visualizar sua estrutura hierárquica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {allUsers.length === 0 && !loadingAllUsers ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>Nenhum gerente disponível no sistema.</p>
                        <Button 
                          variant="outline" 
                          onClick={refreshAllUsers} 
                          className="mt-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Tentar novamente
                        </Button>
                      </div>
                    ) : loadingAllUsers ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
                        ))}
                      </div>
                    ) : (
                      allUsers
                        .filter(u => u.role === "gerente")
                        .map(gerente => (
                          <div 
                            key={gerente.id}
                            className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              activeUser?.id === gerente.id ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={async () => {
                              setActiveUser(gerente);
                              await loadSecondLevel(gerente.id);
                              setSearchParams({ userId: gerente.id });
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <span>{gerente.name}</span>
                            </div>
                            {activeUser?.id === gerente.id && (
                              <Badge variant="outline" className="bg-blue-100">
                                Selecionado
                              </Badge>
                            )}
                          </div>
                        ))
                    )}
                    
                    {allUsers.length > 0 && allUsers.filter(u => u.role === "gerente").length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p>Não há gerentes cadastrados no sistema.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Usuário atual ou selecionado */}
          {activeUser && (
            <TeamMemberCard 
              user={activeUser}
              roleColor={getRoleColor(activeUser.role)}
              eventos={eventosPorUsuario[activeUser.id] || []}
              hasSubordinates={false}
            />
          )}

          {/* Segundo nível hierárquico */}
          {isLoadingSecondLevel ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-md"></div>
              ))}
            </div>
          ) : secondLevelUsers.length > 0 ? (
            <div className="space-y-6">
              {/* Título da seção */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {activeUser?.role === "gerente" ? (
                    <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <UserCheck className="h-5 w-5 mr-2 text-amber-600" />
                  )}
                  <h2 className="text-lg font-medium">
                    {activeUser?.role === "gerente" ? "Coordenadores" : "Supervisores"}
                    <Badge variant="outline" className="ml-2">
                      {secondLevelUsers.length}
                    </Badge>
                  </h2>
                </div>
                
                {/* Se for admin visualizando um coordenador, mostrar botão para voltar ao gerente */}
                {isAdmin && activeUser?.role === "coordenador" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      // Encontrar o gerente (filtrando por papel e procurando nos allUsers)
                      const gerentes = allUsers.filter(u => u.role === "gerente");
                      
                      // Para cada gerente, ver se tem o coordenador atual como subordinado
                      for (const gerente of gerentes) {
                        const subordinadosGerente = await getUserSubordinates(gerente.id);
                        if (subordinadosGerente.some(sub => sub.id === activeUser.id)) {
                          // Encontramos o gerente deste coordenador
                          setActiveUser(gerente);
                          await loadSecondLevel(gerente.id);
                          setSearchParams({ userId: gerente.id });
                          break;
                        }
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span>Voltar para Gerente</span>
                  </Button>
                )}
              </div>
              
              {/* Lista de membros do segundo nível */}
              <div className="space-y-4">
                {/* Se for gerente, mostrar coordenadores com expansão para supervisores */}
                {activeUser?.role === "gerente" && (
                  secondLevelUsers.filter(user => user.role === "coordenador").map(coordenador => (
                    <TeamMemberCard
                      key={coordenador.id}
                      user={coordenador}
                      roleColor={getRoleColor(coordenador.role)}
                      eventos={eventosPorUsuario[coordenador.id] || []}
                      hasSubordinates={true}
                      isExpanded={expandedUserIds[coordenador.id]}
                      onClick={() => toggleUserExpanded(coordenador.id)}
                    >
                      {/* Supervisores do coordenador (quando expandido) */}
                      {expandedUserIds[coordenador.id] && (
                        isLoadingSubordinatesMap[coordenador.id] ? (
                          <div className="space-y-3 p-2">
                            {[1, 2].map(i => (
                              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                            ))}
                          </div>
                        ) : (
                          <SupervisorGrid 
                            supervisores={subordinatesMap[coordenador.id] || []}
                            eventos={eventosPorUsuario}
                            onViewAgenda={navigateToAgenda}
                            onViewRelatorio={navigateToRelatorio}
                                  />
                        )
                      )}
                    </TeamMemberCard>
                  ))
                )}
                
                {/* Se for coordenador, mostrar supervisores diretamente com o novo formato */}
                {activeUser?.role === "coordenador" && (
                  <SupervisorGrid 
                    supervisores={secondLevelUsers}
                    eventos={eventosPorUsuario}
                    onViewAgenda={navigateToAgenda}
                    onViewRelatorio={navigateToRelatorio}
                    />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum {activeUser?.role === "gerente" ? "coordenador" : "supervisor"} encontrado na equipe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Equipe; 