import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity, AlertTriangle, TrendingDown, Target, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight, Minus, Info, CheckCircle } from "lucide-react";
import { DadosLoja } from "@/shared/types/lead";
import { getRelativeMonths } from "@/utils/formatDate";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import AnaliseEvolucaoModal from "./AnaliseEvolucaoModal";
import { MetricasEstrategiaResponse } from "@/services/estrategiaComercialService";

interface GraficoTendenciaProps {
  dadosAnaliticos?: DadosLoja[];
  metricas?: MetricasEstrategiaResponse; // Nova prop para métricas calculadas no backend
  onTendenciaClick: (tendencia: string) => void;
  onZeradosClick?: () => void;
  onQuedaProducaoClick?: () => void;
  showTendenciaCard?: boolean; // Nova prop para controlar exibição do card de tendência
  tipoMetrica?: 'contas' | 'ativos'; // Nova prop para controlar o tipo de métrica (contas ou ativos)
}

const GraficoTendencia: React.FC<GraficoTendenciaProps> = ({ 
  dadosAnaliticos = [],
  metricas,
  onTendenciaClick,
  onZeradosClick,
  onQuedaProducaoClick,
  showTendenciaCard = true,
  tipoMetrica = 'contas'
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

  // Usar métricas do backend se disponíveis, senão calcular no frontend (fallback)
  const usarMetricasBackend = !!metricas;
  
  let totalContasM0, totalContasM1, lojasQueProduziraM0, lojasQueProduziraM1;
  let lojasQueZeraram, lojasNovas, lojasQueVoltaram, lojasEstaveisAtivas;
  let crescimento, produtividadeGeral, tendencias;
  let totalLojas, lojasQuedaProducao, lojasSemMovimento, mediaPorLoja;
  
  if (usarMetricasBackend) {
    // Usar dados calculados no backend
    totalContasM0 = metricas!.totalContasM0;
    totalContasM1 = metricas!.totalContasM1;
    lojasQueProduziraM0 = { length: metricas!.lojasComProducaoM0 };
    lojasQueProduziraM1 = { length: metricas!.lojasComProducaoM1 };
    lojasQueZeraram = { length: metricas!.lojasQueZeraram };
    lojasNovas = { length: metricas!.lojasNovas };
    lojasQueVoltaram = { length: metricas!.lojasQueVoltaram };
    lojasEstaveisAtivas = { length: metricas!.lojasEstaveisAtivas };
    crescimento = metricas!.crescimentoPercentual;
    produtividadeGeral = metricas!.produtividadeGeral;
    totalLojas = metricas!.totalLojas;
    lojasQuedaProducao = { length: metricas!.lojasQuedaProducao };
    lojasSemMovimento = { length: metricas!.lojasSemMovimento };
    mediaPorLoja = metricas!.mediaPorLoja;
    tendencias = metricas!.tendencias;
  } else {
    // Fallback: calcular no frontend (método antigo)
    totalContasM0 = dadosAnaliticos.reduce((sum, loja) => sum + (loja.mesM0 || 0), 0);
    totalContasM1 = dadosAnaliticos.reduce((sum, loja) => sum + (loja.mesM1 || 0), 0);
    
    lojasQueProduziraM0 = dadosAnaliticos.filter(loja => (loja.mesM0 || 0) > 0);
    lojasQueProduziraM1 = dadosAnaliticos.filter(loja => (loja.mesM1 || 0) > 0);
    
    // Análise detalhada
    lojasQueZeraram = dadosAnaliticos.filter(loja => 
      (loja.mesM1 || 0) > 0 && (loja.mesM0 || 0) === 0
    );
    
    lojasNovas = dadosAnaliticos.filter(loja => 
      (loja.mesM1 || 0) === 0 && (loja.mesM0 || 0) > 0
    );
    
    lojasQueVoltaram = dadosAnaliticos.filter(loja => 
      (loja.mesM2 || 0) > 0 && (loja.mesM1 || 0) === 0 && (loja.mesM0 || 0) > 0
    );

    lojasEstaveisAtivas = dadosAnaliticos.filter(loja => 
      (loja.mesM1 || 0) > 0 && (loja.mesM0 || 0) > 0
    );

    crescimento = ((totalContasM0 - totalContasM1) / (totalContasM1 || 1)) * 100;
    produtividadeGeral = dadosAnaliticos.length > 0 ? (lojasQueProduziraM0.length / dadosAnaliticos.length) * 100 : 0;
    totalLojas = dadosAnaliticos.length;
    lojasQuedaProducao = dadosAnaliticos.filter(loja => (loja.mesM0 || 0) < (loja.mesM1 || 0));
    lojasSemMovimento = dadosAnaliticos.filter(loja => (loja.mesM0 || 0) === 0);
    mediaPorLoja = Math.round(totalContasM0 / (lojasQueProduziraM0.length || 1));

    tendencias = {
      comecando: dadosAnaliticos.filter(loja => loja.tendencia === "comecando").length,
      estavel: dadosAnaliticos.filter(loja => loja.tendencia === "estavel").length,
      atencao: dadosAnaliticos.filter(loja => loja.tendencia === "atencao").length,
      queda: dadosAnaliticos.filter(loja => loja.tendencia === "queda").length
    };
  }


  return (
    <div className="flex flex-col min-h-0 space-y-4">
      {/* Card Principal Unificado - Dashboard Completo */}
      <Card className="flex-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Resumo de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo Executivo */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">

            </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total de Contas/Ativos */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-gray-900">Total de {tipoMetrica === 'ativos' ? 'Ativos' : 'Contas'}</CardTitle>
                    <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-blue-800">{formatNumber(totalContasM0)}</p>
                    <p className="text-sm text-gray-500 mt-1">em {mesesFormatados.M0}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${crescimento >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {crescimento >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {formatPercent(Math.abs(crescimento))}% vs {mesesFormatados.M1}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lojas com Produção */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-gray-900">{tipoMetrica === 'ativos' ? 'Pontos' : 'Lojas'} com Produção</CardTitle>
                    <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-blue-800">{formatNumber(lojasQueProduziraM0.length)}</p>
                    <p className="text-sm text-gray-500 mt-1">de {formatNumber(totalLojas)} {tipoMetrica === 'ativos' ? 'pontos' : 'lojas'}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${produtividadeGeral}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium">{formatPercent(produtividadeGeral)}% de produtividade</p>
                  </div>
                </CardContent>
              </Card>

              {/* Lojas que Zeraram */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-gray-900">{tipoMetrica === 'ativos' ? 'Pontos' : 'Lojas'} que Zeraram</CardTitle>
                    <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(lojasQueZeraram.length)}</p>
                    <p className="text-sm text-gray-500 mt-1">{mesesFormatados.M1} → {mesesFormatados.M0}</p>
                    {lojasQueZeraram.length > 0 ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-2">
                        <AlertCircle size={12} />
                        Requer atenção
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-2">
                        <CheckCircle size={12} />
                        Excelente performance
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Linha Divisória */}
          <hr className="border-gray-200" />

                    {/* Performance & Evolução */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Evolução de Contas */}
            <div className="h-full">
              <div 
                className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50/70 transition-all duration-200 h-full flex flex-col"
                onClick={() => setShowAnaliseDetalhada(true)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Evolução de {tipoMetrica === 'ativos' ? 'Pontos Ativos' : 'Contas'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${crescimento >= 0 ? 'text-green-600' : 'text-red-600'} font-bold text-lg`}>
                      {crescimento >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      {formatPercent(Math.abs(crescimento))}%
                    </div>
                    <Info className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {/* Variação Total */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100 flex flex-col justify-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {crescimento >= 0 ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="h-5 w-5" />
                            <span className="text-sm font-medium">Crescimento</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <ArrowDownRight className="h-5 w-5" />
                            <span className="text-sm font-medium">Redução</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <div className={`text-3xl font-bold ${crescimento >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {totalContasM0 - totalContasM1 >= 0 ? '+' : ''}{formatNumber(Math.abs(totalContasM0 - totalContasM1))}
                        </div>
                        <div className="text-sm text-gray-600">{tipoMetrica === 'ativos' ? 'pontos' : 'contas'}</div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">{mesesFormatados.M1}</span>
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="bg-blue-50 px-2 py-1 rounded border border-blue-200">{mesesFormatados.M0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparativo de Lojas Ativas */}
                  <div className="bg-white p-4 rounded-lg border border-green-100 flex flex-col justify-center">
                    <div className="text-center mb-3">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">Lojas com Produção</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{mesesFormatados.M1}</div>
                        <div className="w-20 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                          <span className="text-lg font-bold text-gray-700">{lojasQueProduziraM1.length.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <ArrowUpRight className={`h-5 w-5 ${lojasQueProduziraM0.length >= lojasQueProduziraM1.length ? 'text-green-500' : 'text-red-500'}`} />
                        <div className={`text-xs font-medium ${lojasQueProduziraM0.length >= lojasQueProduziraM1.length ? 'text-green-600' : 'text-red-600'}`}>
                          {lojasQueProduziraM0.length >= lojasQueProduziraM1.length ? '+' : ''}{lojasQueProduziraM0.length - lojasQueProduziraM1.length}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{mesesFormatados.M0}</div>
                        <div className="w-20 h-12 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-200">
                          <span className="text-lg font-bold text-green-700">{lojasQueProduziraM0.length.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center mt-2">
                      <div className="text-xs text-gray-500">
                        {formatPercent((lojasQueProduziraM0.length / totalLojas) * 100)}% do total
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Atual - Não exibir para pontos ativos */}
            {tipoMetrica !== 'ativos' && (
              <div className="h-full">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 h-full flex flex-col">
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
                <div className="relative pt-1 flex-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">
                        Produtividade Geral
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-green-600">
                        {formatNumber(lojasQueProduziraM0.length)}/{formatNumber(totalLojas)} lojas
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
                    <div className="text-sm text-green-600">Lojas com Produção</div>
                    <div className="text-xl font-bold text-green-800">{formatNumber(lojasQueProduziraM0.length)}</div>
                    <div className="text-xs text-green-500">{mesesFormatados.M0}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600">Média por Loja</div>
                    <div className="text-xl font-bold text-blue-800">
                      {formatNumber(mediaPorLoja)}
                    </div>
                    <div className="text-xs text-blue-500">contas/loja</div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Tendência - Condicional */}
      {showTendenciaCard && (
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
      )}

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