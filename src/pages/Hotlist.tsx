
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { hotlistApi } from "@/services/api";

const HotlistPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se a API está acessível antes de redirecionar
    const checkApiConnection = async () => {
      try {
        // Tentativa de buscar leads da Hotlist
        await hotlistApi.getLeads();
        
        // Redirecionar para a página de gestão de hotlist
        navigate("/hotlist/gestao");
      } catch (error) {
        console.error("Erro ao conectar com a API Hotlist:", error);
        
        toast({
          title: "Problemas de conexão",
          description: "Não foi possível conectar ao serviço de Hotlist. Usando dados locais.",
          variant: "destructive",
        });
        
        // Mesmo com erro, ainda redirecionamos para gestão que usará dados locais
        navigate("/hotlist/gestao");
      }
    };
    
    checkApiConnection();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Verificando conexão com o serviço e redirecionando...</p>
    </div>
  );
};

export default HotlistPage;
