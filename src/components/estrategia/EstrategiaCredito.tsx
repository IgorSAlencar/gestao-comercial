
import React from 'react';
import { EstrategiaCards } from './EstrategiaCards';
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface EstrategiaCreditoProps {
  dados: any;
  loading: boolean;
}

const EstrategiaCredito: React.FC<EstrategiaCreditoProps> = ({ dados, loading }) => {
  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  if (!dados) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const cardsData = [
    { 
      titulo: "Volume Total", 
      valor: `R$ ${dados.totais?.volume_total.toLocaleString('pt-BR')}`,
      subtexto: "Crédito concedido",
      color: "bg-green-500" 
    },
    { 
      titulo: "Operações", 
      valor: dados.totais?.total_operacoes || 0,
      subtexto: "Quantidade",
      color: "bg-bradesco-blue" 
    },
    { 
      titulo: "Ticket Médio", 
      valor: `R$ ${dados.totais?.ticket_medio.toLocaleString('pt-BR')}`,
      subtexto: "Por operação",
      color: "bg-amber-500" 
    },
    { 
      titulo: "Meta Atingida", 
      valor: `${dados.totais?.meta_atingida || 0}%`,
      subtexto: "Do volume previsto",
      color: dados.totais?.meta_atingida >= 100 ? "bg-green-500" : "bg-red-500"
    }
  ];

  const COLORS = ['#0A59C0', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

  const produtosData = dados.por_produto?.map((item: any, index: number) => ({
    name: item.produto,
    value: item.volume,
    color: COLORS[index % COLORS.length]
  })) || [];

  return (
    <div className="space-y-8">
      <EstrategiaCards dados={cardsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Distribuição por Produto</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={produtosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {produtosData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Recomendações Estratégicas</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Incentivar venda de produtos com maior rentabilidade</li>
              <li>Realizar campanhas específicas para produtos com menor desempenho</li>
              <li>Treinar correspondentes sobre políticas de crédito para aumentar aprovação</li>
              <li>Monitorar taxa de inadimplência por produto e região</li>
              <li>Criar estratégias para aumentar o ticket médio das operações</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstrategiaCredito;
