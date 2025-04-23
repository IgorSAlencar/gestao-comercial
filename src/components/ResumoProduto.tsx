import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, ChartBar, Info } from "lucide-react";
import { DadosLoja } from "@/types/loja";

interface ResumoProdutoProps {
  produto: string;
  dadosAnaliticos?: DadosLoja[];
}

const ResumoProduto: React.FC<ResumoProdutoProps> = ({ produto, dadosAnaliticos }) => {
  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            {produto === "abertura-conta" && (
              <>
                <CardTitle className="text-lg">Lojas Sem Abertura</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Lojas ativas sem movimentação de contas</p>
              </>
            )}
            {produto === "credito" && (
              <>
                <CardTitle className="text-lg">Oportunidades de Crédito</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Correspondentes sem propostas no mês</p>
              </>
            )}
            {produto === "seguro" && (
              <>
                <CardTitle className="text-lg">Lojas com Potencial</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Correspondentes qualificados para seguros</p>
              </>
            )}
          </div>
          {produto === "abertura-conta" && <AlertTriangle size={24} className="text-gray-500" />}
          {produto === "credito" && <ChartBar size={24} className="text-gray-500" />}
          {produto === "seguro" && <Info size={24} className="text-gray-500" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                {produto === "abertura-conta" && (
                  <>
                    <h4 className="font-semibold text-gray-800">Análise de Inatividade</h4>
                    <p className="text-sm text-gray-600">Identificação de lojas que precisam de atenção</p>
                  </>
                )}
                {produto === "credito" && (
                  <>
                    <h4 className="font-semibold text-gray-800">Avaliação de Público-Alvo</h4>
                    <p className="text-sm text-gray-600">Lojas com potencial para ofertas de crédito</p>
                  </>
                )}
                {produto === "seguro" && (
                  <>
                    <h4 className="font-semibold text-gray-800">Correspondentes Certificados</h4>
                    <p className="text-sm text-gray-600">Multiplicadores treinados em produtos de seguros</p>
                  </>
                )}
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {produto === "abertura-conta" && (
                  <>
                    {dadosAnaliticos?.filter(loja => 
                      loja.situacao === "ativa" && 
                      loja.mesM0 === 0 && 
                      loja.mesM1 === 0 && 
                      loja.mesM2 === 0 && 
                      loja.mesM3 === 0
                    ).length || 0} Lojas
                  </>
                )}
                {produto === "credito" && (
                  <>
                    {dadosAnaliticos?.filter(loja => 
                      loja.situacao === "ativa" && 
                      loja.produtosHabilitados?.consignado === true
                    ).length || 0} Lojas
                  </>
                )}
                {produto === "seguro" && (
                  <>
                    {dadosAnaliticos?.filter(loja => 
                      loja.situacao === "ativa" && 
                      loja.produtosHabilitados?.microsseguro === true
                    ).length || 0} Lojas
                  </>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                {produto === "abertura-conta" && (
                  <>
                    <span className="font-medium">Situação:</span> Lojas ativas sem movimentação nos últimos 4 meses
                  </>
                )}
                {produto === "credito" && (
                  <>
                    <span className="font-medium">Oportunidade:</span> Correspondentes com produto habilitado sem propostas recentes
                  </>
                )}
                {produto === "seguro" && (
                  <>
                    <span className="font-medium">Destaque:</span> Correspondentes aptos a oferecer microsseguros e proteção residencial
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="default" 
              size="sm"
              className={`
                ${produto === "abertura-conta" ? "bg-gray-600 hover:bg-gray-700" : ""} 
                ${produto === "credito" ? "bg-green-600 hover:bg-green-700" : ""}
                ${produto === "seguro" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              `}
              onClick={() => window.location.href = produto === "abertura-conta" 
                ? '/analise-inatividade' 
                : produto === "credito" 
                  ? '/oportunidades-credito' 
                  : '/potencial-seguros'
              }
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {produto === "abertura-conta" && "Ver Análise Detalhada"}
              {produto === "credito" && "Explorar Oportunidades"}
              {produto === "seguro" && "Ver Correspondentes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumoProduto; 