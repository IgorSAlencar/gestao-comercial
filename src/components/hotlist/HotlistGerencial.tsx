import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HotListItem } from '@/services/api';
import { Users, CheckCircle2, AlertCircle, TrendingUp, BarChart3, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';

// Função para formatação contábil
const formatarNumero = (numero: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numero);
};

// Função para calcular porcentagem
const calcularPorcentagem = (valor: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((valor / total) * 100).toFixed(1)}%`;
};

interface HotlistGerencialProps {
  dados: HotListItem[];
  onSupervisorClick: (supervisorId: string) => void;
  onClearFilter: () => void;
  supervisorSelecionado: string | null;
}

interface SupervisorMetrics {
  id: string;
  nome: string;
  total: number;
  pendentes: number;
  tratadas: number;
  realizar: number;
  desempenho: number;
}

const HotlistGerencial: React.FC<HotlistGerencialProps> = ({ 
  dados, 
  onSupervisorClick, 
  onClearFilter,
  supervisorSelecionado 
}) => {
  const metricas = useMemo(() => {
    // Agrupar dados por supervisor
    const supervisores = dados.reduce((acc, item) => {
      const supervisorId = item.supervisor_id;
      if (!acc[supervisorId]) {
        acc[supervisorId] = {
          id: supervisorId,
          nome: item.supervisor_name,
          total: 0,
          pendentes: 0,
          tratadas: 0,
          realizar: 0,
          desempenho: 0
        };
      }
      
      acc[supervisorId].total += 1;
      switch (item.situacao) {
        case 'pendente':
          acc[supervisorId].pendentes += 1;
          break;
        case 'tratada':
          acc[supervisorId].tratadas += 1;
          break;
        case 'realizar':
          acc[supervisorId].realizar += 1;
          break;
      }
      
      return acc;
    }, {} as Record<string, SupervisorMetrics>);

    // Calcular desempenho (% de leads tratados)
    Object.values(supervisores).forEach(supervisor => {
      supervisor.desempenho = supervisor.total > 0 
        ? (supervisor.tratadas / supervisor.total) * 100 
        : 0;
    });

    return Object.values(supervisores);
  }, [dados]);

  // Métricas gerais
  const totalSupervisores = metricas.length;
  const supervisoresComPendentes = metricas.filter(s => s.pendentes > 0).length;
  const supervisoresComTratadas = metricas.filter(s => s.tratadas > 0).length;
  const supervisoresComRealizar = metricas.filter(s => s.realizar > 0).length;
  const mediaDesempenho = metricas.reduce((acc, curr) => acc + curr.desempenho, 0) / totalSupervisores;

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Painel Gerencial</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-6">
          {/* Cards de métricas gerais */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-blue-900">Total Supervisores</CardTitle>
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-blue-900">{formatarNumero(totalSupervisores)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-amber-900">Com Pendentes</CardTitle>
                  <div className="p-2 bg-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-amber-900">{formatarNumero(supervisoresComPendentes)}</p>
                  <p className="text-sm text-amber-700">{calcularPorcentagem(supervisoresComPendentes, totalSupervisores)} dos supervisores</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-green-900">Com Tratadas</CardTitle>
                  <div className="p-2 bg-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-green-900">{formatarNumero(supervisoresComTratadas)}</p>
                  <p className="text-sm text-green-700">{calcularPorcentagem(supervisoresComTratadas, totalSupervisores)} dos supervisores</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-purple-900">Com Realizar</CardTitle>
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-purple-900">{formatarNumero(supervisoresComRealizar)}</p>
                  <p className="text-sm text-purple-700">{calcularPorcentagem(supervisoresComRealizar, totalSupervisores)} dos supervisores</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-indigo-900">Média Desempenho</CardTitle>
                  <div className="p-2 bg-indigo-200 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-indigo-700" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-indigo-900">{mediaDesempenho.toFixed(1)}%</p>
                  <p className="text-sm text-indigo-700">Média de tratativas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de métricas por supervisor */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Desempenho por Supervisor</CardTitle>
                {supervisorSelecionado && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearFilter}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtro
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supervisor</TableHead>
                    <TableHead className="text-right">Total Leads</TableHead>
                    <TableHead className="text-right">Pendentes</TableHead>
                    <TableHead className="text-right">Tratadas</TableHead>
                    <TableHead className="text-right">Realizar</TableHead>
                    <TableHead className="text-right">Desempenho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricas
                    .sort((a, b) => b.desempenho - a.desempenho)
                    .map((supervisor) => (
                      <TableRow 
                        key={supervisor.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          supervisor.id === supervisorSelecionado ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => onSupervisorClick(supervisor.id)}
                      >
                        <TableCell className="font-medium hover:text-blue-600">
                          {supervisor.nome}
                        </TableCell>
                        <TableCell className="text-right">{formatarNumero(supervisor.total)}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-amber-600">{formatarNumero(supervisor.pendentes)}</span>
                          <span className="text-gray-500 text-xs ml-1">({calcularPorcentagem(supervisor.pendentes, supervisor.total)})</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600">{formatarNumero(supervisor.tratadas)}</span>
                          <span className="text-gray-500 text-xs ml-1">({calcularPorcentagem(supervisor.tratadas, supervisor.total)})</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-purple-600">{formatarNumero(supervisor.realizar)}</span>
                          <span className="text-gray-500 text-xs ml-1">({calcularPorcentagem(supervisor.realizar, supervisor.total)})</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            supervisor.desempenho >= 70 ? 'text-green-600' :
                            supervisor.desempenho >= 40 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {supervisor.desempenho.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default HotlistGerencial; 