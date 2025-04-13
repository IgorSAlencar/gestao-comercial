import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProspectTable from "@/components/ProspectTable";
import { LeadFilters } from "../components/LeadFilters";
import { useLeads } from "../hooks/useLeads";

export function HotlistTratados() {
  const navigate = useNavigate();
  const { leads } = useLeads({
    filterStatus: ["convertido", "sem_interesse"]
  });

  const handleBackToGestao = () => {
    navigate("/hotlist/gestao");
  };

  const handleFiltersChange = (filters: any) => {
    // Os filtros são aplicados automaticamente pelo hook useLeads
    console.log("Filtros atualizados:", filters);
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
      
      <LeadFilters onFiltersChange={handleFiltersChange} />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads Tratados ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectTable 
            leads={leads}
            tableTitle="Leads Tratados" 
          />
        </CardContent>
      </Card>
    </div>
  );
} 