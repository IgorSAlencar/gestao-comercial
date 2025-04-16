
import React from 'react';
import { EstrategiaCards } from './EstrategiaCards';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EstrategiaPontosBloqueadosProps {
  dados: any;
  loading: boolean;
}

const EstrategiaPontosBloqueados: React.FC<EstrategiaPontosBloqueadosProps> = ({ dados, loading }) => {
  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  if (!dados) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const cardsData = [
    { 
      titulo: "Pontos Bloqueados", 
      valor: dados.totais?.pontos_bloqueados || 0,
      subtexto: "Total atual",
      color: "bg-red-500" 
    },
    { 
      titulo: "Meta de Reativação", 
      valor: dados.totais?.meta_reativacao || 0,
      subtexto: "Pontos",
      color: "bg-bradesco-blue" 
    },
    { 
      titulo: "Tempo Médio Bloqueio", 
      valor: `${dados.totais?.tempo_medio_dias || 0} dias`,
      subtexto: "Por ponto",
      color: "bg-amber-500" 
    },
    { 
      titulo: "Desbloqueados", 
      valor: dados.totais?.desbloqueados_mes || 0,
      subtexto: "Último mês",
      color: "bg-green-500"
    }
  ];

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];
  
  const motivosBloqueio = dados.motivos_bloqueio?.map((item: any, index: number) => ({
    name: item.motivo,
    value: item.quantidade,
    color: COLORS[index % COLORS.length]
  })) || [];

  // Pontos bloqueados por região
  const regiaoData = dados.por_regiao || [];

  return (
    <div className="space-y-8">
      <EstrategiaCards dados={cardsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Principais Motivos de Bloqueio</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={motivosBloqueio}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {motivosBloqueio.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Bloqueios por Região</h3>
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
                  <Bar dataKey="bloqueados" name="Pontos Bloqueados" fill="#EF4444" />
                  <Bar dataKey="meta_reativacao" name="Meta de Reativação" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Plano de Ação para Desbloqueio</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Estabelecer força-tarefa para resolução de pendências documentais</li>
            <li>Implementar processo de acompanhamento preventivo para evitar novos bloqueios</li>
            <li>Criar roteiro de visitas técnicas para solucionar problemas operacionais</li>
            <li>Oferecer treinamento específico para os principais motivos de bloqueio</li>
            <li>Desenvolver dashboard de acompanhamento com alertas para pontos em risco de bloqueio</li>
            <li>Estabelecer prazos máximos para resolução de cada tipo de bloqueio</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaPontosBloqueados;
