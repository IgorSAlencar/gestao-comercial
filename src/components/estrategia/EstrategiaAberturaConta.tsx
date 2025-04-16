
import React from 'react';
import { EstrategiaCards } from './EstrategiaCards';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EstrategiaAberturaContaProps {
  dados: any;
  loading: boolean;
}

const EstrategiaAberturaConta: React.FC<EstrategiaAberturaContaProps> = ({ dados, loading }) => {
  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  if (!dados) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const cardsData = [
    { 
      titulo: "Contas Abertas", 
      valor: dados.totais?.contas_abertas || 0,
      subtexto: "Total do último mês",
      color: "bg-green-500" 
    },
    { 
      titulo: "Meta Mensal", 
      valor: dados.totais?.meta_mensal || 0,
      subtexto: "Contas",
      color: "bg-bradesco-blue" 
    },
    { 
      titulo: "Efetivação", 
      valor: `${dados.totais?.taxa_efetivacao || 0}%`,
      subtexto: "Taxa média",
      color: "bg-amber-500" 
    },
    { 
      titulo: "Performance", 
      valor: `${dados.totais?.performance || 0}%`,
      subtexto: "Vs. meta mensal",
      color: dados.totais?.performance >= 100 ? "bg-green-500" : "bg-red-500"
    }
  ];

  const regiaoData = dados.por_regiao?.map((item: any) => ({
    name: item.regiao,
    contas: item.contas_abertas,
    meta: item.meta
  })) || [];

  return (
    <div className="space-y-8">
      <EstrategiaCards dados={cardsData} />

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Abertura de Contas por Região</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regiaoData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contas" name="Contas Abertas" fill="#0A59C0" />
                <Bar dataKey="meta" name="Meta" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recomendações Estratégicas</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Focar em ações de captação em regiões com menor desempenho</li>
            <li>Implementar programa de incentivo para correspondentes com alta taxa de efetivação</li>
            <li>Realizar treinamentos sobre processo de abertura de conta e documentação necessária</li>
            <li>Monitorar a qualidade das contas abertas para reduzir cancelamentos nos primeiros 90 dias</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaAberturaConta;
