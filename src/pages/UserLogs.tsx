import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api.config";
import { ChevronLeft, ChevronRight, User, Clock, Activity } from "lucide-react";

interface UserLog {
  id: string;
  userId: string;
  timestamp: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  status: string;
  userName: string;
  userFuncional: string;
  userRole: string;
  coordinatorName?: string;
  coordinatorFuncional?: string;
  managerName?: string;
  managerFuncional?: string;
}

const ITEMS_PER_PAGE = 10;

const UserLogs: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [coordinators, setCoordinators] = useState<{id: string, name: string}[]>([]);
  const [managers, setManagers] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [allUsers, setAllUsers] = useState<{id: string, name: string, managerName?: string, coordinatorName?: string}[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState({
    userId: "",
    startDate: "",
    endDate: "",
    actionType: "",
    status: "",
    coordinatorId: "",
    managerId: "",
  });

  // Verificar permissão e redirecionar se não autorizado
  useEffect(() => {
    if (!isAdmin && !isManager) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
  }, [isAdmin, isManager, navigate, toast]);

  // Se não tiver permissão, não renderiza o conteúdo
  if (!isAdmin && !isManager) {
    return null;
  }

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...filters,
      });

      const response = await fetch(
        `${API_CONFIG.apiUrl}/user-logs?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar logs");
      }

      const data = await response.json();
      
      // Garantir que todos os logs tenham as propriedades necessárias
      const logsProcessados = (data.logs || []).map((log: UserLog) => ({
        ...log,
        status: log.status?.toUpperCase() || "UNKNOWN",
        actionType: log.actionType?.toUpperCase() || "UNKNOWN",
        userName: log.userName || "Usuário Desconhecido",
        userFuncional: log.userFuncional || "N/A",
        timestamp: log.timestamp || new Date().toISOString(),
      }));

      setLogs(logsProcessados);
      setTotalRecords(data.total || 0);
      setTotalPages(data.totalPages || 1);
      
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinatorsAndManagers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Buscar todos os usuários
      const usersResponse = await fetch(`${API_CONFIG.apiUrl}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (usersResponse.ok) {
        const allUsers = await usersResponse.json();
        
        const coordinatorsList = allUsers
          .filter((u: any) => u.role === 'coordenador')
          .map((u: any) => ({ id: u.id, name: u.name }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
          
        const managersList = allUsers
          .filter((u: any) => u.role === 'gerente')
          .map((u: any) => ({ id: u.id, name: u.name }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
          
        const usersList = allUsers
          .map((u: any) => ({ id: u.id, name: u.name }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setCoordinators(coordinatorsList);
        setManagers(managersList);
        setUsers(usersList);
        setFilteredUsers(usersList); // Inicialmente todos os usuários
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadores, gerentes e usuários:", error);
    }
  };

  const fetchUsersWithHierarchy = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Buscar uma amostra grande de logs para mapear usuários e hierarquia
      const response = await fetch(`${API_CONFIG.apiUrl}/user-logs?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const logsWithHierarchy = data.logs || [];
        
        // Extrair usuários únicos com suas relações hierárquicas
        const usersMap = new Map();
        logsWithHierarchy.forEach((log: any) => {
          if (!usersMap.has(log.userId)) {
            usersMap.set(log.userId, {
              id: log.userId,
              name: log.userName,
              managerName: log.managerName,
              coordinatorName: log.coordinatorName
            });
          }
        });
        
        const usersWithHierarchy = Array.from(usersMap.values())
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setAllUsers(usersWithHierarchy);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários com hierarquia:", error);
    }
  };

  const updateFilteredUsers = () => {
    let filtered = [...allUsers];
    
    // Filtrar por gerente selecionado
    if (filters.managerId) {
      const selectedManager = managers.find(m => m.id === filters.managerId);
      if (selectedManager) {
        filtered = filtered.filter(user => user.managerName === selectedManager.name);
      }
    }
    
    // Filtrar por coordenador selecionado
    if (filters.coordinatorId) {
      const selectedCoordinator = coordinators.find(c => c.id === filters.coordinatorId);
      if (selectedCoordinator) {
        filtered = filtered.filter(user => user.coordinatorName === selectedCoordinator.name);
      }
    }
    
    setFilteredUsers(filtered.map(u => ({ id: u.id, name: u.name })));
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchCoordinatorsAndManagers();
  }, []);

  useEffect(() => {
    fetchUsersWithHierarchy();
  }, []);

  useEffect(() => {
    updateFilteredUsers();
  }, [filters.managerId, filters.coordinatorId, allUsers, managers, coordinators]);

  const handleFilterChange = (field: string, value: string) => {
    // Se mudou gerente ou coordenador, limpar filtro de usuário
    if (field === 'managerId' || field === 'coordinatorId') {
      setFilters(prev => ({ ...prev, [field]: value, userId: "" }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
    setCurrentPage(1); // Reset para primeira página
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (date: string) => {
    try {
      if (!date) return "Data não disponível";
      
      const parsedDate = new Date(date);
      
      // Verifica se a data é válida
      if (isNaN(parsedDate.getTime())) {
        console.error("Data inválida recebida:", date);
        return "Data inválida";
      }
      
      // Ajustar para horário local brasileiro
      const localDate = new Date(parsedDate.getTime() + (parsedDate.getTimezoneOffset() * 60000));
      
      const formattedDate = format(localDate, 'dd/MM/yyyy', { locale: ptBR });
      const formattedTime = format(localDate, 'HH:mm', { locale: ptBR });
      
      return (
        <div>
          <div className="font-medium text-sm">{formattedDate}</div>
          <div className="text-xs text-gray-500">{formattedTime}</div>
        </div>
      );
      
    } catch (error) {
      console.error("Erro ao formatar data:", error, "Data original:", date);
      return "Erro na data";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-600";
    
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILURE":
        return "bg-red-100 text-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return "Desconhecido";
    
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "Sucesso";
      case "FAILURE":
        return "Falha";
      case "WARNING":
        return "Alerta";
      default:
        return status;
    }
  };

  const getActionTypeLabel = (actionType: string | undefined) => {
    if (!actionType) return "Ação Desconhecida";
    
    switch (actionType.toUpperCase()) {
      case "LOGIN":
        return "Login";
      case "LOGOUT":
        return "Logout";
      case "LOGIN_FAILED":
        return "Tentativa de Login";
      case "PASSWORD_CHANGE":
        return "Alteração de Senha";
      default:
        return actionType;
    }
  };

  const getActionIcon = (actionType: string | undefined) => {
    switch (actionType?.toUpperCase()) {
      case "LOGIN":
      case "LOGOUT":
        return <User className="h-4 w-4" />;
      case "LOGIN_FAILED":
        return <Activity className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            Logs de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 mb-6">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="actionType">Tipo de Ação</Label>
              <Select
                value={filters.actionType}
                onValueChange={(value) => handleFilterChange("actionType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Tentativa de Login</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">Alteração de Senha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                  <SelectItem value="FAILURE">Falha</SelectItem>
                  <SelectItem value="WARNING">Alerta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="managerId">Gerente</Label>
              <Select
                value={filters.managerId}
                onValueChange={(value) => handleFilterChange("managerId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {managers.map((mgr) => (
                    <SelectItem key={mgr.id} value={mgr.id}>
                      {mgr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="coordinatorId">Coordenador</Label>
              <Select
                value={filters.coordinatorId}
                onValueChange={(value) => handleFilterChange("coordinatorId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {coordinators.map((coord) => (
                    <SelectItem key={coord.id} value={coord.id}>
                      {coord.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="userId">Usuário</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => handleFilterChange("userId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="">Todos</SelectItem>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilters({
                    userId: "",
                    startDate: "",
                    endDate: "",
                    actionType: "",
                    status: "",
                    coordinatorId: "",
                    managerId: "",
                  });
                  setCurrentPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Tabela de Logs */}
          <div className="overflow-x-auto mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      Data/Hora
                    </div>
                    <div className="text-xs text-gray-500 font-normal">
                      (Horário de Brasília)
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Usuário
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Gerente
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Coordenador
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      Ação
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      Status
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                        Carregando logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        Nenhum log encontrado
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-center">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-xs text-gray-500">{log.userFuncional}</div>
                      </TableCell>
                      <TableCell>
                        {log.managerName ? (
                          <div>
                            <div className="font-medium">{log.managerName}</div>
                            <div className="text-xs text-gray-500">{log.managerFuncional}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">N/A</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.coordinatorName ? (
                          <div>
                            <div className="font-medium">{log.coordinatorName}</div>
                            <div className="text-xs text-gray-500">{log.coordinatorFuncional}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">N/A</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="p-1 bg-gray-50 rounded">
                            {getActionIcon(log.actionType)}
                          </div>
                          {getActionTypeLabel(log.actionType)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(log.status)}`}>
                          {getStatusLabel(log.status)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div>
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} de {totalRecords} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLogs; 