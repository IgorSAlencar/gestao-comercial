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
}

const UserLogs: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: "",
    startDate: "",
    endDate: "",
    actionType: "",
    status: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
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
  }, [isAdmin, isManager, navigate]);

  // Se não tiver permissão, não renderiza o conteúdo
  if (!isAdmin && !isManager) {
    return null;
  }

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
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
        ipAddress: log.ipAddress || "N/A",
      }));

      setLogs(logsProcessados);
      setPagination({
        ...pagination,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      });
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

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPagination({ ...pagination, page: 1 }); // Reset para primeira página
  };

  const formatDate = (date: string) => {
    try {
      if (!date) return "Data não disponível";
      
      let parsedDate: Date;
      
      // Diferentes estratégias baseadas no formato da data recebida
      if (date.includes('Z')) {
        // Data em UTC (ex: 2024-01-15T10:30:00.000Z)
        parsedDate = new Date(date);
      } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/.test(date)) {
        // Data com timezone específico (ex: 2024-01-15T10:30:00-03:00)
        parsedDate = new Date(date);
      } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date)) {
        // Data sem timezone (ex: 2024-01-15T10:30:00)
        // Assumir que é horário UTC do servidor
        parsedDate = new Date(date + 'Z');
      } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(date)) {
        // Formato de banco de dados (ex: 2024-01-15 10:30:00)
        parsedDate = new Date(date.replace(' ', 'T') + 'Z');
      } else {
        // Tentar parsing direto como fallback
        parsedDate = new Date(date);
      }
      
      // Verifica se a data é válida
      if (isNaN(parsedDate.getTime())) {
        console.error("Data inválida recebida:", date);
        return "Data inválida";
      }
      
      // Converter para horário de Brasília
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo',
        hour12: false
      });
      
      return formatter.format(parsedDate);
      
    } catch (error) {
      console.error("Erro ao formatar data:", error, "Data original:", date);
      return "Erro na data";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-600";
    
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "text-green-600";
      case "FAILURE":
        return "text-red-600";
      case "WARNING":
        return "text-yellow-600";
      default:
        return "text-gray-600";
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

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Logs de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                  <SelectItem value="PASSWORD_CHANGE">
                    Alteração de Senha
                  </SelectItem>
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
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilters({
                    userId: "",
                    startDate: "",
                    endDate: "",
                    actionType: "",
                    status: "",
                  });
                  setPagination({ ...pagination, page: 1 });
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Tabela de Logs */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Data/Hora
                    <span className="text-xs text-gray-500 block font-normal">
                      (Horário de Brasília)
                    </span>
                  </TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.userName || "Usuário Desconhecido"}</div>
                          <div className="text-sm text-gray-500">
                            {log.userFuncional || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionTypeLabel(log.actionType)}</TableCell>
                      <TableCell>{log.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        <span className={getStatusColor(log.status)}>
                          {getStatusLabel(log.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Total: {pagination.total} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination({ ...pagination, page: 1 })}
                disabled={pagination.page === 1}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.totalPages })
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Última
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLogs; 