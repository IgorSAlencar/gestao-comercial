import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SupervisorGrid from "./SupervisorGrid";
import { User, Event } from "@/services/api";

interface SupervisorGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisores: User[];
  eventos: Record<string, Event[]>;
  onViewAgenda: (id: string) => void;
  onViewRelatorio: (id: string) => void;
}

const ITEMS_PER_PAGE = 6; // 2 linhas x 3 colunas

const SupervisorGridDialog: React.FC<SupervisorGridDialogProps> = ({
  open,
  onOpenChange,
  supervisores,
  eventos,
  onViewAgenda,
  onViewRelatorio
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular o total de páginas
  const totalPages = Math.ceil(supervisores.length / ITEMS_PER_PAGE);

  // Obter supervisores da página atual
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSupervisores = supervisores.slice(startIndex, endIndex);

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
        
        <div className="mt-4">
          <SupervisorGrid 
            supervisores={currentSupervisores}
            eventos={eventos}
            onViewAgenda={onViewAgenda}
            onViewRelatorio={onViewRelatorio}
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