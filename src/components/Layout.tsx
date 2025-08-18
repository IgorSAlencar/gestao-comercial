import React, { useState } from "react";
import { 
  Home,
  Calendar, 
  BarChart3,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  Flame,
  Users,
  Network,
  Building2,
  MapPin
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout, isManager, isAdmin } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const menuItems = [
    {
      icon: Home,
      label: "Início",
      href: "/",
    },
    {
      icon: Calendar,
      label: "Agenda",
      href: "/agenda",
    },
    {
      icon: MapPin,
      label: "Municípios Prioritários",
      href: "/meus-municipios",
      roles: ["supervisor", "gerente", "coordenador", "admin"],
    },
    {
      icon: BarChart3,
      label: "Estratégia Comercial",
      href: "/estrategia-comercial",
      roles: ["supervisor", "gerente", "coordenador", "admin"],
    },
    {
      icon: Flame,
      label: "HotList",
      href: "/hotlist",
    },
    {
      icon: Building2,
      label: "Correspondentes",
      href: "/correspondentes",
      roles: ["admin"],
    },
    {
      icon: Network,
      label: "Logs",
      href: "/logs",
      roles: ["admin", "gerente"],
    },
  ];
  
  // Item de navegação específico para coordenadores e gerentes
  const managerItems = [
    {
      title: "Minha Equipe",
      icon: <Users className="h-5 w-5" />,
      path: "/equipe",
    }
  ];
  
  // Item de navegação específico para administradores
  const adminItems = [
    {
      title: "Equipe Comercial",
      icon: <Users className="h-5 w-5" />,
      path: "/equipe",
    }
  ];

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div 
        className={cn(
          "transition-all duration-300 flex flex-col bg-white border-r",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className={cn("flex items-center", isSidebarCollapsed && "justify-center w-full")}>
            <div className="h-8 w-8 rounded-md bradesco-gradient flex items-center justify-center">
              <span className="font-bold text-white">BE</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="ml-2">
                <span className="font-bold text-lg">Bradesco Expresso</span>
                <div className="text-xs text-gray-500 mt-1">Gestão Comercial</div>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar}
            className="p-1 h-auto hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", isSidebarCollapsed && "rotate-180")} />
          </Button>
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="px-2 space-y-1">
            {menuItems
              .filter(item => {
                // Se o item não tem roles definidas, mostra para todos
                if (!item.roles) return true;
                // Se tem roles, verifica se o usuário tem permissão
                if (isAdmin) return item.roles.includes("admin");
                if (isManager) return item.roles.includes("gerente");
                return item.roles.includes(user?.role || "");
              })
              .map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  item.href === "/" 
                    ? location.pathname === "/"
                      ? "bg-bradesco-blue text-white"
                      : "text-gray-700 hover:bg-gray-100"
                    : location.pathname.startsWith(item.href)
                      ? "bg-bradesco-blue text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  isSidebarCollapsed && "justify-center"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5" />
                {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            ))}
            
            {/* Itens de navegação específicos para gerentes e coordenadores */}
            {isManager && !isAdmin && managerItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname.startsWith(item.path)
                    ? "bg-bradesco-blue text-white"
                    : "text-gray-700 hover:bg-gray-100",
                  isSidebarCollapsed && "justify-center"
                )}
                title={isSidebarCollapsed ? item.title : undefined}
              >
                {item.icon}
                {!isSidebarCollapsed && <span className="ml-3">{item.title}</span>}
              </Link>
            ))}
            
            {/* Itens de navegação específicos para administradores */}
            {isAdmin && adminItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname.startsWith(item.path)
                    ? "bg-bradesco-blue text-white"
                    : "text-gray-700 hover:bg-gray-100",
                  isSidebarCollapsed && "justify-center"
                )}
                title={isSidebarCollapsed ? item.title : undefined}
              >
                {item.icon}
                {!isSidebarCollapsed && <span className="ml-3">{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t">
          <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between")}>
            <div className={cn("flex items-center", isSidebarCollapsed && "flex-col")}>
              <div className="h-8 w-8 rounded-full bg-bradesco-blue flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-2">
                  <div className="text-sm font-medium">{user?.name || "Usuário"}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role || "Cargo"}</div>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="text-gray-500 hover:text-red-500"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
          {isSidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="mt-2 text-gray-500 hover:text-red-500 w-full"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bradesco-gradient flex items-center justify-center">
                <span className="font-bold text-white">BE</span>
              </div>
              <span className="ml-2 font-bold">Bradesco Expresso</span>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
