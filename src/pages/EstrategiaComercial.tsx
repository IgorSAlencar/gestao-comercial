
import React, { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProdutoCardProps {
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ titulo, descricao, icon, onClick }) => (
  <Card className="hover:shadow-lg transition-all duration-200">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center mb-2">
        <CardTitle>{titulo}</CardTitle>
        <div className="text-primary">{icon}</div>
      </div>
      <CardDescription>{descricao}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={onClick} className="w-full">Selecionar</Button>
    </CardContent>
  </Card>
);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
  );
};

export default EstrategiaComercial;
