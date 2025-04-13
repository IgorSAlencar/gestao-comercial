import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LeadFilters } from "../components/LeadFilters";
import { LeadStatistics } from "../components/LeadStatistics";
import ProspectTable from "@/components/ProspectTable";
import { useLeads } from "../hooks/useLeads";

export function HotlistGestao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leads, statistics, updateLead } = useLeads();

  const handleFiltersChange = (filters: any) => {
    // Os filtros são aplicados automaticamente pelo hook useLeads
    console.log("Filtros atualizados:", filters);
  };

  const navigateToHotlist = () => navigate("/hotlist/all");
  const navigateToProspectados = () => navigate("/hotlist/prospectados");
  const navigateToTratados = () => navigate("/hotlist/tratados");
  const navigateToSemTratativas = () => navigate("/hotlist/sem-tratativas");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Hotlist</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da sua carteira de prospecção
        </p>
      </div>
      
      <LeadStatistics
        {...statistics}
        onViewAll={navigateToHotlist}
        onViewProspectados={navigateToProspectados}
        onViewTratados={navigateToTratados}
        onViewSemTratativas={navigateToSemTratativas}
      />
      
      <LeadFilters onFiltersChange={handleFiltersChange} />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Prospects ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectTable 
            leads={leads}
            tableTitle="Todos os Prospects" 
          />
        </CardContent>
      </Card>
    </div>
  );
} 