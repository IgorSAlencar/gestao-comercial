
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChartBar, Users, CheckCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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

const HotlistGestao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais);
  
  // Estatísticas
  const totalLeads = leads.length;
  const leadsProspectados = leads.filter(lead => 
    lead.status === "em_contato" || 
    lead.status === "negociacao" || 
    lead.status === "convertido" || 
    lead.status === "sem_interesse"
  ).length;
  
  const leadsTratados = leads.filter(lead => 
    lead.status === "convertido" || lead.status === "sem_interesse"
  ).length;
  
  const leadsSemTratativas = leads.filter(lead => lead.status === "novo").length;

  const navigateToHotlist = () => {
    navigate("/hotlist");
  };

  const navigateToProspectados = () => {
    navigate("/hotlist/prospectados");
  };

  const navigateToTratados = () => {
    navigate("/hotlist/tratados");
  };

  const navigateToSemTratativas = () => {
    navigate("/hotlist/sem-tratativas");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Hotlist</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da sua carteira de prospecção
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Prospects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalLeads}</div>
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={navigateToHotlist}
            >
              Ver Todos
            </Button>
          </CardFooter>
        </Card>

        {/* Já Prospectados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Já Prospectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{leadsProspectados}</div>
              <ChartBar className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={navigateToProspectados}
            >
              Ver Prospectados
            </Button>
          </CardFooter>
        </Card>

        {/* Tratados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tratados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{leadsTratados}</div>
              <CheckCheck className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={navigateToTratados}
            >
              Ver Tratados
            </Button>
          </CardFooter>
        </Card>

        {/* Sem Tratativas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Sem Tratativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{leadsSemTratativas}</div>
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={navigateToSemTratativas}
            >
              Ver Pendentes
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid gap-4 mt-6">
        {/* Gráfico ou visualização adicional aqui se necessário */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso de Prospecção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 py-2">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Leads Prospectados</div>
                  <div className="font-medium">{leadsProspectados} / {totalLeads}</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" 
                    style={{ width: `${(leadsProspectados/totalLeads)*100}%` }}>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Leads Tratados</div>
                  <div className="font-medium">{leadsTratados} / {totalLeads}</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" 
                    style={{ width: `${(leadsTratados/totalLeads)*100}%` }}>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Taxa de Conversão</div>
                  <div className="font-medium">
                    {leads.filter(lead => lead.status === "convertido").length} / {leadsProspectados}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" 
                    style={{ width: `${(leads.filter(lead => lead.status === "convertido").length/Math.max(leadsProspectados, 1))*100}%` }}>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HotlistGestao;
