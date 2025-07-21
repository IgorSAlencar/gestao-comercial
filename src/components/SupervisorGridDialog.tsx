import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import SupervisorGrid from "./SupervisorGrid";
import { User, Event, userApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface SupervisorGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisores: User[];
  eventos: Record<string, Event[]>;
  onViewAgenda: (id: string) => void;
}

const ITEMS_PER_PAGE = 6; // 2 linhas x 3 colunas

const SupervisorGridDialog: React.FC<SupervisorGridDialogProps> = ({
  open,
  onOpenChange,
  supervisores,
  eventos,
  onViewAgenda
}) => {
  const { user, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para filtros hierárquicos
  const [selectedGerenteFilter, setSelectedGerenteFilter] = useState<string>("all");
  const [selectedCoordenadorFilter, setSelectedCoordenadorFilter] = useState<string>("all");
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>("all");

  // Buscar gerentes (apenas para admin)
  const { data: gerentes = [] } = useQuery({
    queryKey: ['gerentes-supervisor-dialog'],
    queryFn: async () => {
      if (isAdmin) {
        try {
          return await userApi.getUsersByRole("gerente");
        } catch (error) {
          console.error("Erro ao buscar gerentes:", error);
          return [];
        }
      }
      return [];
    },
    enabled: isAdmin,
  });

  // Buscar coordenadores (baseado no gerente selecionado)
  const { data: coordenadores = [] } = useQuery({
    queryKey: ['coordenadores-supervisor-dialog', selectedGerenteFilter],
    queryFn: async () => {
      if (isAdmin && selectedGerenteFilter !== "all") {
        try {
          const subordinados = await userApi.getSubordinates(selectedGerenteFilter);
          return subordinados.filter(user => user.role === "coordenador");
        } catch (error) {
          console.error("Erro ao buscar coordenadores:", error);
          return [];
        }
      } else if (isAdmin && selectedGerenteFilter === "all") {
        try {
          return await userApi.getUsersByRole("coordenador");
        } catch (error) {
          console.error("Erro ao buscar coordenadores:", error);
          return [];
        }
      }
      return [];
    },
    enabled: isAdmin,
  });

  // Resetar filtros subordinados quando filtro superior muda
  useEffect(() => {
    if (selectedGerenteFilter === "all") {
      setSelectedCoordenadorFilter("all");
      setSelectedSupervisorFilter("all");
    }
  }, [selectedGerenteFilter]);

  useEffect(() => {
    if (selectedCoordenadorFilter === "all") {
      setSelectedSupervisorFilter("all");
    }
  }, [selectedCoordenadorFilter]);

  // Filtrar supervisores baseado nos filtros hierárquicos
  const filteredSupervisores = React.useMemo(() => {
    let supervisoresFiltrados = supervisores;

    // Se há filtro específico de supervisor, usar apenas ele
    if (selectedSupervisorFilter !== "all") {
      return supervisores.filter(supervisor => supervisor.id === selectedSupervisorFilter);
    }

    // Para admin, aplicar filtros hierárquicos se não há supervisor específico
    if (isAdmin) {
      // Se há coordenador selecionado, pegar supervisores de todos seus subordinados
      if (selectedCoordenadorFilter !== "all") {
        // Aqui você precisaria buscar os supervisores do coordenador selecionado
        // Por simplicidade, vamos filtrar pela lista atual
        return supervisoresFiltrados;
      }
      
      // Se há gerente selecionado, pegar supervisores de todos subordinados do gerente
      if (selectedGerenteFilter !== "all") {
        // Aqui você precisaria buscar os supervisores do gerente selecionado
        // Por simplicidade, vamos filtrar pela lista atual
        return supervisoresFiltrados;
      }
    }

    return supervisoresFiltrados;
  }, [supervisores, selectedSupervisorFilter, selectedCoordenadorFilter, selectedGerenteFilter, isAdmin]);

  // Calcular o total de páginas baseado nos supervisores filtrados
  const totalPages = Math.ceil(filteredSupervisores.length / ITEMS_PER_PAGE);

  // Reset da página quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGerenteFilter, selectedCoordenadorFilter, selectedSupervisorFilter]);

  // Obter supervisores da página atual
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSupervisores = filteredSupervisores.slice(startIndex, endIndex);

  // Funções de navegação
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visão Geral dos Supervisores</DialogTitle>
          <DialogDescription>
            Visualize e gerencie as agendas de todos os supervisores da sua equipe
          </DialogDescription>
        </DialogHeader>
        
        {/* Filtros hierárquicos */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(selectedGerenteFilter !== "all" || selectedCoordenadorFilter !== "all" || selectedSupervisorFilter !== "all") ? (
              <X 
                className="h-4 w-4 text-red-600 hover:text-red-700 cursor-pointer" 
                onClick={() => {
                  setSelectedGerenteFilter("all");
                  setSelectedCoordenadorFilter("all");
                  setSelectedSupervisorFilter("all");
                }}
              />
            ) : (
              <Filter className="h-4 w-4 text-gray-500" />
            )}
            
            {/* Filtro de Gerente (apenas para Admin) */}
            {isAdmin && (
              <Select value={selectedGerenteFilter} onValueChange={setSelectedGerenteFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Gerente..."/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Gerentes</SelectItem>
                  {gerentes.map(gerente => (
                    <SelectItem key={gerente.id} value={gerente.id}>{gerente.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filtro de Coordenador (apenas para Admin) */}
            {isAdmin && (
              <Select value={selectedCoordenadorFilter} onValueChange={setSelectedCoordenadorFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Coordenador..."/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{selectedGerenteFilter === "all" ? "Coordenadores" : "Coordenadores"}</SelectItem>
                  {coordenadores.map(coordenador => (
                    <SelectItem key={coordenador.id} value={coordenador.id}>{coordenador.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filtro de Supervisor */}
            <Select value={selectedSupervisorFilter} onValueChange={setSelectedSupervisorFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Supervisor..."/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAdmin 
                  ? (selectedCoordenadorFilter !== "all" 
                      ? "Gerente Comercial"
                      : selectedGerenteFilter !== "all" 
                        ? "Gerente Comercial"
                        : "Gerente Comercial")
                  : "Gerente Comercial"}</SelectItem>
                {supervisores.map(supervisor => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredSupervisores.length} supervisor{filteredSupervisores.length !== 1 ? 'es' : ''} encontrado{filteredSupervisores.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="mt-4">
          <SupervisorGrid 
            supervisores={currentSupervisores}
            eventos={eventos}
            onViewAgenda={onViewAgenda}
          />
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorGridDialog; 