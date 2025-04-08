
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
};
