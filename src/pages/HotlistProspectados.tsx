
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProspectTable from "@/components/ProspectTable";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

interface Lead {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  segmento: string;
  status: "novo" | "em_contato" | "negociacao" | "convertido" | "sem_interesse";
  observacoes: string;
  municipio?: string;
  uf?: string;
  cnpj?: string;
  agencia?: string;
  pa?: string;
}

// Os mesmos dados que estão em Hotlist.tsx
const leadsIniciais: Lead[] = [
  {
    id: "1",
    nome: "Mercado São Paulo",
    endereco: "Av. Paulista, 1000 - São Paulo/SP",
    telefone: "(11) 91234-5678",
    segmento: "Varejo Alimentício",
    status: "novo",
    observacoes: "",
    municipio: "São Paulo",
    uf: "SP",
    cnpj: "12.345.678/0001-01",
    agencia: "1234",
    pa: "",
  },
  {
    id: "2",
    nome: "Farmácia Saúde Total",
    endereco: "Rua Augusta, 500 - São Paulo/SP",
    telefone: "(11) 97890-1234",
    segmento: "Farmácia",
    status: "em_contato",
    observacoes: "Cliente mostrou interesse, retornar próxima semana.",
    municipio: "São Paulo",
    uf: "SP",
    cnpj: "23.456.789/0001-02",
    agencia: "1234",
    pa: "5678",
  },
  {
    id: "3",
    nome: "Papelaria Criativa",
    endereco: "Rua Oscar Freire, 200 - São Paulo/SP",
    telefone: "(11) 95678-4321",
    segmento: "Papelaria",
    status: "convertido",
    observacoes: "Contrato assinado em 20/03/2025.",
    municipio: "Campinas",
    uf: "SP",
    cnpj: "34.567.890/0001-03",
    agencia: "5678",
    pa: "",
  },
  {
    id: "4",
    nome: "Açougue Bom Corte",
    endereco: "Rua das Carnes, 123 - Santo André/SP",
    telefone: "(11) 94321-8765",
    segmento: "Açougue",
    status: "novo",
    observacoes: "",
    municipio: "Santo André",
    uf: "SP",
    cnpj: "45.678.901/0001-04",
    agencia: "9012",
    pa: "",
  },
  {
    id: "5",
    nome: "Auto Peças Rápidas",
    endereco: "Av. dos Automóveis, 500 - São Bernardo/SP",
    telefone: "(11) 98765-4321",
    segmento: "Auto Peças",
    status: "sem_interesse",
    observacoes: "Cliente já trabalha com outro banco.",
    municipio: "São Bernardo",
    uf: "SP",
    cnpj: "56.789.012/0001-05",
    agencia: "3456",
    pa: "7890",
  },
];

const HotlistProspectados = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isDialogFeedbackOpen, setIsDialogFeedbackOpen] = useState(false);
  const [leadAtual, setLeadAtual] = useState<Lead | null>(null);
  const [feedback, setFeedback] = useState({
    status: "em_contato" as Lead["status"],
    observacoes: "",
  });

  useEffect(() => {
    // Filtra apenas leads que já foram prospectados (não são novos)
    const prospectedLeads = leads.filter(lead => 
      lead.status === "em_contato" || 
      lead.status === "negociacao" || 
      lead.status === "convertido" || 
      lead.status === "sem_interesse"
    );
    setFilteredLeads(prospectedLeads);
  }, [leads]);

  const handleBackToGestao = () => {
    navigate("/hotlist/gestao");
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
    
    const updatedLeads = leads.map((lead) =>
      lead.id === leadAtual.id
        ? { ...lead, status: feedback.status, observacoes: feedback.observacoes }
        : lead
    );
    
    setLeads(updatedLeads);
    
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
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads Prospectados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectTable 
            leads={filteredLeads} 
            onUpdateStatus={handleUpdateStatus}
            tableTitle="Leads Prospectados" 
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogFeedbackOpen} onOpenChange={setIsDialogFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Nome</label>
              <div className="col-span-3 font-medium">{leadAtual?.nome}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Status</label>
              <select
                className="col-span-3 p-2 border rounded-md"
                value={feedback.status}
                onChange={(e) => setFeedback({ ...feedback, status: e.target.value as Lead["status"] })}
              >
                <option value="novo">Novo Lead</option>
                <option value="em_contato">Em Contato</option>
                <option value="negociacao">Em Negociação</option>
                <option value="convertido">Convertido</option>
                <option value="sem_interesse">Sem Interesse</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm">Observações</label>
              <textarea
                className="col-span-3 p-2 border rounded-md h-24"
                value={feedback.observacoes}
                onChange={(e) => setFeedback({ ...feedback, observacoes: e.target.value })}
                placeholder="Adicione suas observações sobre o contato..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogFeedbackOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarFeedback} className="bg-bradesco-blue">
              Salvar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HotlistProspectados;
