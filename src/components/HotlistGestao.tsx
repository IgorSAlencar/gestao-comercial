import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import ProspectTable from "./ProspectTable";

interface Lead {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  segmento: string;
  status: "novo" | "em_contato" | "negociacao" | "convertido" | "sem_interesse" | "tratado";
  observacoes: string;
  municipio?: string;
  uf?: string;
  cnpj?: string;
  agencia?: string;
  pa?: string;
  gerentePJ?: string;
  diretoriaRegional?: string;
  gerenciaRegional?: string;
}

const statusLabels = {
  novo: { label: "Novo Lead", color: "bg-blue-100 text-blue-800" },
  em_contato: { label: "Em Contato", color: "bg-yellow-100 text-yellow-800" },
  negociacao: { label: "Em Negociação", color: "bg-purple-100 text-purple-800" },
  convertido: { label: "Convertido", color: "bg-green-100 text-green-800" },
  sem_interesse: { label: "Sem Interesse", color: "bg-gray-100 text-gray-800" },
  tratado: { label: "Tratado", color: "bg-green-100 text-green-800" }
};

const HotlistGestao = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<{
    diretoriaRegional?: string;
    gerenciaRegional?: string;
    status?: string;
  }>({});

  // Exemplo de dados de leads (substitua pelos seus dados reais)
  const leads: Lead[] = [
    // ... seus dados de leads aqui
  ];

  // Função para obter valores únicos de diretoria regional
  const diretoriasRegionais = useMemo(() => {
    const diretorias = new Set(leads.map(lead => lead.diretoriaRegional).filter(Boolean));
    return Array.from(diretorias).sort();
  }, [leads]);

  // Função para obter valores únicos de gerência regional
  const gerenciasRegionais = useMemo(() => {
    const gerencias = new Set(leads.map(lead => lead.gerenciaRegional).filter(Boolean));
    return Array.from(gerencias).sort();
  }, [leads]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, localização ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Diretoria Regional</label>
            <select
              className="w-48 p-2 border rounded"
              value={filters.diretoriaRegional || ''}
              onChange={(e) => handleFilterChange('diretoriaRegional', e.target.value)}
            >
              <option value="">Todas</option>
              {diretoriasRegionais.map((diretoria) => (
                <option key={diretoria} value={diretoria}>
                  {diretoria}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gerência Regional</label>
            <select
              className="w-48 p-2 border rounded"
              value={filters.gerenciaRegional || ''}
              onChange={(e) => handleFilterChange('gerenciaRegional', e.target.value)}
            >
              <option value="">Todas</option>
              {gerenciasRegionais.map((gerencia) => (
                <option key={gerencia} value={gerencia}>
                  {gerencia}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-48 p-2 border rounded"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* ... rest of the existing code ... */}
    </div>
  );
};

export default HotlistGestao; 