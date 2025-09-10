import { API_CONFIG } from '@/config/api.config';

const API_BASE_URL = API_CONFIG.baseUrl;

// Função para obter token do sessionStorage (alinhada com api.ts)
const getAuthToken = (): string | null => {
  return window.sessionStorage.getItem("token");
};

export interface EstratégiaFilter {
  produto: 'credito' | 'abertura-conta' | 'seguro' | 'pontos-ativos' | 'pontos-realizando-negocio' | 'pontos-bloqueados';
  userChave: number;
  userRole: 'gerente' | 'coordenador' | 'supervisor' | 'admin';
}

export interface LojaEstrategia {
  chaveLoja: string;
  nomeLoja: string;
  cnpj: string;
  situacao: string;
  endereco: string;
  telefoneLoja: string;
  nomeContato: string;
  dataInauguracao: Date;
  situacaoTablet: string;
  habilitadoConta: boolean;
  habilitadoMicro: boolean;
  habilitadoLime: boolean;
  habilitadoConsig: boolean;
  dataUltTransacao: Date;
  chaveGerenciaArea: number;
  descGerenciaArea: string;
  chaveCoordenacao: number;
  descCoordenacao: string;
  chaveSupervisao: number;
  descSupervisao: string;
  dirRegional: string;
  gerRegional: string;
  agRelacionamento: string;
  codAgRelacionamento: string;
  // Dados específicos do produto
  dadosProduto?: any;
}

export interface DadosEstrategiaResponse {
  produto: string;
  userRole: string;
  userChave: number;
  totalLojas: number;
  dadosAnaliticos: any[];
}

export interface MetricasEstrategiaResponse {
  // Totais
  totalContasM0: number;
  totalContasM1: number;
  variacaoTotal: number;
  
  // Lojas
  totalLojas: number;
  lojasComProducaoM0: number;
  lojasComProducaoM1: number;
  
  // Análises específicas
  lojasQueZeraram: number;
  lojasNovas: number;
  lojasQueVoltaram: number;
  lojasEstaveisAtivas: number;
  lojasQuedaProducao: number;
  lojasSemMovimento: number;
  
  // Percentuais calculados
  crescimentoPercentual: number;
  produtividadeGeral: number;
  
  // Média por loja
  mediaPorLoja: number;
  
  // Tendências
  tendencias: {
    comecando: number;
    estavel: number;
    atencao: number;
    queda: number;
  };
  
  // Metadados
  produto: string;
  userRole: string;
  userChave: number;
}

export interface MetricasGerenciaisResponse {
  produto: string;
  userRole: string;
  userChave: number;
  metricasGerenciais: {
    descricao: string;
    chaveSupervisao: number;
    nomeSupervisor: string;
    metricas: {
      totalContasM0: number;
      totalContasM1: number;
      totalLojas: number;
      lojasAtivas: number;
      lojasZeraram: number;
      lojasCresceram: number;
      lojasCairam: number;
      lojasEstaveis: number;
      crescimentoPercentual: number;
      produtividadeGeral: number;
    };
  }[];
}

export interface CascataResponse {
  totalM1: number;
  totalM0: number;
  variacoesNegativas: Array<{ key: string; value: number }>;
  variacoesPositivas: Array<{ key: string; value: number }>;
  manteve: number;
  dadosBloqueios: Array<{ motivo: string; quantidade: number }>;
  dadosDiasInoperantes: Array<{ dia: string; dias: number }>;
  totalLojas: number;
}

// Função auxiliar para tratar erros da API
const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data.message || `Erro ${error.response.status}`;
  } else if (error.request) {
    return 'Servidor não está respondendo. Verifique se ele está rodando.';
  } else {
    return error.message || 'Erro desconhecido';
  }
};

export const estrategiaComercialApi = {
  /**
   * Busca dados completos de uma estratégia específica
   */
  getEstrategia: async (produto: string): Promise<DadosEstrategiaResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    //console.log(`🔐 Enviando requisição para estratégia ${produto} com token: ${token ? 'Presente' : 'Ausente'}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/estrategia/${produto}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`Erro ao buscar estratégia ${produto}:`, error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Busca métricas calculadas no SQL para uma estratégia específica
   */
  getMetricasEstrategia: async (produto: string): Promise<MetricasEstrategiaResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    //console.log(`📊 Buscando métricas calculadas para estratégia ${produto}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/estrategia/${produto}/metricas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`Erro ao buscar métricas de ${produto}:`, error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Busca métricas gerenciais por supervisão
   */
  getMetricasGerenciais: async (produto: string): Promise<MetricasGerenciaisResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    //console.log(`📊 Buscando métricas gerenciais para estratégia ${produto}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/estrategia/${produto}/metricas-gerenciais`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`Erro ao buscar métricas gerenciais de ${produto}:`, error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Busca lojas baseado na hierarquia do usuário
   */
  getLojasByHierarchy: async (filter: EstratégiaFilter): Promise<LojaEstrategia[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    try {
      const response = await fetch(`${API_BASE_URL}/api/estrategia/lojas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filter)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Erro ao buscar lojas por hierarquia:', error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Busca dados específicos de um produto para uma lista de lojas
   */
  getDadosProduto: async (produto: string, chaveLojas: number[]): Promise<any[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    try {
      const response = await fetch(`${API_BASE_URL}/api/estrategia/${produto}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chave_lojas: chaveLojas })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`Erro ao buscar dados de ${produto}:`, error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Busca dados da cascata de pontos ativos
   */
  getCascataPontosAtivos: async (): Promise<CascataResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    try {
      const response = await fetch(`${API_BASE_URL}/api/estrategia/pontos-ativos/cascata`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Erro ao buscar dados da cascata:', error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Verifica status de conexão com o servidor
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return false;
    }
  }
}; 