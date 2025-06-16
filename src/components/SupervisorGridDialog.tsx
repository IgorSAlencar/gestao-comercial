import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { User, Event } from "@/services/api";
import SupervisorGrid from "./SupervisorGrid";

interface SupervisorGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisores: User[];
  eventos: Record<string, Event[]>;
  onViewAgenda: (id: string) => void;
  onViewRelatorio: (id: string) => void;
}

const SupervisorGridDialog: React.FC<SupervisorGridDialogProps> = ({
  open,
  onOpenChange,
  supervisores,
  eventos,
  onViewAgenda,
  onViewRelatorio
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Visão Geral dos Supervisores</DialogTitle>
          <DialogDescription>
            Visualize e gerencie as agendas de todos os supervisores da sua equipe
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <SupervisorGrid 
            supervisores={supervisores}
            eventos={eventos}
            onViewAgenda={onViewAgenda}
            onViewRelatorio={onViewRelatorio}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorGridDialog; 