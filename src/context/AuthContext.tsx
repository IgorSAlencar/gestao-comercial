
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string; // Mantemos para compatibilidade
  role: string;
  subordinates?: string[]; // IDs dos supervisores subordinados (para coordenadores e gerentes)
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean; // Indica se é coordenador ou gerente
  isCoordinator: boolean; // Indica se é coordenador
  isSupervisor: boolean; // Indica se é supervisor
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isManager: false,
  isCoordinator: false,
  isSupervisor: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Verificar se já existe um usuário no localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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
        login, 
        logout, 
        isAuthenticated: !!user,
        isManager,
        isCoordinator,
        isSupervisor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
