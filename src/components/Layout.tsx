import React, { useState } from "react";
import { 
  Calendar, 
  ClipboardList, 
  MapPin, 
  BarChart3,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  FileX,
  Users
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import HierarchyViewer from "./HierarchyViewer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const navItems = [
    {
      title: "Agenda",
      icon: <Calendar className="h-5 w-5" />,
      path: "/agenda",
    },
    {
      title: "Hotlist",
      icon: <ClipboardList className="h-5 w-5" />,
      path: "/hotlist",
    },
    {
      title: "Oportunidades",
      icon: <MapPin className="h-5 w-5" />,
      path: "/oportunidades",
    },
    {
      title: "Estratégia Comercial",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/estrategia-comercial",
    },
    {
      title: "Correspondentes Bloqueados",
      icon: <FileX className="h-5 w-5" />,
      path: "/correspondentes-bloqueados",
    },
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
          {!isSidebarCollapsed && <HierarchyViewer />}
          
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
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
