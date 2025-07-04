export interface Correspondente {
  id: string;
  CHAVE_LOJA: string;
  CNPJ: string;
  NOME: string;
  nr_pacb: string;
  diretoria?: string;
  gerencia?: string;
  gerente_area?: string;
  coordenador?: string;
  supervisor?: string;
  agencia?: string;
  pa?: string;
  status?: 'ativo' | 'inativo';
  ultima_tratativa?: string;
  total_tratativas?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TratativaCorban {
  id: string;
  correspondente_id: string;
  data_visita: string;
  tipo_contato: 'visita_presencial' | 'videochamada' | 'ligacao' | 'email' | 'whatsapp';
  objetivo_visita: 'prospeccao' | 'apresentacao_produtos' | 'negociacao' | 'acompanhamento' | 'suporte_tecnico' | 'treinamento' | 'relacionamento';
  status_correspondente: 'muito_interessado' | 'interessado' | 'neutro' | 'resistente' | 'sem_interesse';
  volume_estimado?: string;
  produtos_interesse: string[];
  observacoes?: string;
  proximos_passos?: string;
  data_proximo_contato?: string;
  resultado: 'muito_positivo' | 'positivo' | 'neutro' | 'negativo' | 'muito_negativo';
  user_id: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export interface FilterStateCorrespondente {
  search: string;
  diretoria: string;
  gerencia: string;
  gerente_area: string;
  coordenador: string;
  supervisor: string;
  agencia: string;
  pa: string;
  status: string;
}

export interface CorrespondentesStats {
  total: number;
  ativos: number;
  inativos: number;
  comTratativas: number;
  ultimoMes: number;
}

export interface TratativaFormData {
  data_visita: Date;
  tipo_contato: string;
  objetivo_visita: string;
  status_correspondente: string;
  volume_estimado: string;
  produtos_interesse: string[];
  observacoes: string;
  proximos_passos: string;
  data_proximo_contato: Date | null;
  resultado: string;
}

// Opções para selects
export const TIPOS_CONTATO = [
  { value: 'visita_presencial', label: 'Visita Presencial' },
  { value: 'videochamada', label: 'Videochamada' },
  { value: 'ligacao', label: 'Ligação Telefônica' },
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' }
] as const;

export const OBJETIVOS_VISITA = [
  { value: 'prospeccao', label: 'Prospecção Inicial' },
  { value: 'apresentacao_produtos', label: 'Apresentação de Produtos' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'acompanhamento', label: 'Acompanhamento' },
  { value: 'suporte_tecnico', label: 'Suporte Técnico' },
  { value: 'treinamento', label: 'Treinamento' },
  { value: 'relacionamento', label: 'Relacionamento' }
] as const;

export const STATUS_CORRESPONDENTE = [
  { value: 'muito_interessado', label: 'Muito Interessado' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'neutro', label: 'Neutro' },
  { value: 'resistente', label: 'Resistente' },
  { value: 'sem_interesse', label: 'Sem Interesse' }
] as const;

export const PRODUTOS_BANCARIOS = [
  { value: 'conta_corrente', label: 'Conta Corrente' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'emprestimo_pessoal', label: 'Empréstimo Pessoal' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'consorcio', label: 'Consórcio' },
  { value: 'investimentos', label: 'Investimentos' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'previdencia', label: 'Previdência' }
] as const;

export const RESULTADO_TRATATIVA = [
  { value: 'muito_positivo', label: 'Muito Positivo', color: 'text-green-600' },
  { value: 'positivo', label: 'Positivo', color: 'text-green-500' },
  { value: 'neutro', label: 'Neutro', color: 'text-yellow-600' },
  { value: 'negativo', label: 'Negativo', color: 'text-red-500' },
  { value: 'muito_negativo', label: 'Muito Negativo', color: 'text-red-600' }
] as const; 