
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, authApi, userApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (funcional: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
  isCoordinator: boolean;
  isSupervisor: boolean;
  subordinates: User[];
  loadingSubordinates: boolean;
  superior: User | null;
  loadingSuperior: boolean;
  refreshSubordinates: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isManager: false,
  isCoordinator: false,
  isSupervisor: false,
  subordinates: [],
  loadingSubordinates: false,
  superior: null,
  loadingSuperior: false,
  refreshSubordinates: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);
  const [superior, setSuperior] = useState<User | null>(null);
  const [loadingSuperior, setLoadingSuperior] = useState(false);
  const navigate = useNavigate();

  // Verificar se já existe um usuário e token no localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // Carregar subordinados quando o usuário for autenticado
  useEffect(() => {
    if (user && (user.role === "coordenador" || user.role === "gerente")) {
      fetchSubordinates();
    }
  }, [user]);

  // Carregar superior quando o usuário for autenticado
  useEffect(() => {
    if (user && user.role === "supervisor") {
      fetchSuperior();
    }
  }, [user]);

  const fetchSubordinates = async () => {
    if (!user) return;
    
    setLoadingSubordinates(true);
    try {
      const data = await userApi.getSubordinates(user.id);
      setSubordinates(data);
    } catch (error) {
      console.error("Erro ao carregar subordinados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os subordinados",
        variant: "destructive",
      });
      setSubordinates([]);
    } finally {
      setLoadingSubordinates(false);
    }
  };

  const fetchSuperior = async () => {
    if (!user) return;
    
    setLoadingSuperior(true);
    try {
      const data = await userApi.getSuperior(user.id);
      setSuperior(data);
    } catch (error) {
      console.error("Erro ao carregar superior:", error);
      setSuperior(null);
    } finally {
      setLoadingSuperior(false);
    }
  };

  const login = async (funcional: string, password: string) => {
    try {
      const { user: userData, token: authToken } = await authApi.login(funcional, password);
      
      setUser(userData);
      setToken(authToken);
      
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", authToken);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${userData.name}!`,
      });
      
      navigate("/agenda");
    } catch (error) {
      console.error("Login error:", error);
      // Toast já exibido pelo manipulador de erros da API
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSubordinates([]);
    setSuperior(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Calcula os papéis com base no role do usuário
  const isManager = user?.role === "gerente" || user?.role === "coordenador";
  const isCoordinator = user?.role === "coordenador";
  const isSupervisor = user?.role === "supervisor";

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token,
        login, 
        logout, 
        isAuthenticated: !!user,
        isManager,
        isCoordinator,
        isSupervisor,
        subordinates,
        loadingSubordinates,
        superior,
        loadingSuperior,
        refreshSubordinates: fetchSubordinates
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
