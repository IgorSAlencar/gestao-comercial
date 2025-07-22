import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity, AlertTriangle, TrendingDown, Target, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight, Minus, Info, Download } from "lucide-react";
import { DadosLoja } from "@/shared/types/lead";
import { getRelativeMonths } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import AnaliseEvolucaoModal from "./AnaliseEvolucaoModal";

interface GraficoTendenciaProps {
  dadosAnaliticos?: DadosLoja[];
  onTendenciaClick: (tendencia: string) => void;
  onZeradosClick?: () => void;
}

const GraficoTendencia: React.FC<GraficoTendenciaProps> = ({ 
  dadosAnaliticos = [],
  onTendenciaClick,
  onZeradosClick
}) => {
  const [showAnaliseDetalhada, setShowAnaliseDetalhada] = useState(false);

  const mesesFormatados = getRelativeMonths();

  // Função para formatação contábil
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Função para formatação de porcentagem
  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(num);
  };

  // Calcular métricas
  const totalContasM0 = dadosAnaliticos.reduce((sum, loja) => sum + (loja.mesM0 || 0), 0);
  const totalContasM1 = dadosAnaliticos.reduce((sum, loja) => sum + (loja.mesM1 || 0), 0);
  
  const lojasQueProduziraM0 = dadosAnaliticos.filter(loja => (loja.mesM0 || 0) > 0);
  const lojasQueProduziraM1 = dadosAnaliticos.filter(loja => (loja.mesM1 || 0) > 0);
  
  // Análise detalhada
  const lojasQueZeraram = dadosAnaliticos.filter(loja => 
    (loja.mesM1 || 0) > 0 && (loja.mesM0 || 0) === 0
  );
  
  const lojasNovas = dadosAnaliticos.filter(loja => 
    (loja.mesM1 || 0) === 0 && (loja.mesM0 || 0) > 0
  );
  
  const lojasQueVoltaram = dadosAnaliticos.filter(loja => 
    (loja.mesM2 || 0) > 0 && (loja.mesM1 || 0) === 0 && (loja.mesM0 || 0) > 0
  );

  const lojasEstaveisAtivas = dadosAnaliticos.filter(loja => 
    (loja.mesM1 || 0) > 0 && (loja.mesM0 || 0) > 0
  );

  const crescimento = ((totalContasM0 - totalContasM1) / (totalContasM1 || 1)) * 100;
  const produtividadeGeral = dadosAnaliticos.length > 0 ? (lojasQueProduziraM0.length / dadosAnaliticos.length) * 100 : 0;

  const tendencias = {
    comecando: dadosAnaliticos.filter(loja => loja.tendencia === "comecando").length,
    estavel: dadosAnaliticos.filter(loja => loja.tendencia === "estavel").length,
    atencao: dadosAnaliticos.filter(loja => loja.tendencia === "atencao").length,
    queda: dadosAnaliticos.filter(loja => loja.tendencia === "queda").length
  };

  // Função para exportar análise geral para Excel
  const exportarAnaliseGeral = () => {
    const workbook = XLSX.utils.book_new();
    
    // Aba: Resumo Geral
    const resumoData = [
      ['Métrica', 'Valor', 'Descrição'],
      ['Total de Contas - ' + mesesFormatados.M0, totalContasM0, 'Total de contas no mês atual'],
      ['Total de Contas - ' + mesesFormatados.M1, totalContasM1, 'Total de contas no mês anterior'],
      ['Variação de Contas', totalContasM0 - totalContasM1, 'Diferença entre os meses'],
      ['% de Crescimento', formatPercent(crescimento) + '%', 'Percentual de variação'],
      ['Lojas Ativas - ' + mesesFormatados.M0, lojasQueProduziraM0.length, 'Lojas com produção no mês atual'],
      ['Lojas Ativas - ' + mesesFormatados.M1, lojasQueProduziraM1.length, 'Lojas com produção no mês anterior'],
      ['Produtividade Geral', formatPercent(produtividadeGeral) + '%', 'Percentual de lojas ativas'],
      ['Lojas que Zeraram', lojasQueZeraram.length, 'Lojas que tinham produção e zeraram'],
      ['Lojas Novas', lojasNovas.length, 'Lojas com primeira produção'],
      ['Lojas que Voltaram', lojasQueVoltaram.length, 'Lojas que retomaram produção'],
      ['Lojas Estáveis', lojasEstaveisAtivas.length, 'Lojas que mantiveram produção'],
    ];
    
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo Geral");

    // Salvar arquivo
    const nomeArquivo = `Resumo_Evolução_${mesesFormatados.M1}_${mesesFormatados.M0}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
  };

  return (
    <div className="flex flex-col min-h-0 space-y-4">
      {/* Card Principal - Resumo Executivo */}
      <Card className="flex-none">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Resumo Executivo
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarAnaliseGeral}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold text-gray-900">Total Contas {mesesFormatados.M0}</CardTitle>
                  <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <p className="text-2xl font-bold text-blue-800">{formatNumber(totalContasM0)}</p>
                  <div className={`text-xs flex items-center gap-1 mt-1 ${crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {crescimento >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {formatPercent(Math.abs(crescimento))}% vs {mesesFormatados.M1}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold text-gray-900">Lojas Ativas</CardTitle>
                  <div className="p-2 rounded-full bg-green-50 border border-green-100">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <p className="text-2xl font-bold text-green-800">{formatNumber(lojasQueProduziraM0.length)}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatPercent(produtividadeGeral)}% do total</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold text-gray-900">Zeraram {mesesFormatados.M1}→{mesesFormatados.M0}</CardTitle>
                  <div className="p-2 rounded-full bg-amber-50 border border-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <p className="text-2xl font-bold text-amber-800">{formatNumber(lojasQueZeraram.length)}</p>
                  <p className="text-xs text-gray-600 mt-1">Requer atenção</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold text-gray-900">Total Lojas</CardTitle>
                  <div className="p-2 rounded-full bg-purple-50 border border-purple-100">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <p className="text-2xl font-bold text-purple-800">{formatNumber(dadosAnaliticos.length)}</p>
                  <p className="text-xs text-gray-600 mt-1">Na estratégia</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-none">
        {/* Card Performance & Evolução Unificado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Performance & Evolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Indicadores de Evolução */}
              <div 
                className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50/70 transition-all duration-200"
                onClick={() => setShowAnaliseDetalhada(true)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Evolução de Contas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${crescimento >= 0 ? 'text-green-600' : 'text-red-600'} font-bold text-lg`}>
                      {crescimento >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      {formatPercent(Math.abs(crescimento))}%
                    </div>
                    <Info className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Variação Total */}
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 mb-1">Variação Total</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-blue-800">
                        {totalContasM0 - totalContasM1 >= 0 ? '+' : ''}{formatNumber(totalContasM0 - totalContasM1)}
                      </span>
                      <span className="text-sm text-blue-600">contas</span>
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {mesesFormatados.M1} → {mesesFormatados.M0}
                    </div>
                  </div>

                  {/* Comparativo de Lojas Ativas */}
                  <div className="bg-white p-3 rounded-lg border border-green-100">
                    <div className="text-sm text-green-600 mb-1">Lojas com Produção</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">{mesesFormatados.M1}</div>
                        <div className="text-lg font-bold text-green-800">{formatNumber(lojasQueProduziraM1.length)}</div>
                      </div>
                      <div className="text-xl font-bold text-gray-300">→</div>
                      <div>
                        <div className="text-sm text-gray-600">{mesesFormatados.M0}</div>
                        <div className="text-lg font-bold text-green-800">{formatNumber(lojasQueProduziraM0.length)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              {/* Indicadores de Performance */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Performance Atual</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {formatPercent(produtividadeGeral)}%
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">
                        Produtividade Geral
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {formatNumber(lojasQueProduziraM0.length)}/{formatNumber(dadosAnaliticos.length)} lojas
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-green-100">
                    <div
                      style={{ width: `${produtividadeGeral}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Detalhamento */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg border border-green-100">
                    <div className="text-sm text-green-600">Lojas Ativas</div>
                    <div className="text-xl font-bold text-green-800">{formatNumber(lojasQueProduziraM0.length)}</div>
                    <div className="text-xs text-green-500">{mesesFormatados.M0}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600">Média por Loja</div>
                    <div className="text-xl font-bold text-blue-800">
                      {formatNumber(Math.round(totalContasM0 / (lojasQueProduziraM0.length || 1)))}
                    </div>
                    <div className="text-xs text-blue-500">contas/loja</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Atenção */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Card de Lojas que Zeraram */}
              <div 
                className="bg-gradient-to-r from-amber-50 to-red-50 p-4 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors duration-200"
                onClick={onZeradosClick}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-800">Lojas que Zeraram</span>
                  </div>
                  <div className="text-lg font-bold text-amber-800">
                    {formatNumber(lojasQueZeraram.length)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-600">Período</div>
                    <div className="text-base font-semibold text-amber-800">
                      {mesesFormatados.M1} → {mesesFormatados.M0}
                    </div>
                    <div className="text-xs text-amber-500">Clique para filtrar</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-100">
                    <div className="text-sm text-amber-600">Impacto</div>
                    <div className="text-base font-semibold text-amber-800">
                      {formatPercent(dadosAnaliticos.length > 0 ? ((lojasQueZeraram.length / dadosAnaliticos.length) * 100) : 0)}%
                    </div>
                    <div className="text-xs text-amber-500">do total de lojas</div>
                  </div>
                </div>

                {lojasQueZeraram.length > 0 && (
                  <div className="mt-4 text-sm text-amber-800 bg-amber-100 p-3 rounded-lg border border-amber-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>Essas lojas precisam de acompanhamento especial para recuperação</span>
                  </div>
                )}
              </div>

              {/* Outros Indicadores de Atenção */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Indicadores de Atenção</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-600">Queda na Produção</span>
                      <span className="text-base font-semibold text-orange-800">
                        {formatNumber(dadosAnaliticos.filter(loja => (loja.mesM0 || 0) < (loja.mesM1 || 0)).length)}
                      </span>
                    </div>
                    <div className="text-xs text-orange-500 mt-1">Lojas com redução vs mês anterior</div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-600">Sem Movimento</span>
                      <span className="text-base font-semibold text-orange-800">
                        {formatNumber(dadosAnaliticos.filter(loja => (loja.mesM0 || 0) === 0).length)}
                      </span>
                    </div>
                    <div className="text-xs text-orange-500 mt-1">Lojas sem contas no mês atual</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Tendência */}
      <Card className="flex-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Análise por Tendência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div 
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-green-50 transition-all duration-200"
                    onClick={() => onTendenciaClick('comecando')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-full border border-green-200">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Crescimento</p>
                        <p className="text-xl font-bold text-green-800">{formatNumber(tendencias.comecando)}</p>
                        <p className="text-xs text-green-600">Excelente!</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 max-w-sm">
                  <p className="font-medium mb-2">Cálculo de Crescimento:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Crescimento consistente nos últimos 3 meses</li>
                    <li>• {mesesFormatados.M0} maior que {mesesFormatados.M1} maior que {mesesFormatados.M2}</li>
                    <li>• Aumento mínimo de 10% mês a mês</li>
                  </ul>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div 
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-blue-50 transition-all duration-200"
                    onClick={() => onTendenciaClick('estavel')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-full border border-blue-200">
                        <Minus className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Estável</p>
                        <p className="text-xl font-bold text-blue-800">{formatNumber(tendencias.estavel)}</p>
                        <p className="text-xs text-blue-600">Mantendo</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 max-w-sm">
                  <p className="font-medium mb-2">Cálculo de Estabilidade:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Variação máxima de ±10% entre meses</li>
                    <li>• Mantém média de produção consistente</li>
                    <li>• Sem quedas significativas nos últimos 3 meses</li>
                  </ul>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div 
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-amber-50 transition-all duration-200"
                    onClick={() => onTendenciaClick('atencao')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-3 rounded-full border border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Atenção</p>
                        <p className="text-xl font-bold text-amber-800">{formatNumber(tendencias.atencao)}</p>
                        <p className="text-xs text-amber-600">Cuidado</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 max-w-sm">
                  <p className="font-medium mb-2">Critérios de Atenção:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Queda entre 10% e 30% no último mês</li>
                    <li>• {mesesFormatados.M0} menor que {mesesFormatados.M1}</li>
                    <li>• OU oscilação frequente (alta volatilidade)</li>
                    <li>• OU produção abaixo da média do segmento</li>
                  </ul>
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div 
                    className="bg-white p-4 rounded-lg cursor-pointer hover:bg-red-50 transition-all duration-200"
                    onClick={() => onTendenciaClick('queda')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-3 rounded-full border border-red-200">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Queda</p>
                        <p className="text-xl font-bold text-red-800">{formatNumber(tendencias.queda)}</p>
                        <p className="text-xs text-red-600">Urgente!</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 max-w-sm">
                  <p className="font-medium mb-2">Identificação de Queda:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Queda superior a 30% no último mês</li>
                    <li>• {mesesFormatados.M0} muito menor que {mesesFormatados.M1}</li>
                    <li>• OU tendência de queda por 3 meses consecutivos</li>
                    <li>• OU zerou produção no mês atual</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Análise Detalhada */}
      <div className="flex-1 min-h-0">
        <AnaliseEvolucaoModal
          isOpen={showAnaliseDetalhada}
          onClose={() => setShowAnaliseDetalhada(false)}
          dadosAnaliticos={dadosAnaliticos}
        />
      </div>
    </div>
  );
};

export default GraficoTendencia; 