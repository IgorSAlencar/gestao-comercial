
import React, { useState } from "react";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Lead {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  segmento: string;
  status: "novo" | "em_contato" | "negociacao" | "convertido" | "sem_interesse";
  observacoes: string;
}

const leadsIniciais: Lead[] = [
  {
    id: "1",
    nome: "Mercado São Paulo",
    endereco: "Av. Paulista, 1000 - São Paulo/SP",
    telefone: "(11) 91234-5678",
    segmento: "Varejo Alimentício",
    status: "novo",
    observacoes: "",
  },
  {
    id: "2",
    nome: "Farmácia Saúde Total",
    endereco: "Rua Augusta, 500 - São Paulo/SP",
    telefone: "(11) 97890-1234",
    segmento: "Farmácia",
    status: "em_contato",
    observacoes: "Cliente mostrou interesse, retornar próxima semana.",
  },
  {
    id: "3",
    nome: "Papelaria Criativa",
    endereco: "Rua Oscar Freire, 200 - São Paulo/SP",
    telefone: "(11) 95678-4321",
    segmento: "Papelaria",
    status: "convertido",
    observacoes: "Contrato assinado em 20/03/2025.",
  },
];

const statusLabels = {
  novo: { label: "Novo Lead", color: "bg-blue-100 text-blue-800" },
  em_contato: { label: "Em Contato", color: "bg-yellow-100 text-yellow-800" },
  negociacao: { label: "Em Negociação", color: "bg-purple-100 text-purple-800" },
  convertido: { label: "Convertido", color: "bg-green-100 text-green-800" },
  sem_interesse: { label: "Sem Interesse", color: "bg-gray-100 text-gray-800" },
};

const HotlistPage = () => {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leadsIniciais);
  const [filtro, setFiltro] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [leadAtual, setLeadAtual] = useState<Lead | null>(null);
  const [isDialogFeedbackOpen, setIsDialogFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    status: "em_contato" as Lead["status"],
    observacoes: "",
  });
  
  const { toast } = useToast();
  
  const [novoLead, setNovoLead] = useState<Omit<Lead, "id">>({
    nome: "",
    endereco: "",
    telefone: "",
    segmento: "",
    status: "novo",
    observacoes: "",
  });
  
  const handleFiltro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase();
    setFiltro(valor);
    
    // Filtra primeiro por status (se houver tab ativa) e depois pelo texto
    let leadsAtivos = leads;
    if (activeTab !== "todos") {
      leadsAtivos = leads.filter((lead) => lead.status === activeTab);
    }
    
    // Filtra pelo texto
    if (valor) {
      setFilteredLeads(
        leadsAtivos.filter(
          (lead) =>
            lead.nome.toLowerCase().includes(valor) ||
            lead.endereco.toLowerCase().includes(valor) ||
            lead.segmento.toLowerCase().includes(valor)
        )
      );
    } else {
      setFilteredLeads(leadsAtivos);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "todos") {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter((lead) => lead.status === value));
    }
  };
  
  const handleSalvarLead = () => {
    if (!novoLead.nome || !novoLead.endereco || !novoLead.telefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    const novoId = Math.random().toString(36).substring(7);
    const leadAdicionado = { ...novoLead, id: novoId };
    
    setLeads([...leads, leadAdicionado]);
    setFilteredLeads((prevState) => [...prevState, leadAdicionado]);
    
    toast({
      title: "Lead adicionado",
      description: "O novo lead foi adicionado com sucesso!",
    });
    
    setNovoLead({
      nome: "",
      endereco: "",
      telefone: "",
      segmento: "",
      status: "novo",
      observacoes: "",
    });
    
    setIsDialogOpen(false);
  };
  
  const handleFeedback = (lead: Lead) => {
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
    
    // Atualiza a lista filtrada também
    if (activeTab === "todos" || activeTab === feedback.status) {
      setFilteredLeads((prevState) =>
        prevState.map((lead) =>
          lead.id === leadAtual.id
            ? { ...lead, status: feedback.status, observacoes: feedback.observacoes }
            : lead
        )
      );
    } else {
      // Remove o lead da lista filtrada se o status não corresponder mais ao filtro atual
      setFilteredLeads((prevState) =>
        prevState.filter((lead) => lead.id !== leadAtual.id)
      );
    }
    
    toast({
      title: "Feedback registrado",
      description: "O status do lead foi atualizado com sucesso!",
    });
    
    setIsDialogFeedbackOpen(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hotlist de Prospecção</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-bradesco-blue">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Nome*</label>
                <Input
                  className="col-span-3"
                  value={novoLead.nome}
                  onChange={(e) => setNovoLead({ ...novoLead, nome: e.target.value })}
                  placeholder="Nome do estabelecimento"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Endereço*</label>
                <Input
                  className="col-span-3"
                  value={novoLead.endereco}
                  onChange={(e) => setNovoLead({ ...novoLead, endereco: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Telefone*</label>
                <Input
                  className="col-span-3"
                  value={novoLead.telefone}
                  onChange={(e) => setNovoLead({ ...novoLead, telefone: e.target.value })}
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Segmento</label>
                <Input
                  className="col-span-3"
                  value={novoLead.segmento}
                  onChange={(e) => setNovoLead({ ...novoLead, segmento: e.target.value })}
                  placeholder="Tipo de estabelecimento"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarLead} className="bg-bradesco-blue">
                Salvar Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Leads para prospecção</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar leads..."
                className="pl-8"
                value={filtro}
                onChange={handleFiltro}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos" onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="novo">Novos</TabsTrigger>
              <TabsTrigger value="em_contato">Em Contato</TabsTrigger>
              <TabsTrigger value="negociacao">Em Negociação</TabsTrigger>
              <TabsTrigger value="convertido">Convertidos</TabsTrigger>
            </TabsList>
            <TabsContent value="todos" className="mt-0">
              {renderLeadsList()}
            </TabsContent>
            <TabsContent value="novo" className="mt-0">
              {renderLeadsList()}
            </TabsContent>
            <TabsContent value="em_contato" className="mt-0">
              {renderLeadsList()}
            </TabsContent>
            <TabsContent value="negociacao" className="mt-0">
              {renderLeadsList()}
            </TabsContent>
            <TabsContent value="convertido" className="mt-0">
              {renderLeadsList()}
            </TabsContent>
          </Tabs>
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
  
  function renderLeadsList() {
    if (filteredLeads.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          Nenhum lead encontrado com os filtros atuais.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <div className="flex gap-2 items-center">
                  <h3 className="font-medium">{lead.nome}</h3>
                  <Badge className={statusLabels[lead.status].color}>
                    {statusLabels[lead.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{lead.endereco}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2 text-sm">
                  <div className="text-gray-600">{lead.telefone}</div>
                  {lead.segmento && (
                    <div className="text-gray-600">Segmento: {lead.segmento}</div>
                  )}
                </div>
                {lead.observacoes && (
                  <div className="mt-2 text-sm italic text-gray-500">
                    "{lead.observacoes}"
                  </div>
                )}
              </div>
              <div className="mt-3 sm:mt-0">
                <Button 
                  size="sm" 
                  className="bg-bradesco-blue"
                  onClick={() => handleFeedback(lead)}
                >
                  Atualizar Status
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default HotlistPage;
