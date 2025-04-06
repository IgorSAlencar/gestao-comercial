
import React from "react";
import { 
  Calendar, 
  ClipboardList, 
  MapPin, 
  ChartBar,
  User
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
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
      title: "Dashboard",
      icon: <ChartBar className="h-5 w-5" />,
      path: "/dashboard",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white border-r">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bradesco-gradient flex items-center justify-center">
              <span className="font-bold text-white">BE</span>
            </div>
            <span className="ml-2 font-bold text-lg">Bradesco Expresso</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Gestão Comercial</div>
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-bradesco-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-bradesco-blue flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">João Silva</div>
              <div className="text-xs text-gray-500">Supervisor Regional</div>
            </div>
          </div>
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
            {/* Mobile menu button would go here */}
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
