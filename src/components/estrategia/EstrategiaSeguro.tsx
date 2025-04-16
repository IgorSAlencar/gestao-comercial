
import React from 'react';
import { EstrategiaCards } from './EstrategiaCards';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface EstrategiaSeguroProps {
  dados: any;
  loading: boolean;
}

const EstrategiaSeguro: React.FC<EstrategiaSeguroProps> = ({ dados, loading }) => {
  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  if (!dados) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const cardsData = [
    { 
      titulo: "Apólices Vendidas", 
      valor: dados.totais?.apolices_vendidas || 0,
      subtexto: "Total do período",
      color: "bg-green-500" 
    },
    { 
      titulo: "Prêmio Total", 
      valor: `R$ ${dados.totais?.premio_total.toLocaleString('pt-BR')}`,
      subtexto: "Em vendas",
      color: "bg-bradesco-blue" 
    },
    { 
      titulo: "Renovações", 
      valor: `${dados.totais?.taxa_renovacao || 0}%`,
      subtexto: "Taxa média",
      color: "bg-amber-500" 
    },
    { 
      titulo: "Meta Atingida", 
      valor: `${dados.totais?.meta_atingida || 0}%`,
      subtexto: "Do período",
      color: dados.totais?.meta_atingida >= 100 ? "bg-green-500" : "bg-red-500"
    }
  ];

  // Dados para o gráfico de evolução mensal
  const dadosMensais = dados.evolucao_mensal || [];

  return (
    <div className="space-y-8">
      <EstrategiaCards dados={cardsData} />

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Evolução Mensal de Vendas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dadosMensais}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="apolices" name="Apólices Vendidas" stroke="#0A59C0" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="meta" name="Meta" stroke="#F59E0B" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Distribuição por Tipo de Seguro</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dados.por_tipo}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" name="Quantidade" fill="#0A59C0" />
                <Bar dataKey="premio" name="Prêmio Total (R$)" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recomendações Estratégicas</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Focar em seguros com maior rentabilidade e baixa sinistralidade</li>
            <li>Implementar programa de fidelização para aumentar taxa de renovação</li>
            <li>Realizar campanhas específicas para produtos com menor penetração</li>
            <li>Treinar correspondentes sobre benefícios dos produtos de seguro</li>
            <li>Estabelecer metas específicas por região de acordo com o potencial</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaSeguro;
