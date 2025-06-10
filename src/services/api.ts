// API service for handling backend requests
import { toast } from "@/hooks/use-toast";

const API_URL = "http://localhost:3001/api"; // Change to your actual backend URL

export interface User {
  id: string;
  name: string;
  role: "supervisor" | "coordenador" | "gerente" | "admin";
  email?: string;
  funcional: string;
}

export interface Event {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: Date;
  dataFim: Date;
  tipo: "visita" | "reuniao" | "outro";
  tratativa?: string;
  location?: string;
  subcategory?: string;
  other_description?: string;
  informar_agencia_pa?: boolean;
  agencia_pa_number?: string;
  is_pa?: boolean;
  municipio?: string;
  uf?: string;
  supervisorId?: string;
  supervisorName?: string;
  createdById?: string; // ID of the user who created the event (if different from supervisor)
  createdByName?: string; // Name of the user who created the event
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AcaoDiariaContas {
  id: string;
  chaveLoja: string;
  nomeLoja: string;
  telefone: string;
  contato: string;
  userId: string;
  qtdContasPlataforma: number;
  qtdContasLegado: number;
  qtdTotalMes?: number;
  qtdPlataformaMes?: number;
  qtdLegadoMes?: number;
  agencia: string;
  situacao: "pendente" | "em_andamento" | "concluido";
  descricaoSituacao: string;
  dataLimite: Date;
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataConclusao?: Date;
  observacoes?: string;
  prioridade: "baixa" | "media" | "alta";
  tipoAcao: string;
  endereco?: string;
  statusTablet?: string;
  tratativa?: string;
  nomeUsuario?: string; // Para exibir o nome do usuário responsável na view de equipe
}

interface ApiError {
  message: string;
}

// Helper function to handle API errors
const handleApiError = (error: unknown): never => {
  if (error instanceof Response) {
    console.error("API Response Error:", error.status, error.statusText);
    
    toast({
      title: "Erro",
      description: "Erro na comunicação com o servidor",
      variant: "destructive",
    });
    
    throw new Error("Erro na comunicação com o servidor");
  }
  
  if (error instanceof Error) {
    console.error("API Error:", error);
    
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive",
    });
    
    throw error;
  }
  
  console.error("Unknown API Error:", error);
  
  toast({
    title: "Erro",
    description: "Erro desconhecido na comunicação com a API",
    variant: "destructive",
  });
  
  throw new Error("Erro desconhecido na comunicação com a API");
};

// Improved fetch function with proper error handling
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    console.log(`[API] Chamando endpoint: ${url} - Método: ${options?.method || 'GET'}`);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      
      // Registrar informações detalhadas do erro
      console.error(`[API] Erro HTTP: ${response.status} ${response.statusText} - URL: ${url}`);
      
      // Se a resposta for JSON, tente extrair a mensagem de erro
      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await response.json();
          console.error("[API] Resposta de erro JSON:", JSON.stringify(errorData, null, 2));
          
          // Para o caso específico de erro de permissão
          if (errorData.message && errorData.message.includes("permissão")) {
            throw new Error("Sem permissão para criar evento para este supervisor. Verifique se o usuário selecionado está na sua equipe.");
          }
          
          // Para outros erros com mensagem específica
          if (errorData.message) {
            throw new Error(errorData.message);
          }
          
          throw new Error("Erro no servidor: " + JSON.stringify(errorData));
        } catch (jsonError) {
          console.error("[API] Erro ao processar resposta JSON:", jsonError);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      } else {
        // Se não for JSON, tente obter o texto da resposta
        try {
          const textData = await response.text();
          console.error("[API] Resposta de erro (texto):", textData);
          throw new Error(`Erro ${response.status}: ${response.statusText} - ${textData.substring(0, 100)}`);
        } catch (textError) {
          // Se não conseguir obter texto, lance um erro genérico com o status
          console.error("[API] Erro ao obter texto de resposta:", textError);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("[API] Erro ao processar resposta JSON bem-sucedida:", error);
        throw new Error("Erro ao processar resposta do servidor: formato JSON inválido");
      }
    }
    
    return await response.text();
  } catch (error) {
    console.error("[API] Erro na chamada de API:", error);
    
    if (error instanceof Error) {
      // Se já for um erro processado (com mensagem personalizada), apenas repasse
      throw error;
    }
    
    // Outros tipos de erro são processados pelo handleApiError
    handleApiError(error);
  }
};

// Authentication calls
export const authApi = {
  login: async (funcional: string, password: string): Promise<AuthResponse> => {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcional, password }),
    };
    
    return await fetchWithErrorHandling(`${API_URL}/auth/login`, options);
  },
};

// User hierarchy APIs
export const userApi = {
  getSubordinates: async (userId: string): Promise<User[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}/subordinates`, options);
  },

  getUserSubordinates: async (targetUserId: string): Promise<User[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      return await fetchWithErrorHandling(`${API_URL}/users/${targetUserId}/subordinates`, options);
    } catch (error) {
      console.error(`Erro ao buscar subordinados do usuário ${targetUserId}:`, error);
      return [];
    }
  },

  getSuperior: async (userId: string): Promise<User | null> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      return await fetchWithErrorHandling(`${API_URL}/users/${userId}/superior`, options);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        // User has no superior (probably a top-level manager)
        return null;
      }
      throw error;
    }
  },

  getSupervisors: async (userId: string): Promise<User[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      console.log(`[API] Buscando supervisores para o usuário ${userId}`);
      const result = await fetchWithErrorHandling(`${API_URL}/users/${userId}/supervisors`, options);
      console.log(`[API] Retornados ${result?.length || 0} supervisores para o usuário ${userId}`);
      return result || [];
    } catch (error) {
      console.error(`[API] Erro ao buscar supervisores do usuário ${userId}:`, error);
      // Tente obter subordinados e filtrar supervisores como fallback
      try {
        console.log(`[API] Tentando buscar subordinados para o usuário ${userId} como alternativa`);
        const allSubordinates = await userApi.getSubordinates(userId);
        const supervisors = allSubordinates.filter(user => user.role === "supervisor");
        console.log(`[API] Encontrados ${supervisors.length} supervisores no fallback`);
        return supervisors;
      } catch (fallbackError) {
        console.error(`[API] Erro no fallback ao buscar subordinados:`, fallbackError);
        return [];
      }
    }
  },
  
  getAllUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      console.debug('[UserAPI] Buscando todos os usuários...');
      const response = await fetch(`${API_URL}/users/all`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro ao buscar todos os usuários:", response.status, response.statusText, errorText);
        toast({
          title: "Erro ao carregar usuários",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive",
        });
        return [];
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        console.warn("Response is not JSON:", contentType);
        toast({
          title: "Erro ao processar dados",
          description: "O servidor retornou um formato inesperado",
          variant: "destructive",
        });
        return [];
      }
      
      const data = await response.json();
      console.debug(`[UserAPI] ${data.length} usuários carregados`);
      return data;
    } catch (error) {
      console.error("Falha ao buscar todos os usuários:", error);
      toast({
        title: "Erro de comunicação",
        description: error instanceof Error ? error.message : "Falha ao buscar usuários",
        variant: "destructive",
      });
      return [];
    }
  },

  getUsersByRole: async (role: "gerente" | "coordenador" | "supervisor" | "admin"): Promise<User[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      const allUsers = await fetchWithErrorHandling(`${API_URL}/users/all`, options);
      return allUsers.filter((user: User) => user.role === role);
    } catch (error) {
      console.error(`Erro ao buscar usuários com papel ${role}:`, error);
      return [];
    }
  },
};

// Events API
export const eventApi = {
  getEvents: async (date?: string, supervisorId?: string): Promise<Event[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    let url = `${API_URL}/events`;
    const params = new URLSearchParams();
    
    if (date) params.append("date", date);
    if (supervisorId) params.append("supervisorId", supervisorId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    // Log mais informativo mas único
    console.debug(`[EventsAPI] Carregando eventos...`);
    
    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      // Usa fetch diretamente em vez de fetchWithErrorHandling para evitar toast spam
      const response = await fetch(url, options);
      
      if (!response.ok) {
        console.error("Erro ao buscar eventos:", response.status, response.statusText);
        return [];
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        console.warn("Response is not JSON:", contentType);
        return [];
      }
      
      const data = await response.json();
      console.debug(`[EventsAPI] ${data.length} eventos carregados`);
      return data;
    } catch (error) {
      console.error("Falha ao buscar eventos:", error);
      return [];
    }
  },

  getEvent: async (eventId: string): Promise<Event> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/events/${eventId}`, options);
  },

  createEvent: async (eventData: Omit<Event, "id">): Promise<{ id: string }> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    // Verificar e logar informações importantes sobre o evento
    if (eventData.supervisorId) {
      console.log("API - Criando evento para supervisorId:", eventData.supervisorId);
      
      if (typeof eventData.supervisorId !== 'string') {
        console.error("supervisorId inválido:", eventData.supervisorId);
        throw new Error("ID do supervisor inválido");
      }
    } else {
      console.error("supervisorId ausente nos dados do evento");
      throw new Error("ID do supervisor é obrigatório");
    }

    // Garantir que as datas estão no formato correto
    const processedEventData = {
      ...eventData,
      // Converter datas para strings ISO
      dataInicio: eventData.dataInicio instanceof Date 
        ? eventData.dataInicio.toISOString() 
        : new Date(eventData.dataInicio).toISOString(),
      dataFim: eventData.dataFim instanceof Date 
        ? eventData.dataFim.toISOString() 
        : new Date(eventData.dataFim).toISOString()
    };

    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedEventData),
    };
    
    console.log("API - Enviando dados do evento:", JSON.stringify(processedEventData, null, 2));
    
    try {
      return await fetchWithErrorHandling(`${API_URL}/events`, options);
    } catch (error) {
      console.error("API - Erro detalhado ao criar evento:", error);
      
      // Verificar se é um erro de permissão relacionado à hierarquia
      if (error instanceof Error && error.message.includes("permissão")) {
        throw new Error("Sem permissão para criar evento para este supervisor. Verifique se ele está na sua equipe.");
      }
      
      // Se for qualquer outro erro, retransmitir
      throw error;
    }
  },

  updateEvent: async (eventId: string, eventData: Omit<Event, "id">): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    };
    
    return await fetchWithErrorHandling(`${API_URL}/events/${eventId}`, options);
  },

  updateEventFeedback: async (eventId: string, tratativa: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tratativa }),
    };
    
    return await fetchWithErrorHandling(`${API_URL}/events/${eventId}/feedback`, options);
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/events/${eventId}`, options);
  },
};

// Ações Diárias de Contas API
export const acaoDiariaApi = {
  // Obter todas as ações diárias atribuídas ao usuário atual
  getAcoesDiarias: async (userId?: string): Promise<AcaoDiariaContas[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    let url = `${API_URL}/acoes-diarias`;
    
    if (userId) {
      url += `?userId=${userId}`;
    }
    
    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      const result = await fetchWithErrorHandling(url, options);
      //console.log("Ações diárias recebidas:", result);
      return result.map((acao: any) => ({
        id: acao.ID,
        chaveLoja: acao.CHAVE_LOJA,
        nomeLoja: acao.NOME_LOJA,
        telefone: acao.TELEFONE,
        contato: acao.CONTATO,
        userId: acao.USER_ID,
        qtdContasPlataforma: acao.QTD_CONTAS_PLATAFORMA,
        qtdContasLegado: acao.QTD_CONTAS_LEGADO,
        qtdTotalMes: acao.QTD_TOTAL_MES,
        qtdPlataformaMes: acao.QTD_PLATAFORMA_MES,
        qtdLegadoMes: acao.QTD_LEGADO_MES,
        agencia: acao.AGENCIA,
        situacao: acao.SITUACAO.toLowerCase() === 'pendente' ? 'pendente' : 
                  acao.SITUACAO.toLowerCase() === 'em andamento' ? 'em_andamento' : 
                  'concluido',
        descricaoSituacao: acao.DESCRICAO_SITUACAO,
        dataLimite: new Date(acao.DATA_LIMITE),
        dataCriacao: new Date(acao.DATA_CRIACAO),
        dataAtualizacao: new Date(acao.DATA_ATUALIZACAO),
        dataConclusao: acao.DATA_CONCLUSAO ? new Date(acao.DATA_CONCLUSAO) : undefined,
        observacoes: acao.OBSERVACOES,
        prioridade: acao.PRIORIDADE.toLowerCase(),
        tipoAcao: acao.TIPO_ACAO,
        endereco: acao.ENDERECO,
        statusTablet: acao.STATUS_TABLET,
        tratativa: acao.TRATATIVA,
        nomeUsuario: acao.NOME_USUARIO
      }));
    } catch (error) {
      console.error("Falha ao buscar ações diárias:", error);
      return [];
    }
  },

  // Obter ações diárias da equipe (para coordenadores e gerentes)
  getAcoesDiariasEquipe: async (): Promise<AcaoDiariaContas[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      const result = await fetchWithErrorHandling(`${API_URL}/acoes-diarias/equipe`, options);
      return result.map((acao: any) => ({
        id: acao.ID,
        chaveLoja: acao.CHAVE_LOJA,
        nomeLoja: acao.NOME_LOJA,
        telefone: acao.TELEFONE,
        contato: acao.CONTATO,
        userId: acao.USER_ID,
        qtdContasPlataforma: acao.QTD_CONTAS_PLATAFORMA,
        qtdContasLegado: acao.QTD_CONTAS_LEGADO,
        qtdTotalMes: acao.QTD_TOTAL_MES,
        qtdPlataformaMes: acao.QTD_PLATAFORMA_MES,
        qtdLegadoMes: acao.QTD_LEGADO_MES,
        agencia: acao.AGENCIA,
        situacao: acao.SITUACAO.toLowerCase() === 'pendente' ? 'pendente' : 
                  acao.SITUACAO.toLowerCase() === 'em andamento' ? 'em_andamento' : 
                  'concluido',
        descricaoSituacao: acao.DESCRICAO_SITUACAO,
        dataLimite: new Date(acao.DATA_LIMITE),
        dataCriacao: new Date(acao.DATA_CRIACAO),
        dataAtualizacao: new Date(acao.DATA_ATUALIZACAO),
        dataConclusao: acao.DATA_CONCLUSAO ? new Date(acao.DATA_CONCLUSAO) : undefined,
        observacoes: acao.OBSERVACOES,
        prioridade: acao.PRIORIDADE.toLowerCase(),
        tipoAcao: acao.TIPO_ACAO,
        endereco: acao.ENDERECO,
        statusTablet: acao.STATUS_TABLET,
        tratativa: acao.TRATATIVA,
        nomeUsuario: acao.NOME_USUARIO
      }));
    } catch (error) {
      console.error("Falha ao buscar ações diárias da equipe:", error);
      return [];
    }
  },

  // Atualizar status de uma ação diária
  atualizarAcaoDiaria: async (id: string, dados: {
    situacao?: "pendente" | "em_andamento" | "concluido";
    observacoes?: string;
    dataConclusao?: Date;
  }): Promise<{ success: boolean; message?: string }> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    };
    
    try {
      return await fetchWithErrorHandling(`${API_URL}/acoes-diarias/${id}`, options);
    } catch (error) {
      if (error instanceof Error) {
        return { 
          success: false, 
          message: error.message || "Falha ao atualizar ação diária" 
        };
      }
      return { success: false, message: "Erro desconhecido" };
    }
  },
};

