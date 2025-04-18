
import React from "react";

import { Button } from "@/components/ui/button";
import { CreditCard, Users, Shield, MapPin, TrendingUp, Lock } from "lucide-react";
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
          <div className="space-y-6 max-w-6xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              <ProdutoCard
                titulo="Crédito"
                descricao="Estratégias para aumento de vendas de produtos de crédito em sua região."
                icon={<CreditCard size={25} />}
                onClick={() => handleSelectProduto("credito")}
              />
              
              <ProdutoCard
                titulo="Abertura de Conta"
                descricao="Ações estratégicas para captação de novos clientes e contas."
                icon={<Users size={25} />}
                onClick={() => handleSelectProduto("abertura-conta")}
              />
              
              <ProdutoCard
                titulo="Seguro"
                descricao="Diretrizes para ampliação da base segurada e oportunidades de venda."
                icon={<Shield size={25} />}
                onClick={() => handleSelectProduto("seguro")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProdutoCard
                titulo="Pontos Ativos"
                descricao="Análise de performance e estratégias para ativação de pontos comerciais."
                icon={<MapPin size={25} />}
                onClick={() => handleSelectProduto("pontos-ativos")}
              />

              <ProdutoCard
                titulo="Pontos Realizando Negócio"
                descricao="Monitoramento de pontos com transações ativas e estratégias de potencialização."
                icon={<TrendingUp size={25} />}
                onClick={() => handleSelectProduto("pontos-realizando-negocio")}
              />

              <ProdutoCard
                titulo="Pontos Bloqueados"
                descricao="Identificação e estratégias de desbloqueio de pontos comerciais inativos."
                icon={<Lock size={25} />}
                onClick={() => handleSelectProduto("pontos-bloqueados")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstrategiaComercial;
