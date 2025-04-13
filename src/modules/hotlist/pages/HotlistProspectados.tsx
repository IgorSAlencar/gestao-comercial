import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProspectTable from "@/components/ProspectTable";
import { LeadFilters } from "../components/LeadFilters";
import { LeadFeedbackDialog } from "../components/LeadFeedbackDialog";
import { useLeads } from "../hooks/useLeads";
import { Lead, LeadStatus } from "@/shared/types/lead";

export function HotlistProspectados() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leads, updateLead } = useLeads({
    filterStatus: ["em_contato", "negociacao", "convertido", "sem_interesse"]
  });

  const [isDialogFeedbackOpen, setIsDialogFeedbackOpen] = useState(false);
  const [leadAtual, setLeadAtual] = useState<Lead | null>(null);
  const [feedback, setFeedback] = useState<{
    status: LeadStatus;
    observacoes: string;
  }>({
    status: "em_contato",
    observacoes: "",
  });

  const handleBackToGestao = () => {
    navigate("/hotlist/gestao");
  };

  const handleFiltersChange = (filters: any) => {
    // Os filtros são aplicados automaticamente pelo hook useLeads
    console.log("Filtros atualizados:", filters);
  };

  const handleUpdateStatus = (lead: Lead) => {
    setLeadAtual(lead);
    setFeedback({
      status: lead.status,
      observacoes: lead.observacoes,
    });
    setIsDialogFeedbackOpen(true);
  };

  const handleSalvarFeedback = () => {
    if (!leadAtual) return;
    
    updateLead(leadAtual.id, {
      status: feedback.status,
      observacoes: feedback.observacoes
    });
    
    toast({
      title: "Feedback registrado",
      description: "O status do lead foi atualizado com sucesso!",
    });
    
    setIsDialogFeedbackOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBackToGestao}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Leads Prospectados</h1>
          <p className="text-muted-foreground">
            Visualize todos os leads que já receberam alguma abordagem
          </p>
        </div>
      </div>
      
      <LeadFilters onFiltersChange={handleFiltersChange} />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads Prospectados ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectTable 
            leads={leads} 
            onUpdateStatus={handleUpdateStatus}
            tableTitle="Leads Prospectados" 
          />
        </CardContent>
      </Card>

      <LeadFeedbackDialog
        isOpen={isDialogFeedbackOpen}
        onOpenChange={setIsDialogFeedbackOpen}
        lead={leadAtual}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onSave={handleSalvarFeedback}
      />
    </div>
  );
} 