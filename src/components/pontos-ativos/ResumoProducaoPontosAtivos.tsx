import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, BarChart3, ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRelativeMonths } from "@/utils/formatDate";

type PontoAtivoMin = {
  mesM3: number;
  mesM2: number;
  mesM1: number;
  mesM0: number;
  situacao?: string;
};

interface ResumoProducaoPontosAtivosProps {
  dados: PontoAtivoMin[];
  onFiltrarPadrao?: (padrao: string) => void;
}

const ResumoProducaoPontosAtivos: React.FC<ResumoProducaoPontosAtivosProps> = ({ dados, onFiltrarPadrao }) => {
  const meses = getRelativeMonths();

  const formatInt = (num: number) => {
    const rounded = Math.round(num);
    return rounded >= 1000 ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(rounded) : rounded.toString();
  };
  const formatPct = (num: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(num);

  // Totais por mês (quantidade de pontos ativos)
  const totalM3 = dados.filter(d => d.mesM3 > 0).length;
  const totalM2 = dados.filter(d => d.mesM2 > 0).length;
  const totalM1 = dados.filter(d => d.mesM1 > 0).length;
  const totalM0 = dados.filter(d => d.mesM0 > 0).length;

  const totalGeral = dados.length || 1;
  const variacaoAbs = totalM0 - totalM1;
  const variacaoPct = ((totalM0 - totalM1) / (totalM1 || 1)) * 100;

  // Análise das estruturas (perdas/ganhos/manteve)
  const perda = dados.filter(d => {
    const s = (d.situacao || '').toUpperCase();
    const isPerdaStatus = ["BLOQUEADO", "ENCERRADO", "EQUIP_RETIRADA", "INOPERANTE"].includes(s);
    return isPerdaStatus && (d.mesM1 > 0 && d.mesM0 === 0);
  }).length;

  const ganho = dados.filter(d => {
    const s = (d.situacao || '').toUpperCase();
    const isGanhoStatus = ["REATIVAÇÃO", "CONTRATAÇÃO"].includes(s);
    return isGanhoStatus || (d.mesM1 === 0 && d.mesM0 > 0);
  }).length;

  const manteve = dados.filter(d => d.mesM1 > 0 && d.mesM0 > 0).length;

  // Padrões em 4 meses
  const oscilantes = dados.filter(d =>
    (d.mesM3 > 0 && d.mesM2 === 0 && d.mesM1 > 0 && d.mesM0 === 0) ||
    (d.mesM3 === 0 && d.mesM2 > 0 && d.mesM1 === 0 && d.mesM0 > 0)
  ).length;

  const recuperacao = dados.filter(d => d.mesM3 === 0 && d.mesM2 === 0 && d.mesM1 > 0 && d.mesM0 > 0).length;
  const emQueda = dados.filter(d => d.mesM3 > 0 && d.mesM2 > 0 && d.mesM1 === 0 && d.mesM0 === 0).length;

  // Sparkline simples entre M-1 e M0 (SVG)
  const sparkMax = Math.max(totalM1, totalM0, 1);
  const p1 = 8 + (1 - totalM1 / sparkMax) * 36; // y1
  const p2 = 8 + (1 - totalM0 / sparkMax) * 36; // y2

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resumo de Atividade</h3>
            <p className="text-sm text-gray-600">Panorama geral dos pontos ativos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Coluna Esquerda: Lojas Ativas + Comparativo */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Lojas ativas - compacto */}
              <div className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg border p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Lojas Ativas</h3>
                    <p className="text-xs text-gray-600">{meses.M0}</p>
                  </div>
                  <div className="p-1.5 rounded-full bg-blue-100 border border-blue-200">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-blue-600">{formatInt(totalM0)}</span>
                  <span className="text-xs text-gray-500">/ {formatInt(totalGeral)}</span>
                </div>
                <div className="bg-blue-100 rounded-md p-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700">Em relação ao total de ativos existentes desde {meses.M3}</span>
                    <span className="text-xs font-bold text-blue-800">{formatPct((totalM0 / totalGeral) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Comparativo histórico compacto */}
              <div className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg border p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Evolução Histórica</h3>
                    <p className="text-xs text-gray-600">{meses.M3} a {meses.M0}</p>
                  </div>
                  <div className={`p-1.5 rounded-full ${variacaoAbs >= 0 ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
                    {variacaoAbs >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
                
                {/* Grid histórico 4 meses */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  <div className="text-center p-1 bg-gray-100 rounded">
                    <div className="text-xs text-gray-500">{meses.M3.split('/')[0]}</div>
                    <div className="text-sm font-bold text-gray-700">{formatInt(totalM3)}</div>
                  </div>
                  <div className="text-center p-1 bg-gray-200 rounded">
                    <div className="text-xs text-gray-500">{meses.M2.split('/')[0]}</div>
                    <div className="text-sm font-bold text-gray-700">{formatInt(totalM2)}</div>
                  </div>
                  <div className="text-center p-1 bg-gray-300 rounded">
                    <div className="text-xs text-gray-500">{meses.M1.split('/')[0]}</div>
                    <div className="text-sm font-bold text-gray-700">{formatInt(totalM1)}</div>
                  </div>
                  <div className="text-center p-1 bg-gray-800 rounded">
                    <div className="text-xs text-gray-300">{meses.M0.split('/')[0]}</div>
                    <div className="text-sm font-bold text-white">{formatInt(totalM0)}</div>
                  </div>
                </div>

                {/* Variação compacta */}
                <div className={`p-1 rounded ${variacaoAbs >= 0 ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                  <div className="flex items-center gap-1">
                    {variacaoAbs >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs font-bold ${variacaoAbs >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {variacaoAbs >= 0 ? '+' : ''}{formatInt(variacaoAbs)} ({variacaoAbs >= 0 ? '+' : ''}{formatPct(variacaoPct)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divisor vertical */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="h-full w-px bg-gray-200 mx-auto" />
          </div>

          {/* Coluna Meio: Análise das Estruturas */}
          <div className="lg:col-span-3">
            <div className="text-sm font-semibold text-gray-800">Análise das Estruturas</div>
            <div className="text-xs text-gray-600 mb-3">De {meses.M1} a {meses.M0}</div>
            <div className="space-y-2">

              {/* Ganho */}
              <div className="bg-white p-3 rounded-lg border border-green-200 hover:bg-green-50 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-full border border-green-200">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Ganho</p>
                        <p className="text-xs text-gray-600">Inaugurados ou reativados</p>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">{formatInt(ganho)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manteve */}
              <div className="bg-white p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-full border border-blue-200">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Manteve</p>
                        <p className="text-xs text-gray-600">Permaneceram transacionando</p>
                      </div>
                      <div className="text-lg font-bold text-slate-800">{formatInt(manteve)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perda */}
              <div className="bg-white p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 p-2 rounded-full border border-red-200">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Perda</p>
                        <p className="text-xs text-gray-600">Encerrados/bloqueados ou inoperantes</p>
                      </div>
                      <div className="text-lg font-bold text-red-600">{formatInt(perda)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divisor vertical */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="h-full w-px bg-gray-200 mx-auto" />
          </div>

          {/* Coluna Direita: Comportamento 4 Meses */}
          <div className="lg:col-span-3">
            <div className="text-sm font-semibold text-gray-800">Comportamento dos últimos 4 Meses</div>
            <div className="text-xs text-gray-600 mb-3">De {meses.M3} a {meses.M0}</div>
            <div className="mt-3 space-y-2">



              {/* Recuperação - com tooltip e clique para filtrar */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div 
                      className="bg-white p-3 rounded-lg border border-green-200 cursor-pointer hover:bg-green-50 transition-all duration-200"
                      onClick={() => onFiltrarPadrao?.('recuperacao')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full border border-green-200">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">Recuperação</p>
                              <p className="text-xs text-gray-600">Excelente!</p>
                            </div>
                            <div className="text-lg font-bold text-green-800">{formatInt(recuperacao)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3 max-w-sm">
                    <p className="font-medium mb-2">Padrão de Recuperação:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Recuperaram atividade recentemente</li>
                      <li>• M3→M2→M1→M0: 0→0→1→1</li>
                      <li>• Indica retomada positiva da operação</li>
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-blue-600 font-medium">
                        💡 Clique para filtrar a tabela
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Oscilantes - com tooltip e clique para filtrar */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div 
                      className="bg-white p-3 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50 transition-all duration-200"
                      onClick={() => onFiltrarPadrao?.('oscilantes')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-amber-100 p-2 rounded-full border border-amber-200">
                          <BarChart3 className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">Oscilantes</p>
                              <p className="text-xs text-gray-600">Instável</p>
                            </div>
                            <div className="text-lg font-bold text-amber-800">{formatInt(oscilantes)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3 max-w-sm">
                    <p className="font-medium mb-2">Padrão Oscilante:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Alternam entre atividade e inatividade</li>
                      <li>• M3→M2→M1→M0: 1→0→1→0 ou 0→1→0→1</li>
                      <li>• Indica instabilidade na operação do ponto</li>
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-blue-600 font-medium">
                        💡 Clique para filtrar a tabela
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>


              {/* Em Queda - com tooltip e clique para filtrar */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div 
                      className="bg-white p-3 rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-all duration-200"
                      onClick={() => onFiltrarPadrao?.('emQueda')}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 p-2 rounded-full border border-red-200">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">Em Queda</p>
                              <p className="text-xs text-gray-600">Urgente!</p>
                            </div>
                            <div className="text-lg font-bold text-red-800">{formatInt(emQueda)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3 max-w-sm">
                    <p className="font-medium mb-2">Padrão de Queda:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Perderam atividade gradualmente</li>
                      <li>• M3→M2→M1→M0: 1→1→0→0</li>
                      <li>• Indica declínio progressivo na operação</li>
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-blue-600 font-medium">
                        💡 Clique para filtrar a tabela
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default ResumoProducaoPontosAtivos;
