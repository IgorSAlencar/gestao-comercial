import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Lead, LeadStatus, statusLabels } from "@/shared/types/lead";

interface LeadFeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  feedback: {
    status: LeadStatus;
    observacoes: string;
  };
  onFeedbackChange: (feedback: { status: LeadStatus; observacoes: string }) => void;
  onSave: () => void;
}

export function LeadFeedbackDialog({
  isOpen,
  onOpenChange,
  lead,
  feedback,
  onFeedbackChange,
  onSave,
}: LeadFeedbackDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Status do Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm">Nome</label>
            <div className="col-span-3 font-medium">{lead?.nome}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm">Status</label>
            <select
              className="col-span-3 p-2 border rounded-md"
              value={feedback.status}
              onChange={(e) => onFeedbackChange({ 
                ...feedback, 
                status: e.target.value as LeadStatus 
              })}
            >
              {Object.entries(statusLabels).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-sm">Observações</label>
            <textarea
              className="col-span-3 p-2 border rounded-md h-24"
              value={feedback.observacoes}
              onChange={(e) => onFeedbackChange({ 
                ...feedback, 
                observacoes: e.target.value 
              })}
              placeholder="Adicione suas observações sobre o contato..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} className="bg-bradesco-blue">
            Salvar Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 