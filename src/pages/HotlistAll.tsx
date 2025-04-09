import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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

// Os mesmos dados que estão em Hotlist.tsx e HotlistTratados.tsx
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

interface FilterFormValues {
  searchTerm: string;
  status: string;
  location: string;
}

const HotlistAll = () => {
  const navigate = useNavigate();
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
    let results = leadsIniciais;

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
  }, [formValues]);

  const handleBackToGestao = () => {
    navigate("/hotlist/gestao");
  };

  const clearFilters = () => {
    form.reset({
      searchTerm: "",
      status: "",
      location: ""
    });
  };

  // Adicionar um console log para depuração
  useEffect(() => {
    console.log("HotlistAll montado, quantidade de leads:", leadsIniciais.length);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBackToGestao}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Todos os Prospects</h1>
          <p className="text-muted-foreground">
            Visualização completa de todos os leads da sua carteira
          </p>
        </div>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="novo">Novo Lead</SelectItem>
                        <SelectItem value="em_contato">Em Contato</SelectItem>
                        <SelectItem value="negociacao">Em Negociação</SelectItem>
                        <SelectItem value="convertido">Convertido</SelectItem>
                        <SelectItem value="sem_interesse">Sem Interesse</SelectItem>
                      </SelectContent>
                    </Select>
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

export default HotlistAll;
