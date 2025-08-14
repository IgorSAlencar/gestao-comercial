import React from "react";

import { Button } from "@/components/ui/button";
import { CreditCard, Users, Shield, MapPin, TrendingUp, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProdutoCardProps {
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  onClick: () => void;
  categoria: string;
}

const ProdutoCard = ({ titulo, descricao, icon, onClick, categoria }: ProdutoCardProps) => {
  return (
    <div 
      className="relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 h-[220px] group"
    >
      <div className="absolute top-4 left-4 px-2 py-1 text-xs font-medium rounded-md bg-gray-800/10">
        {categoria}
      </div>
      <div className="px-6 pt-14 pb-6 h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-gray-800/10 text-gray-700">
              {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gray-900">{titulo}</h3>
          </div>
          <p className="text-gray-600 text-sm">{descricao}</p>
        </div>
        <Button 
          onClick={onClick} 
          className="w-full bg-bradesco-blue hover:bg-bradesco-blue/90 text-white font-medium mt-3 transition-all duration-300"
        >
          Explorar
        </Button>
      </div>
    </div>
  );
};

const EstrategiaComercial: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectProduto = (produto: string) => {
    navigate(`/estrategia/${produto.toLowerCase().replace(/ /g, "-")}`);
  };

  const produtos = [
    {
      titulo: "Crédito",
      descricao: "Estratégias para aumento de vendas de produtos de crédito em sua região.",
      icon: <CreditCard size={24} />,
      categoria: "Produto",
      onClick: () => handleSelectProduto("credito")
    },
    {
      titulo: "Abertura de Conta",
      descricao: "Ações estratégicas para captação de novos clientes e contas.",
      icon: <Users size={24} />,
      categoria: "Produto",
      onClick: () => handleSelectProduto("abertura-conta")
    },
    {
      titulo: "Seguro",
      descricao: "Diretrizes para ampliação da base segurada e oportunidades de venda.",
      icon: <Shield size={24} />,
      categoria: "Produto",
      onClick: () => handleSelectProduto("seguro")
    },
    {
      titulo: "Pontos Ativos",
      descricao: "Análise de performance e estratégias para ativação de pontos comerciais.",
      icon: <MapPin size={24} />,
      categoria: "Monitoramento",
      onClick: () => navigate("/pontos-ativos")
    },
    {
      titulo: "Pontos com Negócios",
      descricao: "Monitoramento de pontos com transações ativas e estratégias de potencialização.",
      icon: <TrendingUp size={24} />,
      categoria: "Monitoramento",
      onClick: () => handleSelectProduto("pontos-realizando-negocio")
    },
    {
      titulo: "Pontos Bloqueados",
      descricao: "Identificação e estratégias de desbloqueio de pontos comerciais inativos.",
      icon: <Lock size={24} />,
      categoria: "Monitoramento",
      onClick: () => handleSelectProduto("pontos-bloqueados")
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Estratégia Comercial</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Selecione um produto para visualizar diretrizes estratégicas e oportunidades para sua região.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)] content-center">
          {produtos.map((produto, index) => (
            <ProdutoCard
              key={index}
              titulo={produto.titulo}
              descricao={produto.descricao}
              icon={produto.icon}
              categoria={produto.categoria}
              onClick={produto.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EstrategiaComercial;
