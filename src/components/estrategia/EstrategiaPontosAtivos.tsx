
import React from 'react';
import { EstrategiaCards } from './EstrategiaCards';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EstrategiaPontosAtivosProps {
  dados: any;
  loading: boolean;
}

const EstrategiaPontosAtivos: React.FC<EstrategiaPontosAtivosProps> = ({ dados, loading }) => {
  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  if (!dados) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const cardsData = [
    { 
      titulo: "Pontos Ativos", 
      valor: dados.totais?.pontos_ativos || 0,
      subtexto: "Total atual",
      color: "bg-green-500" 
    },
    { 
      titulo: "Meta de Ativação", 
      valor: dados.totais?.meta_ativacao || 0,
      subtexto: "Pontos",
      color: "bg-bradesco-blue" 
    },
    { 
      titulo: "Taxa de Ativação", 
      valor: `${dados.totais?.taxa_ativacao || 0}%`,
      subtexto: "Do total de pontos",
      color: "bg-amber-500" 
    },
    { 
      titulo: "Performance", 
      valor: `${dados.totais?.performance || 0}%`,
      subtexto: "Vs. meta",
      color: dados.totais?.performance >= 100 ? "bg-green-500" : "bg-red-500"
    }
  ];

  const COLORS = ['#0A59C0', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];
  
  const regiaoData = dados.por_regiao || [];

  const motivosInatividade = dados.motivos_inatividade?.map((item: any, index: number) => ({
    name: item.motivo,
    value: item.quantidade,
    color: COLORS[index % COLORS.length]
  })) || [];

  return (
    <div className="space-y-8">
      <EstrategiaCards dados={cardsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Pontos Ativos por Região</h3>
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
                  <XAxis dataKey="regiao" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ativos" name="Pontos Ativos" fill="#0A59C0" />
                  <Bar dataKey="meta" name="Meta" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Principais Motivos de Inatividade</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={motivosInatividade}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {motivosInatividade.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recomendações Estratégicas</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Implementar programa de recuperação de pontos inativos</li>
            <li>Realizar visitas técnicas em regiões com baixa taxa de ativação</li>
            <li>Oferecer treinamento específico para solucionar principais causas de inatividade</li>
            <li>Criar incentivos para correspondentes que mantenham pontos ativos consecutivamente</li>
            <li>Estabelecer protocolos de monitoramento contínuo da saúde dos pontos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaPontosAtivos;
