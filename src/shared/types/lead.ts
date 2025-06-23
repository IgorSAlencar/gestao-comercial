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

export interface DadosLoja {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  mesM3: number;
  mesM2: number;
  mesM1: number;
  mesM0: number;
  situacao: string;
  dataUltTrxContabil: Date;
  dataUltTrxNegocio: Date;
  dataBloqueio?: Date;
  dataInauguracao: Date;
  agencia: string;
  telefoneLoja: string;
  nomeContato: string;
  gerenciaRegional: string;
  diretoriaRegional: string;
  tendencia: string;
  endereco: string;
  nomePdv: string;
  multiplicadorResponsavel: string;
  dataCertificacao?: Date;
  situacaoTablet: string;
  produtosHabilitados: {
    consignado: boolean;
    microsseguro: boolean;
    lime: boolean;
  };
  motivoBloqueio?: string;
}

export interface DadosEstrategia {
  titulo: string;
  visaoGeral: string;
  dadosAnaliticos: DadosLoja[];
}

export interface FiltrosLoja {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  situacao: string | string[];
  agencia: string;
  gerenciaRegional: string | string[];
  diretoriaRegional: string | string[];
  tendencia: string | string[];
} 