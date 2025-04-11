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
}

export interface AuthResponse {
  user: User;
  token: string;
}

interface ApiError {
  message: string;
}

// Helper function to handle API errors
const handleApiError = (error: unknown): never => {
  console.error("API Error:", error);
  
  // If the error has a response and we can get text from it
  if (error instanceof Response) {
    error.text().then(text => {
      console.error("Server response:", text);
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(text);
        const message = data.message || "Erro ao comunicar com o servidor";
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      } catch (e) {
        // If not JSON, provide more context
        toast({
          title: "Erro",
          description: "O servidor retornou uma resposta inválida. Verifique se o servidor está rodando.",
          variant: "destructive",
        });
        console.error("Failed to parse server response:", e);
      }
    }).catch(e => {
      toast({
        title: "Erro",
        description: "Falha ao processar resposta do servidor",
        variant: "destructive",
      });
      console.error("Failed to read response text:", e);
    });
  } else {
    // For other types of errors
    const message = error instanceof Error ? error.message : "Erro ao comunicar com o servidor";
    toast({
      title: "Erro",
      description: message,
      variant: "destructive",
    });
  }
  
  throw new Error(typeof error === 'string' ? error : "Erro na comunicação com o servidor");
};

// Improved fetch function with proper error handling
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    
    // Check if response is ok (status in the range 200-299)
    if (!response.ok) {
      return handleApiError(response);
    }
    
    // Check if the content is JSON (prevent HTML parsing errors)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      console.warn("Response is not JSON:", contentType);
      const text = await response.text();
      console.error("Non-JSON response:", text);
      throw new Error("Resposta do servidor não é JSON válido");
    }
    
    // Parse JSON
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      // JSON parse error
      console.error("JSON Parse Error:", error);
      throw new Error("Erro ao processar resposta do servidor: formato inválido");
    }
    return handleApiError(error);
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
    
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}/supervisors`, options);
  },
  
  getAllUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    return await fetchWithErrorHandling(`${API_URL}/users/all`, options);
  }
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

    console.log("Requesting events from:", url);
    
    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      const result = await fetchWithErrorHandling(url, options);
      console.log("Events received:", result);
      return result;
    } catch (error) {
      console.error("Failed to fetch events:", error);
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

    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    };
    
    return await fetchWithErrorHandling(`${API_URL}/events`, options);
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

// Hotlist API - Adicionando funções específicas para a Hotlist
export const hotlistApi = {
  getLeads: async (): Promise<any[]> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    
    try {
      const result = await fetchWithErrorHandling(`${API_URL}/hotlist/leads`, options);
      return result;
    } catch (error) {
      console.error("Failed to fetch hotlist leads:", error);
      return [];
    }
  },
  
  updateLeadStatus: async (leadId: string, status: string, observacoes: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Usuário não autenticado");

    const options = {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, observacoes }),
    };
    
    try {
      await fetchWithErrorHandling(`${API_URL}/hotlist/leads/${leadId}/status`, options);
    } catch (error) {
      console.error("Failed to update lead status:", error);
      throw error;
    }
  },
};
