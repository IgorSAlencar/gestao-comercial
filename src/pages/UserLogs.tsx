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
import { ChevronLeft, ChevronRight, User, Clock, Activity, Download } from "lucide-react";
import * as XLSX from 'xlsx';

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
    if (!isAdmin && !isManager && user?.role !== 'coordenador') {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
  }, [isAdmin, isManager, user?.role, navigate, toast]);

  // Se não tiver permissão, não renderiza o conteúdo
  if (!isAdmin && !isManager && user?.role !== 'coordenador') {
    return null;
  }

  // Verificar se o usuário é coordenador
  const isCoordinator = user?.role === 'coordenador';

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
        
        // Filtrar coordenadores e gerentes baseado no nível do usuário atual
        let coordinatorsList = [];
        let managersList = [];
        let usersList = [];

        if (isAdmin) {
          // Admin vê todos os coordenadores e gerentes
          coordinatorsList = allUsers
            .filter((u: any) => u.role === 'coordenador')
            .map((u: any) => ({ id: u.id, name: u.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
            
          managersList = allUsers
            .filter((u: any) => u.role === 'gerente')
            .map((u: any) => ({ id: u.id, name: u.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
            
          usersList = allUsers
            .map((u: any) => ({ id: u.id, name: u.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
        } else if (isManager) {
          // Gerente vê apenas seus subordinados
          coordinatorsList = allUsers
            .filter((u: any) => u.role === 'coordenador')
            .map((u: any) => ({ id: u.id, name: u.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
            
          // Gerente não vê outros gerentes nos filtros
          managersList = [{ id: user?.id || '', name: user?.name || 'Você' }];
          
          usersList = allUsers
            .map((u: any) => ({ id: u.id, name: u.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
        } else if (isCoordinator) {
          // Coordenador não vê filtros de gerente/coordenador
          coordinatorsList = [];
          managersList = [];
          
          usersList = allUsers
            .map((u: any) => ({ id: u.id, name: u.name }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
        }
        
        setCoordinators(coordinatorsList);
        setManagers(managersList);
        setUsers(usersList);
        setFilteredUsers(usersList);
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

  const exportToExcel = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      // Buscar todos os dados filtrados (sem paginação)
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "10000", // Limite alto para pegar todos os registros
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
        throw new Error("Falha ao carregar logs para exportação");
      }

      const data = await response.json();
      const allLogs = data.logs || [];

      // Formatar dados para Excel
      const dadosParaExportar = allLogs.map((log: UserLog) => ({
        'Data': (() => {
          try {
            const date = new Date(log.timestamp);
            const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
            return format(localDate, 'dd/MM/yyyy HH:mm', { locale: ptBR });
          } catch {
            return 'Data inválida';
          }
        })(),
        'Usuário': log.userName || 'N/A',
        'Funcional': log.userFuncional || 'N/A',
        'Perfil': log.userRole || 'N/A',
        ...(isAdmin && { 'Gerente': log.managerName || 'N/A' }),
        ...(isAdmin && { 'Funcional Gerente': log.managerFuncional || 'N/A' }),
        ...((isAdmin || isManager) && { 'Coordenador': log.coordinatorName || 'N/A' }),
        ...((isAdmin || isManager) && { 'Funcional Coordenador': log.coordinatorFuncional || 'N/A' }),
        'Ação': getActionTypeLabel(log.actionType),
        'Status': getStatusLabel(log.status),
        'IP': log.ipAddress || 'N/A',
        'User Agent': log.userAgent || 'N/A',
        'Detalhes': log.details || 'N/A'
      }));

      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
      
      // Configurar largura das colunas
      const cols = [
        { wch: 18 }, // Data
        { wch: 25 }, // Usuário
        { wch: 15 }, // Funcional
        { wch: 12 }, // Perfil
        ...(isAdmin ? [{ wch: 25 }, { wch: 15 }] : []), // Gerente e Funcional Gerente
        ...((isAdmin || isManager) ? [{ wch: 25 }, { wch: 15 }] : []), // Coordenador e Funcional Coordenador
        { wch: 20 }, // Ação
        { wch: 12 }, // Status
        { wch: 15 }, // IP
        { wch: 30 }, // User Agent
        { wch: 30 }  // Detalhes
      ];
      ws['!cols'] = cols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs de Usuários");
      
      // Nome do arquivo com data e hora
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd_HH-mm-ss', { locale: ptBR });
      const fileName = `Logs_Usuarios_${dateStr}.xlsx`;
      
      // Gerar o arquivo como buffer
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Criar blob com tipo MIME correto
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Criar URL temporária
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento de link temporário
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: `Logs exportados com sucesso! (${allLogs.length} registros)`,
      });
    } catch (error) {
      console.error("Erro ao exportar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            Logs de Usuários
            {isCoordinator && (
              <span className="text-sm font-normal text-gray-600">
                (Seus subordinados)
              </span>
            )}
            {isManager && !isAdmin && (
              <span className="text-sm font-normal text-gray-600">
                (Sua equipe)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            {/* Primeira linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            {/* Segunda linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mostrar filtro de gerente apenas para admin */}
              {isAdmin ? (
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
              ) : (
                <div></div>
              )}

              {/* Mostrar filtro de coordenador apenas para admin e gerente */}
              {(isAdmin || isManager) ? (
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
              ) : (
                <div></div>
              )}
              
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

              {/* Botões de ação */}
              <div className="flex items-end gap-2">
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
                  className="flex-1"
                >
                  Limpar Filtros
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Exportando..." : "Excel"}
                </Button>
              </div>
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
                  {/* Mostrar coluna de gerente apenas para admin */}
                  {isAdmin && (
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Gerente
                      </div>
                    </TableHead>
                  )}
                  {/* Mostrar coluna de coordenador apenas para admin e gerente */}
                  {(isAdmin || isManager) && (
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Coordenador
                      </div>
                    </TableHead>
                  )}
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
                    <TableCell colSpan={isAdmin ? 6 : isManager ? 5 : 4} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                        Carregando logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : isManager ? 5 : 4} className="text-center py-8">
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
                      {/* Mostrar coluna de gerente apenas para admin */}
                      {isAdmin && (
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
                      )}
                      {/* Mostrar coluna de coordenador apenas para admin e gerente */}
                      {(isAdmin || isManager) && (
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
                      )}
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