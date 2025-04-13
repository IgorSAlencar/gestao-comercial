export type LeadStatus = "novo" | "em_contato" | "negociacao" | "convertido" | "sem_interesse";

export interface Lead {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  segmento: string;
  status: LeadStatus;
  observacoes: string;
  municipio?: string;
  uf?: string;
  cnpj?: string;
  agencia?: string;
  pa?: string;
}

export const statusLabels = {
  novo: { label: "Novo Lead", color: "bg-blue-100 text-blue-800" },
  em_contato: { label: "Em Contato", color: "bg-yellow-100 text-yellow-800" },
  negociacao: { label: "Em Negociação", color: "bg-purple-100 text-purple-800" },
  convertido: { label: "Convertido", color: "bg-green-100 text-green-800" },
  sem_interesse: { label: "Sem Interesse", color: "bg-gray-100 text-gray-800" }
}; 