
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProspectTable from "@/components/ProspectTable";

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

const HotlistTratados = () => {
  const navigate = useNavigate();
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  useEffect(() => {
    // Filtra apenas leads tratados (convertidos ou sem interesse)
    const tratadosLeads = leadsIniciais.filter(lead => 
      lead.status === "convertido" || lead.status === "sem_interesse"
    );
    setFilteredLeads(tratadosLeads);
  }, []);

  const handleBackToGestao = () => {
    navigate("/hotlist/gestao");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBackToGestao}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Leads Tratados</h1>
          <p className="text-muted-foreground">
            Leads que já foram tratados, com decisão final (convertidos ou sem interesse)
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads Tratados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectTable 
            leads={filteredLeads}
            tableTitle="Leads Tratados" 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HotlistTratados;
