import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DetalhesCredito: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Grid principal com cards */}
      <div className="grid gap-4 grid-cols-1">        {/* Card Prioridades do Mês */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-green-800">Prioridades do Mês</CardTitle>
                <p className="text-sm text-green-600 mt-1">Crédito Pessoal e Consignado</p>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {format(new Date(), 'MMM/yyyy', {locale: ptBR})}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-800">Loja Shopping Vila Olímpia</h4>
                  <p className="text-sm text-gray-600">Chave: 5002 - Ag: 0002</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Alta Conversão
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Oportunidade:</span> Potencial de 25 contratos de crédito consignado
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Público:</span> Funcionários da empresa ABC Ltda.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => window.location.href = '/propostas-credito'}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Ver Propostas
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>

      
    </div>
  );
};

export default DetalhesCredito; 