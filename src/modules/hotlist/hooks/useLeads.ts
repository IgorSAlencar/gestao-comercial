import { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus } from '@/shared/types/lead';
import { mockLeads } from '../data/mockLeads';

interface UseLeadsOptions {
  filterStatus?: LeadStatus[];
  searchTerm?: string;
  location?: string;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);

  const { filterStatus, searchTerm, location } = options;

  useEffect(() => {
    let results = leads;

    if (filterStatus && filterStatus.length > 0) {
      results = results.filter(lead => filterStatus.includes(lead.status));
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(
        lead => 
          lead.nome.toLowerCase().includes(searchLower) || 
          (lead.cnpj && lead.cnpj.includes(searchTerm)) || 
          lead.segmento.toLowerCase().includes(searchLower) ||
          (lead.agencia && lead.agencia.includes(searchTerm)) ||
          (lead.pa && lead.pa.includes(searchTerm))
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      results = results.filter(
        lead => 
          (lead.municipio && lead.municipio.toLowerCase().includes(locationLower)) || 
          (lead.uf && lead.uf.toLowerCase().includes(locationLower))
      );
    }

    setFilteredLeads(results);
  }, [leads, filterStatus, searchTerm, location]);

  const statistics = useMemo(() => {
    const total = leads.length;
    const prospectados = leads.filter(lead => 
      lead.status === "em_contato" || 
      lead.status === "negociacao" || 
      lead.status === "convertido" || 
      lead.status === "sem_interesse"
    ).length;
    const tratados = leads.filter(lead => 
      lead.status === "convertido" || 
      lead.status === "sem_interesse"
    ).length;
    const semTratativas = leads.filter(lead => 
      lead.status === "novo"
    ).length;

    return {
      total,
      prospectados,
      tratados,
      semTratativas
    };
  }, [leads]);

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(currentLeads => 
      currentLeads.map(lead => 
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
    );
  };

  return {
    leads: filteredLeads,
    statistics,
    updateLead
  };
} 