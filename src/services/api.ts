// API service for handling backend requests
import { toast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api.config";

const API_URL = API_CONFIG.apiUrl; // Using centralized configuration

// Função centralizada para obter token (preferencialmente do sessionStorage como fallback)
const getAuthToken = (): string | null => {
  // Primeiro tenta obter do sessionStorage (onde é salvo no login)
  const sessionToken = window.sessionStorage.getItem("token");
  if (sessionToken) {
    return sessionToken;
  }
  
  // Se não encontrar, retorna null (usuário não autenticado)
  return null;
};

export interface User {
  id: string;
  name: string;
  role: "supervisor" | "coordenador" | "gerente" | "admin";
  email?: string;
  funcional: string;
  chave?: number;
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

export interface HotListItem {
  id: string;
  supervisor_id: string;
  supervisor_name: string;
  CNPJ: string;
  NOME_LOJA: string;
  LOCALIZACAO: string;
  AGENCIA: string;
  MERCADO: string;
  PRACA_PRESENCA: 'SIM' | 'NAO';
  situacao: 'pendente' | 'prospectada' | 'tratada';
  DIRETORIA_REGIONAL: string;
  GERENCIA_REGIONAL: string;
  PA: string;
  GERENTE_PJ: string;
}

export interface TratativaRequest {
  hotlist_id: string;
  data_visita: Date;
  tem_perfil_comercial: 'sim' | 'nao';
  motivo_sem_perfil: string | null;
  aceitou_proposta: 'sim' | 'nao' | null;
  motivo_nao_efetivacao: string | null;
  situacao: 'tratada' | 'pendente';
}

export interface HotListSummary {
  totalLeads: number;
  leadsPendentes: number;
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
    //console.log(`[API] Chamando endpoint: ${url} - Método: ${options?.method || 'GET'}`);
    
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
export interface AuthApi {
  login: (funcional: string, password: string) => Promise<AuthResponse>;
  validateToken: (token: string) => Promise<boolean>;
}

export const authApi: AuthApi = {
  login: async (funcional: string, password: string): Promise<AuthResponse> => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ funcional, password }),
    };
    
    return await fetchWithErrorHandling(`${API_URL}/auth/login`, options);
  },

  validateToken: async (token: string): Promise<boolean> => {
    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      await fetchWithErrorHandling(`${API_URL}/auth/validate`, options);
      return true;
    } catch (error) {
      return false;
    }
  },
};

// User hierarchy APIs
export const userApi = {
  getSubordinates: async (userId: string): Promise<User[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}/subordinates`, options);
  },

  getUserSubordinates: async (targetUserId: string): Promise<User[]> => {
    const token = getAuthToken();
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
    const token = getAuthToken();
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
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      //console.log(`[API] Buscando supervisores para o usuário ${userId}`);
      const result = await fetchWithErrorHandling(`${API_URL}/users/${userId}/supervisors`, options);
      //console.log(`[API] Retornados ${result?.length || 0} supervisores para o usuário ${userId}`);
      return result || [];
    } catch (error) {
      console.error(`[API] Erro ao buscar supervisores do usuário ${userId}:`, error);
      // Tente obter subordinados e filtrar supervisores como fallback
      try {
        //console.log(`[API] Tentando buscar subordinados para o usuário ${userId} como alternativa`);
        const allSubordinates = await userApi.getSubordinates(userId);
        const supervisors = allSubordinates.filter(user => user.role === "supervisor");
        //console.log(`[API] Encontrados ${supervisors.length} supervisores no fallback`);
        return supervisors;
      } catch (fallbackError) {
        console.error(`[API] Erro no fallback ao buscar subordinados:`, fallbackError);
        return [];
      }
    }
  },
  
  getAllUsers: async (): Promise<User[]> => {
    const token = getAuthToken();
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
    const token = getAuthToken();
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
    const token = getAuthToken();
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

  // Novo método para buscar eventos de toda a equipe para gerentes/coordenadores
  getTeamEvents: async (startDate?: string, endDate?: string): Promise<Event[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    let url = `${API_URL}/events/team`;
    const params = new URLSearchParams();
    
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.debug(`[EventsAPI] Carregando eventos da equipe (${startDate} até ${endDate})...`);
    
    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      // Buscar usuário atual
      const user = JSON.parse(window.sessionStorage.getItem("user") || "{}");
      if (!user.id) {
        console.error("[EventsAPI] Usuário não encontrado no sessionStorage");
        return [];
      }

      // Buscar supervisores da equipe
      let supervisors: User[] = [];
      try {
        if (user.role === "admin") {
          supervisors = await userApi.getUsersByRole("supervisor");
        } else {
          const allSubordinates = await userApi.getSubordinates(user.id);
          supervisors = allSubordinates.filter(u => u.role === "supervisor");
        }
        console.debug(`[EventsAPI] Encontrados ${supervisors.length} supervisores para buscar eventos`);
      } catch (subordinatesError) {
        console.error("[EventsAPI] Erro ao buscar supervisores:", subordinatesError);
        return [];
      }

      if (supervisors.length === 0) {
        console.warn("[EventsAPI] Nenhum supervisor encontrado, retornando lista vazia");
        return [];
      }

      // Buscar eventos para cada supervisor em paralelo
      const allPromises = supervisors.map(async (supervisor) => {
        try {
          let supervisorUrl = `${API_URL}/events?supervisorId=${supervisor.id}`;
          if (startDate) supervisorUrl += `&startDate=${startDate}`;
          if (endDate) supervisorUrl += `&endDate=${endDate}`;

          const response = await fetch(supervisorUrl, options);
          if (!response.ok) {
            console.warn(`[EventsAPI] Erro ao buscar eventos para supervisor ${supervisor.id}: ${response.status}`);
            return [];
          }

          const events = await response.json();
          // Garantir que cada evento tenha as informações do supervisor
          return events.map((event: Event) => ({
            ...event,
            supervisorId: supervisor.id,
            supervisorName: supervisor.name
          }));
        } catch (error) {
          console.error(`[EventsAPI] Erro ao buscar eventos para supervisor ${supervisor.id}:`, error);
          return [];
        }
      });

      // Aguardar todas as requisições e combinar os resultados
      const results = await Promise.all(allPromises);
      const allEvents = results.flat();

      // Filtrar eventos por data se necessário
      let filteredEvents = allEvents;
      if (startDate || endDate) {
        filteredEvents = allEvents.filter(event => {
          const eventDate = new Date(event.dataInicio);
          let matches = true;

          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matches = matches && eventDate >= start;
          }

          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matches = matches && eventDate <= end;
          }

          return matches;
        });
      }

      console.debug(`[EventsAPI] ${filteredEvents.length} eventos da equipe carregados`);
      return filteredEvents;
    } catch (error) {
      console.error("[EventsAPI] Falha ao buscar eventos da equipe:", error);
      return [];
    }
  },

  getEvent: async (eventId: string): Promise<Event> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/events/${eventId}`, options);
  },

  createEvent: async (eventData: Omit<Event, "id">): Promise<{ id: string }> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    // Verificar e logar informações importantes sobre o evento
    if (eventData.supervisorId) {
      //console.log("API - Criando evento para supervisorId:", eventData.supervisorId);
      
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
    
    //console.log("API - Enviando dados do evento:", JSON.stringify(processedEventData, null, 2));
    
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
    const token = getAuthToken();
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
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tratativa }),
    };
    
    try {
      //console.log(`Chamando endpoint: ${API_URL}/events/${eventId}/feedback - Método: PUT`);
      const response = await fetch(`${API_URL}/events/${eventId}/feedback`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
        console.error('Erro na resposta:', response.status, errorData);
        throw new Error(errorData.message || `Erro ao atualizar feedback: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    const token = getAuthToken();
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

// Interface para Tratativa
export interface Tratativa {
  id: string;
  hotlist_id: string;
  user_id: string;
  user_name: string;
  data_visita: Date;
  tem_perfil_comercial: number; // 1 para sim, 0 para não
  motivo_sem_perfil?: string;
  aceitou_proposta?: number; // 1 para sim, 0 para não, null para não aplicável
  motivo_nao_efetivacao?: string;
  situacao: 'tratada' | 'pendente';
  data_tratativa: Date;
}

// Função auxiliar para fazer chamadas POST
const post = async (url: string, data: any) => {
  const token = getAuthToken();
  if (!token) throw new Error("Usuário não autenticado");

  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  
  return await fetchWithErrorHandling(`${API_URL}${url}`, options);
};

// HotList APIs
export const hotListApi = {
  getHotList: async (userId: string): Promise<HotListItem[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/hotlist/${userId}`, options);
  },

  getHotListSummary: async (userId: string): Promise<HotListSummary> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/hotlist/${userId}/summary`, options);
  },

  updateHotListItem: async (itemId: string, data: Partial<HotListItem>): Promise<HotListItem> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    
    return await fetchWithErrorHandling(`${API_URL}/hotlist/${itemId}`, options);
  },

  registrarTratativa: async (data: TratativaRequest) => {
    return await post('/hotlist/tratativa', data);
  },

  getTratativas: async (itemId: string): Promise<Tratativa[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/hotlist/${itemId}/tratativas`, options);
  },
};

// Tipos para municípios prioritários
export interface MunicipioPrioritario {
  id: string;
  nome: string;
  uf: string;
  codigoMunicipio: number;
  chaveSupervisor: string;
  chaveCoordenador: string;
  chaveGerente: string;
  supervisorId: string | null;
  supervisorNome: string | null;
  visitasAgendadas: VisitaAgendada[];
  visitasRealizadas: VisitaRealizada[];
}

export interface VisitaAgendada {
  id: string;
  data: Date;
  status: 'agendada' | 'realizada' | 'cancelada';
}

export interface VisitaRealizada {
  id: string;
  data: Date;
  cnpjs: CNPJVisitado[];
  observacoes?: string;
}

export interface CNPJVisitado {
  id: string;
  cnpj: string;
  razaoSocial: string;
  ramo: 'farmacia' | 'mercado';
  interesse: 'sim' | 'nao';
  contratoEnviado?: 'sim' | 'nao';
  motivoInteresse?: string;
  motivoContrato?: string;
  semCNPJ?: boolean;
  nomeLoja?: string;
  dataVisita?: string; // Formato DD/MM/YYYY
}

// Tipos para categorias de eventos
export interface EventCategory {
  id: number;
  name: string;
  description: string;
  subcategories: EventSubcategory[];
}

export interface EventSubcategory {
  id: number;
  name: string;
  description: string;
}

// Serviço para categorias de eventos
export const eventCategoryApi = {
  getCategories: async (): Promise<EventCategory[]> => {
    const token = getAuthToken();
    if (!token) {
      console.error('[EventCategoryAPI] Token não encontrado');
      throw new Error("Usuário não autenticado");
    }

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    
    try {
      //console.log('[EventCategoryAPI] Iniciando busca de categorias...');
      //console.log('[EventCategoryAPI] URL:', `${API_URL}/events/categories`);
      //console.log('[EventCategoryAPI] Headers:', options.headers);
      
      const response = await fetch(`${API_URL}/events/categories`, options);
      
      //console.log('[EventCategoryAPI] Status da resposta:', response.status);
      //console.log('[EventCategoryAPI] Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EventCategoryAPI] Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          throw new Error("Token inválido ou expirado. Faça login novamente.");
        }
        
        if (response.status === 404) {
          throw new Error("Endpoint de categorias não encontrado");
        }
        
        throw new Error(`Erro ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const categories = await response.json();
      //console.log('[EventCategoryAPI] Categorias recebidas:', categories);
      
      if (!Array.isArray(categories)) {
        console.error('[EventCategoryAPI] Resposta não é um array:', categories);
        throw new Error("Formato de resposta inválido - esperado array de categorias");
      }
      
      return categories;
    } catch (error) {
      console.error('[EventCategoryAPI] Erro ao buscar categorias:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erro desconhecido ao buscar categorias");
    }
  }
};

// API para municípios prioritários
// User logs interface
export interface UserLog {
  id: string;
  userId: string;
  timestamp: string;
  actionType: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  status: string;
  userName: string;
  userFuncional: string;
  userRole: string;
  coordinatorName?: string;
  coordinatorFuncional?: string;
  managerName?: string;
  managerFuncional?: string;
}

export interface UserLogsResponse {
  logs: UserLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User logs API
export const userLogsApi = {
  getLogs: async (filters: any = {}, page: number = 1, limit: number = 10): Promise<UserLogsResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/user-logs?${queryParams}`, options);
  },
  logEvent: async (actionType: string, details: any = {}, status: string = 'INFO'): Promise<{ ok: boolean }> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actionType, details, status }),
    };

    return await fetchWithErrorHandling(`${API_URL}/user-logs`, options);
  },
};

export const municipiosPrioritariosApi = {
  getMunicipios: async (supervisorId?: string): Promise<MunicipioPrioritario[]> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    // Construir URL com parâmetro de query se supervisorId for fornecido
    let url = `${API_URL}/municipios-prioritarios`;
    if (supervisorId) {
      url += `?supervisorId=${encodeURIComponent(supervisorId)}`;
    }

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      //console.log('[MunicipiosAPI] Buscando municípios prioritários...', supervisorId ? `para supervisor ${supervisorId}` : '');
      const data = await fetchWithErrorHandling(url, options);
      
      // Converter as datas dos objetos aninhados
      const municipios = data.map((municipio: any) => ({
        ...municipio,
        visitasAgendadas: municipio.visitasAgendadas.map((visita: any) => ({
          ...visita,
          data: new Date(visita.data)
        })),
        visitasRealizadas: municipio.visitasRealizadas.map((visita: any) => ({
          ...visita,
          data: new Date(visita.data)
        }))
      }));
      
      //console.log(`[MunicipiosAPI] ${municipios.length} municípios carregados`);
      return municipios;
    } catch (error) {
      console.error('Erro ao buscar municípios prioritários:', error);
      throw error;
    }
  },

  getMunicipio: async (municipioId: string): Promise<MunicipioPrioritario> => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      //console.log(`[MunicipiosAPI] Buscando município ${municipioId}...`);
      const data = await fetchWithErrorHandling(`${API_URL}/municipios-prioritarios/${municipioId}`, options);
      
      // Converter as datas dos objetos aninhados
      const municipio = {
        ...data,
        visitasAgendadas: data.visitasAgendadas.map((visita: any) => ({
          ...visita,
          data: new Date(visita.data)
        })),
        visitasRealizadas: data.visitasRealizadas.map((visita: any) => ({
          ...visita,
          data: new Date(visita.data)
        }))
      };
      
      //console.log(`[MunicipiosAPI] Município ${municipio.nome} carregado`);
      return municipio;
    } catch (error) {
      console.error(`Erro ao buscar município ${municipioId}:`, error);
      throw error;
    }
  }
};

// API para tratativas de municípios
export const tratativasMunicipiosApi = {
  salvarTratativa: async (tratativaData: {
    cd_munic: number;
    empresas: Array<{
      cnpj: string;
      semCNPJ: boolean;
      nomeLoja?: string;
      ramo: 'sim' | 'nao';
      interesse: 'sim' | 'nao';
      contratoEnviado?: 'sim' | 'nao';
      motivoContrato?: string;
      dataVisita?: string;
    }>;
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tratativaData),
    };
    
    try {
      //console.log('[TratativasAPI] Salvando tratativa:', tratativaData);
      const data = await fetchWithErrorHandling(`${API_URL}/tratativas-municipios`, options);
      //console.log('[TratativasAPI] Tratativa salva com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao salvar tratativa:', error);
      throw error;
    }
  },

  buscarTratativasMunicipio: async (cdMunic: number) => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      //console.log(`[TratativasAPI] Buscando tratativas do município ${cdMunic}...`);
      const data = await fetchWithErrorHandling(`${API_URL}/tratativas-municipios/municipio/${cdMunic}`, options);
      //console.log(`[TratativasAPI] ${data.length} tratativas encontradas para o município ${cdMunic}`);
      return data;
    } catch (error) {
      console.error(`Erro ao buscar tratativas do município ${cdMunic}:`, error);
      throw error;
    }
  },

  buscarTratativasUsuario: async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      //console.log('[TratativasAPI] Buscando tratativas do usuário...');
      const data = await fetchWithErrorHandling(`${API_URL}/tratativas-municipios/usuario`, options);
      //console.log(`[TratativasAPI] ${data.length} tratativas encontradas para o usuário`);
      return data;
    } catch (error) {
      console.error('Erro ao buscar tratativas do usuário:', error);
      throw error;
    }
  },

  atualizarTratativa: async (tratativaId: string, dadosAtualizacao: {
    houveInteresse?: 'Sim' | 'Não';
    contratoEnviado?: 'Sim' | 'Não';
    observacao?: string;
    ramoAtividade?: 'Sim' | 'Não';
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosAtualizacao),
    };
    
    try {
      //console.log('[TratativasAPI] Atualizando tratativa:', tratativaId, dadosAtualizacao);
      const data = await fetchWithErrorHandling(`${API_URL}/tratativas-municipios/${tratativaId}`, options);
      //console.log('[TratativasAPI] Tratativa atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar tratativa:', error);
      throw error;
    }
  }
};
