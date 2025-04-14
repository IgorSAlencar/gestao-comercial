import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreditCard, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProdutoCardProps {
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ProdutoCard = ({ titulo, descricao, icon, onClick }: ProdutoCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col h-[220px] justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold">{titulo}</h3>
        </div>
        <p className="text-gray-600 text-sm">{descricao}</p>
      </div>
      <Button 
        onClick={onClick} 
        className="w-full bg-bradesco-blue hover:bg-bradesco-blue/90 mt-3"
      >
        Selecionar
      </Button>
    </div>
  );
};

const EstrategiaComercial: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectProduto = (produto: string) => {
    navigate(`/estrategia/${produto.toLowerCase().replace(/ /g, "-")}`);
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Estratégia Comercial</h1>
          <p className="text-gray-500">
            Selecione um produto para visualizar diretrizes estratégicas e oportunidades para sua região.
          </p>
        </div>

        <div className="flex justify-center items-center mt-6 min-h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <ProdutoCard
              titulo="Crédito"
              descricao="Estratégias para aumento de vendas de produtos de crédito em sua região."
              icon={<CreditCard size={32} />}
              onClick={() => handleSelectProduto("credito")}
            />
            
            <ProdutoCard
              titulo="Abertura de Conta"
              descricao="Ações estratégicas para captação de novos clientes e contas."
              icon={<Users size={32} />}
              onClick={() => handleSelectProduto("abertura-conta")}
            />
            
            <ProdutoCard
              titulo="Seguro"
              descricao="Diretrizes para ampliação da base segurada e oportunidades de venda."
              icon={<Shield size={32} />}
              onClick={() => handleSelectProduto("seguro")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstrategiaComercial;
