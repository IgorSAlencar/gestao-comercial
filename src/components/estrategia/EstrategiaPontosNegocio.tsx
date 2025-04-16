
import React from 'react';
import { EstrategiaCards } from './EstrategiaCards';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface EstrategiaPontosNegocioProps {
  dados: any;
  loading: boolean;
}

const EstrategiaPontosNegocio: React.FC<EstrategiaPontosNegocioProps> = ({ dados, loading }) => {
  if (loading) {
    return <div className="text-center py-10">Carregando dados...</div>;
  }

  if (!dados) {
    return <div className="text-center py-10">Nenhum dado disponível</div>;
  }

  const cardsData = [
    { 
      titulo: "Pontos com Negócios", 
      valor: dados.totais?.pontos_com_negocio || 0,
      subtexto: "No último mês",
      color: "bg-green-500" 
    },
    { 
      titulo: "Meta de Pontos", 
      valor: dados.totais?.meta_pontos || 0,
      subtexto: "Com negócios",
      color: "bg-bradesco-blue" 
    },
    { 
      titulo: "Negócios Médios", 
      valor: dados.totais?.negocios_medio || 0,
      subtexto: "Por ponto",
      color: "bg-amber-500" 
    },
    { 
      titulo: "Performance", 
      valor: `${dados.totais?.performance || 0}%`,
      subtexto: "Vs. meta",
      color: dados.totais?.performance >= 100 ? "bg-green-500" : "bg-red-500"
    }
  ];

  // Dados para o gráfico de evolução mensal
  const evolucaoMensal = dados.evolucao_mensal || [];
  
  // Dados para o gráfico de distribuição por produto
  const distribuicaoProduto = dados.distribuicao_produto || [];

  return (
    <div className="space-y-8">
      <EstrategiaCards dados={cardsData} />

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Evolução Mensal de Pontos com Negócios</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolucaoMensal}
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
                <Line type="monotone" dataKey="pontos" name="Pontos com Negócios" stroke="#0A59C0" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="meta" name="Meta" stroke="#F59E0B" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Distribuição de Negócios por Produto</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribuicaoProduto}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="produto" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" name="Quantidade de Negócios" fill="#0A59C0" />
                <Bar dataKey="pontos" name="Pontos com Negócios" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recomendações Estratégicas</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>Identificar pontos ativos sem negócios e realizar ações específicas</li>
            <li>Criar programa de incentivo para primeiro negócio em pontos novos</li>
            <li>Implementar treinamentos específicos para produtos com menor penetração</li>
            <li>Realizar campanhas regionais para estimular negócios em áreas com menor desempenho</li>
            <li>Estabelecer metas progressivas de negócios por ponto</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstrategiaPontosNegocio;
