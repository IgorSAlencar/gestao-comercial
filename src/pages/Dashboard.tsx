
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const statusData = [
  {
    name: "Jan",
    novos: 65,
    emContato: 45,
    convertidos: 12,
  },
  {
    name: "Fev",
    novos: 59,
    emContato: 49,
    convertidos: 18,
  },
  {
    name: "Mar",
    novos: 80,
    emContato: 55,
    convertidos: 22,
  },
  {
    name: "Abr",
    novos: 78,
    emContato: 60,
    convertidos: 27,
  },
  {
    name: "Mai",
    novos: 82,
    emContato: 63,
    convertidos: 30,
  },
  {
    name: "Jun",
    novos: 72,
    emContato: 58,
    convertidos: 35,
  },
];

const produtosData = [
  { name: "Cartões", value: 45 },
  { name: "Empréstimos", value: 28 },
  { name: "Seguros", value: 17 },
  { name: "Outros", value: 10 },
];

const COLORS = ["#0033A0", "#3358B4", "#6684C9", "#99AFDD"];

const produtividadeData = [
  {
    name: "Semana 1",
    realizadas: 8,
    planejadas: 10,
  },
  {
    name: "Semana 2",
    realizadas: 12,
    planejadas: 12,
  },
  {
    name: "Semana 3",
    realizadas: 9,
    planejadas: 12,
  },
  {
    name: "Semana 4",
    realizadas: 7,
    planejadas: 8,
  },
];

const DashboardPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">127</div>
            <div className="text-sm text-gray-500">Leads Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">45</div>
            <div className="text-sm text-gray-500">Em Negociação</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">32</div>
            <div className="text-sm text-gray-500">Convertidos (Mês)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">85%</div>
            <div className="text-sm text-gray-500">Meta Mensal</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Histórico de Leads por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={statusData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="novos" fill="#0033A0" name="Novos" />
                <Bar dataKey="emContato" fill="#6684C9" name="Em Contato" />
                <Bar dataKey="convertidos" fill="#CC092F" name="Convertidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={produtosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {produtosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Visitas vs. Planejamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={produtividadeData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planejadas" fill="#6684C9" name="Visitas Planejadas" />
                <Bar dataKey="realizadas" fill="#0033A0" name="Visitas Realizadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Metas e Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 py-2">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Novos Leads</div>
                  <div className="font-medium">82 / 100</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" style={{ width: "82%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Leads Convertidos</div>
                  <div className="font-medium">32 / 50</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" style={{ width: "64%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Visitas Realizadas</div>
                  <div className="font-medium">36 / 40</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" style={{ width: "90%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Cross-Selling</div>
                  <div className="font-medium">18 / 30</div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-bradesco-blue" style={{ width: "60%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
