
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const HotlistPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar automaticamente para a página de visualização completa de hotlist
    navigate("/hotlist/all");
    toast({
      title: "Redirecionando",
      description: "Você será redirecionado para a visualização completa de Hotlist.",
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecionando para a visualização completa de Hotlist...</p>
    </div>
  );
};

export default HotlistPage;
