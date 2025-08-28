import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, authApi, userApi } from "@/services/api";
import { normalizeFuncional } from "@/utils/normalizeFuncional";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (funcional: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isManager: boolean;
  isCoordinator: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  subordinates: User[];
  loadingSubordinates: boolean;
  superior: User | null;
  loadingSuperior: boolean;
  refreshSubordinates: () => Promise<void>;
  allUsers: User[];
  loadingAllUsers: boolean;
  refreshAllUsers: () => Promise<void>;
  getUserSubordinates: (userId: string) => Promise<User[]>;
  getUsersByRole: (role: "gerente" | "coordenador" | "supervisor" | "admin") => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isInitializing: true,
  isManager: false,
  isCoordinator: false,
  isSupervisor: false,
  isAdmin: false,
  subordinates: [],
  loadingSubordinates: false,
  superior: null,
  loadingSuperior: false,
  refreshSubordinates: async () => {},
  allUsers: [],
  loadingAllUsers: false,
  refreshAllUsers: async () => {},
  getUserSubordinates: async () => [],
  getUsersByRole: async () => [],
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);
  const [superior, setSuperior] = useState<User | null>(null);
  const [loadingSuperior, setLoadingSuperior] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  
  // Ref para controlar chamadas duplicadas
  const isRefreshingSubordinates = React.useRef(false);
  const isRefreshingAllUsers = React.useRef(false);
  const lastRefreshSubordinates = React.useRef<number>(0);
  const lastRefreshAllUsers = React.useRef<number>(0);

  // InicializaÃ§Ã£o do estado de autenticaÃ§Ã£o
  useEffect(() => {
    // Apenas finaliza a inicializaÃ§Ã£o sem recuperar dados do sessionStorage
    setIsInitializing(false);
  }, []);

  // Carregar subordinados quando o usuÃ¡rio for autenticado
  useEffect(() => {
    if (user && (user.role === "coordenador" || user.role === "gerente")) {
      fetchSubordinates();
    }
  }, [user]);

  // Carregar superior quando o usuÃ¡rio for autenticado
  useEffect(() => {
    if (user && user.role === "supervisor") {
      fetchSuperior();
    }
  }, [user]);

  // Carregar todos os usuÃ¡rios se for admin
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAllUsers();
    }
  }, [user]);

  const fetchSubordinates = async () => {
    if (!user) return;
    
    // Evitar chamadas duplicadas com menos de 2 segundos de intervalo
    const now = Date.now();
    if (isRefreshingSubordinates.current || (now - lastRefreshSubordinates.current < 2000)) {
      console.debug("[AuthContext] Ignorando chamada duplicada de refreshSubordinates");
      return;
    }
    
    isRefreshingSubordinates.current = true;
    setLoadingSubordinates(true);
    
    try {
      const data = await userApi.getSubordinates(user.id);
      setSubordinates(data);
      lastRefreshSubordinates.current = Date.now();
    } catch (error) {
      console.error("Erro ao carregar subordinados:", error);
      toast({
        title: "Erro",
        description: "NÃ£o foi possÃ­vel carregar os subordinados",
        variant: "destructive",
      });
      setSubordinates([]);
    } finally {
      setLoadingSubordinates(false);
      isRefreshingSubordinates.current = false;
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

  // Nova funÃ§Ã£o para buscar todos os usuÃ¡rios
  const fetchAllUsers = async () => {
    if (!user) return;
    
    // Verificar se o usuÃ¡rio Ã© admin (apenas para diagnÃ³stico)
    if (user.role !== "admin") {
      console.debug(`[AuthContext] UsuÃ¡rio nÃ£o Ã© admin (role=${user.role}), mas tentou buscar todos usuÃ¡rios`);
    }
    
    // Evitar chamadas duplicadas com menos de 2 segundos de intervalo
    const now = Date.now();
    if (isRefreshingAllUsers.current || (now - lastRefreshAllUsers.current < 2000)) {
      console.debug("[AuthContext] Ignorando chamada duplicada de refreshAllUsers");
      return;
    }
    
    isRefreshingAllUsers.current = true;
    setLoadingAllUsers(true);
    
    try {
      console.debug("[AuthContext] Iniciando busca de todos os usuÃ¡rios");
      const data = await userApi.getAllUsers();
      console.debug(`[AuthContext] ${data.length} usuÃ¡rios recebidos`);
      setAllUsers(data);
      lastRefreshAllUsers.current = Date.now();
    } catch (error) {
      console.error("Erro ao carregar todos os usuÃ¡rios:", error);
      toast({
        title: "Erro",
        description: "NÃ£o foi possÃ­vel carregar a lista de usuÃ¡rios",
        variant: "destructive",
      });
      setAllUsers([]);
    } finally {
      setLoadingAllUsers(false);
      isRefreshingAllUsers.current = false;
    }
  };

    const login = async (funcional: string, password: string) => {
    try {
      const normalized = normalizeFuncional(funcional, { maxLength: 7 });
      const { user: userData, token: authToken } = await authApi.login(normalized, password);
      
      setUser(userData);
      setToken(authToken);
      
      // Salva no sessionStorage para uso posterior (sem recuperação automática)
      window.sessionStorage.setItem("user", JSON.stringify(userData));
      window.sessionStorage.setItem("token", authToken);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${userData.name}!`,
      });
      
      navigate("/"); // Redireciona para a página inicial
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Erro ao autenticar";
      toast({
        title: "Erro de login",
        description: message,
        variant: "destructive",
      });
    }
  };const logout = () => {
    setUser(null);
    setToken(null);
    setSubordinates([]);
    setSuperior(null);
    setAllUsers([]);
    
    // Limpa os dados do sessionStorage
    window.sessionStorage.removeItem("user");
    window.sessionStorage.removeItem("token");
    
    navigate("/login");
  };

  // Calcula os papÃ©is com base no role do usuÃ¡rio
  const isManager = user?.role === "gerente" || user?.role === "coordenador";
  const isCoordinator = user?.role === "coordenador";
  const isSupervisor = user?.role === "supervisor";
  const isAdmin = user?.role === "admin";
  const canSeeSubordinates = user?.role === "gerente" || user?.role === "coordenador" || user?.role === "admin";

  // Nova funÃ§Ã£o para buscar subordinados de qualquer usuÃ¡rio
  const getUserSubordinates = async (userId: string): Promise<User[]> => {
    try {
      return await userApi.getUserSubordinates(userId);
    } catch (error) {
      console.error(`Erro ao buscar subordinados do usuÃ¡rio ${userId}:`, error);
      return [];
    }
  };
  
  // Nova funÃ§Ã£o para buscar usuÃ¡rios por papel
  const getUsersByRole = async (role: "gerente" | "coordenador" | "supervisor" | "admin"): Promise<User[]> => {
    try {
      return await userApi.getUsersByRole(role);
    } catch (error) {
      console.error(`Erro ao buscar usuÃ¡rios com papel ${role}:`, error);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token,
        login, 
        logout, 
        isAuthenticated: !!user,
        isInitializing,
        isManager,
        isCoordinator,
        isSupervisor,
        isAdmin,
        subordinates,
        loadingSubordinates,
        superior,
        loadingSuperior,
        refreshSubordinates: fetchSubordinates,
        allUsers,
        loadingAllUsers,
        refreshAllUsers: fetchAllUsers,
        getUserSubordinates,
        getUsersByRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


