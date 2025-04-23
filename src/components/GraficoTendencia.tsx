import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity, AlertTriangle, TrendingDown } from "lucide-react";
import { DadosLoja } from "@/types/loja";

interface GraficoTendenciaProps {
  dadosAnaliticos?: DadosLoja[];
  onTendenciaClick: (tendencia: string) => void;
}

const GraficoTendencia: React.FC<GraficoTendenciaProps> = ({ 
  dadosAnaliticos = [],
  onTendenciaClick 
}) => {
  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Tendência</CardTitle>
          <TrendingUp size={24} className="text-gray-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
            onClick={() => onTendenciaClick('comecando')}
          >
            <div className="bg-green-100 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Crescimento</p>
              <p className="text-xl font-semibold text-green-800">
                {dadosAnaliticos?.filter(loja => loja.tendencia === "comecando").length || 0}
              </p>
            </div>
          </div>
          <div 
            className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => onTendenciaClick('estavel')}
          >
            <div className="bg-blue-100 p-2 rounded-full">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estável</p>
              <p className="text-xl font-semibold text-blue-800">
                {dadosAnaliticos?.filter(loja => loja.tendencia === "estavel").length || 0}
              </p>
            </div>
          </div>
          <div 
            className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
            onClick={() => onTendenciaClick('atencao')}
          >
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Atenção</p>
              <p className="text-xl font-semibold text-amber-800">
                {dadosAnaliticos?.filter(loja => loja.tendencia === "atencao").length || 0}
              </p>
            </div>
          </div>
          <div 
            className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
            onClick={() => onTendenciaClick('queda')}
          >
            <div className="bg-red-100 p-2 rounded-full">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Queda</p>
              <p className="text-xl font-semibold text-red-800">
                {dadosAnaliticos?.filter(loja => loja.tendencia === "queda").length || 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraficoTendencia; 