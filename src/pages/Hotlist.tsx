
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const HotlistPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para a página de gestão de hotlist
    navigate("/hotlist/gestao");
    toast({
      title: "Redirecionando",
      description: "Você será redirecionado para o painel de gestão de Hotlist.",
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecionando para o painel de gestão de Hotlist...</p>
    </div>
  );
};

export default HotlistPage;
