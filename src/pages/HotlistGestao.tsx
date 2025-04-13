import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChartBar, Users, CheckCheck, AlertCircle, Search, Filter } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ProspectTable from "@/components/ProspectTable";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

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

interface FilterFormValues {
  searchTerm: string;
  status: string;
  location: string;
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
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leadsIniciais);
  
  const form = useForm<FilterFormValues>({
    defaultValues: {
      searchTerm: "",
      status: "",
      location: "",
    }
  });

  const { watch } = form;
  const formValues = watch();

  // Apply filters whenever form values change
  useEffect(() => {
    let results = leads;

    // Filter by search term (name, CNPJ, or segment)
    if (formValues.searchTerm) {
      const searchLower = formValues.searchTerm.toLowerCase();
      results = results.filter(
        lead => 
          lead.nome.toLowerCase().includes(searchLower) || 
          (lead.cnpj && lead.cnpj.includes(formValues.searchTerm)) || 
          lead.segmento.toLowerCase().includes(searchLower) ||
          (lead.agencia && lead.agencia.includes(formValues.searchTerm)) ||
          (lead.pa && lead.pa.includes(formValues.searchTerm))
      );
    }

    // Filter by status
    if (formValues.status) {
      results = results.filter(lead => lead.status === formValues.status);
    }

    // Filter by location (municipio or UF)
    if (formValues.location) {
      const locationLower = formValues.location.toLowerCase();
      results = results.filter(
        lead => 
          (lead.municipio && lead.municipio.toLowerCase().includes(locationLower)) || 
          (lead.uf && lead.uf.toLowerCase().includes(locationLower))
      );
    }

    setFilteredLeads(results);
  }, [formValues, leads]);
  
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
    navigate("/hotlist/all");
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

  const clearFilters = () => {
    form.reset({
      searchTerm: "",
      status: "",
      location: ""
    });
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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtros</span>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buscar por Nome, CNPJ, Segmento, Agência ou PA</FormLabel>
                    <FormControl>
                      <div className="flex w-full items-center space-x-2">
                        <Input placeholder="Buscar..." {...field} />
                        <Button type="button" size="icon" variant="ghost">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo Lead</SelectItem>
                          <SelectItem value="em_contato">Em Contato</SelectItem>
                          <SelectItem value="negociacao">Em Negociação</SelectItem>
                          <SelectItem value="convertido">Convertido</SelectItem>
                          <SelectItem value="sem_interesse">Sem Interesse</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização (Município/UF)</FormLabel>
                    <FormControl>
                      <div className="flex w-full items-center space-x-2">
                        <Input placeholder="Ex: São Paulo ou SP" {...field} />
                        <Button type="button" size="icon" variant="ghost">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Prospects ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectTable 
            leads={filteredLeads}
            tableTitle="Todos os Prospects" 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HotlistGestao;
