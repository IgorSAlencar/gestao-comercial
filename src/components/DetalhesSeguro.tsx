import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DetalhesSeguro: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Grid principal com cards */}
      <div className="grid gap-4 grid-cols-1">
        {/* Card Campanha Ativa */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-indigo-800">Campanha Ativa</CardTitle>
                <p className="text-sm text-indigo-600 mt-1">Microsseguro Residencial</p>
              </div>
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                Até {format(new Date(new Date().setDate(new Date().getDate() + 15)), 'dd/MM', {locale: ptBR})}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-indigo-800">Promoção Proteção Familiar</h4>
                  <p className="text-sm text-gray-600">Seguro a partir de R$ 9,90/mês</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  Exclusivo BE
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Meta:</span> 5 seguros por correspondente
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Bônus:</span> Comissão extra de 2% para lojas que baterem a meta
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                variant="default" 
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => window.location.href = '/campanha-seguro'}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>

        
      </div>


    </div>
  );
};

export default DetalhesSeguro; 