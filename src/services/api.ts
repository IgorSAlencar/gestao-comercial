
// API service for handling backend requests
import { toast } from "@/hooks/use-toast";

const API_URL = "http://localhost:3001/api"; // Change to your actual backend URL

export interface User {
  id: string;
  name: string;
  role: "supervisor" | "coordenador" | "gerente";
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
  const message = error instanceof Error ? error.message : "Erro ao comunicar com o servidor";
  toast({
    title: "Erro",
    description: message,
    variant: "destructive",
  });
  throw new Error(message);
};

// Authentication calls
export const authApi = {
  login: async (funcional: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcional, password }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Falha na autenticação");
      }

      return await response.json() as AuthResponse;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// User hierarchy APIs
export const userApi = {
  // Get subordinates of the current user
  getSubordinates: async (userId: string): Promise<User[]> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/users/${userId}/subordinates`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao buscar subordinados");
      }

      return await response.json() as User[];
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get superior(s) of the current user
  getSuperior: async (userId: string): Promise<User | null> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/users/${userId}/superior`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        // User has no superior (probably a top-level manager)
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao buscar superior");
      }

      return await response.json() as User;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get supervisors (for managers/coordinators)
  getSupervisors: async (userId: string): Promise<User[]> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/users/${userId}/supervisors`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao buscar supervisores");
      }

      return await response.json() as User[];
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Events API
export const eventApi = {
  // Get events (filtered by date and/or supervisor)
  getEvents: async (date?: string, supervisorId?: string): Promise<Event[]> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      let url = `${API_URL}/events`;
      const params = new URLSearchParams();
      
      if (date) params.append("date", date);
      if (supervisorId) params.append("supervisorId", supervisorId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao buscar eventos");
      }

      return await response.json() as Event[];
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get single event by ID
  getEvent: async (eventId: string): Promise<Event> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao buscar evento");
      }

      return await response.json() as Event;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create new event
  createEvent: async (eventData: Omit<Event, "id">): Promise<{ id: string }> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao criar evento");
      }

      return await response.json() as { id: string; message: string };
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update event
  updateEvent: async (eventId: string, eventData: Omit<Event, "id">): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao atualizar evento");
      }
    } catch (error) {
      handleApiError(error);
    }
  },

  // Update event feedback/tratativa
  updateEventFeedback: async (eventId: string, tratativa: string): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/events/${eventId}/feedback`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tratativa }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao atualizar parecer");
      }
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete event
  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Usuário não autenticado");

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || "Erro ao excluir evento");
      }
    } catch (error) {
      handleApiError(error);
    }
  },
};
