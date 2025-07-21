import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity, AlertTriangle, TrendingDown, Target, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight, Minus, Info, Download, Eye } from "lucide-react";
import { DadosLoja } from "@/shared/types/lead";
import { getRelativeMonths } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  
  // Estados para paginação das tabelas
  const [paginaZeraram, setPaginaZeraram] = useState(1);
  const [paginaNovas, setPaginaNovas] = useState(1);
  const [paginaVoltaram, setPaginaVoltaram] = useState(1);
  const [paginaEstaveis, setPaginaEstaveis] = useState(1);
  
  const itensPorPagina = 20;

  // Refs para scroll automático
  const tabelaZeraramRef = useRef<HTMLDivElement>(null);
  const tabelaNovasRef = useRef<HTMLDivElement>(null);
  const tabelaVoltaramRef = useRef<HTMLDivElement>(null);
  const tabelaEstaveisRef = useRef<HTMLDivElement>(null);

  // Função para scroll automático
  const scrollToTable = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

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

  // Função para exportar análise detalhada para Excel
  const exportarAnaliseDetalhada = () => {
    const workbook = XLSX.utils.book_new();
    
    // Aba 1: Resumo Geral
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

    // Aba 2: Lojas que Zeraram
    if (lojasQueZeraram.length > 0) {
      const zeraramData = lojasQueZeraram.map(loja => ({
        'Chave Loja': loja.chaveLoja,
        'Nome Loja': loja.nomeLoja,
        'CNPJ': loja.cnpj,
        [`Produção ${mesesFormatados.M1}`]: loja.mesM1,
        [`Produção ${mesesFormatados.M0}`]: loja.mesM0,
        'Agência': `${loja.codAgRelacionamento} - ${loja.agRelacionamento}`,
        'Gerência Regional': loja.gerenciaRegional,
        'Diretoria Regional': loja.diretoriaRegional,
        'Tendência': loja.tendencia
      }));
      
      const wsZeraram = XLSX.utils.json_to_sheet(zeraramData);
      XLSX.utils.book_append_sheet(workbook, wsZeraram, "Lojas que Zeraram");
    }

    // Aba 3: Lojas Novas
    if (lojasNovas.length > 0) {
      const novasData = lojasNovas.map(loja => ({
        'Chave Loja': loja.chaveLoja,
        'Nome Loja': loja.nomeLoja,
        'CNPJ': loja.cnpj,
        [`Produção ${mesesFormatados.M1}`]: loja.mesM1,
        [`Produção ${mesesFormatados.M0}`]: loja.mesM0,
        'Agência': `${loja.codAgRelacionamento} - ${loja.agRelacionamento}`,
        'Gerência Regional': loja.gerenciaRegional,
        'Diretoria Regional': loja.diretoriaRegional,
        'Tendência': loja.tendencia
      }));
      
      const wsNovas = XLSX.utils.json_to_sheet(novasData);
      XLSX.utils.book_append_sheet(workbook, wsNovas, "Lojas Novas");
    }

    // Aba 4: Lojas que Voltaram
    if (lojasQueVoltaram.length > 0) {
      const voltaramData = lojasQueVoltaram.map(loja => ({
        'Chave Loja': loja.chaveLoja,
        'Nome Loja': loja.nomeLoja,
        'CNPJ': loja.cnpj,
        [`Produção ${mesesFormatados.M2}`]: loja.mesM2,
        [`Produção ${mesesFormatados.M1}`]: loja.mesM1,
        [`Produção ${mesesFormatados.M0}`]: loja.mesM0,
        'Agência': `${loja.codAgRelacionamento} - ${loja.agRelacionamento}`,
        'Gerência Regional': loja.gerenciaRegional,
        'Diretoria Regional': loja.diretoriaRegional,
        'Tendência': loja.tendencia
      }));
      
      const wsVoltaram = XLSX.utils.json_to_sheet(voltaramData);
      XLSX.utils.book_append_sheet(workbook, wsVoltaram, "Lojas que Voltaram");
    }

    // Aba 5: Lojas Estáveis
    if (lojasEstaveisAtivas.length > 0) {
      const estaveisData = lojasEstaveisAtivas.map(loja => {
        const variacao = ((loja.mesM0 - loja.mesM1) / loja.mesM1) * 100;
        return {
          'Chave Loja': loja.chaveLoja,
          'Nome Loja': loja.nomeLoja,
          'CNPJ': loja.cnpj,
          [`Produção ${mesesFormatados.M1}`]: loja.mesM1,
          [`Produção ${mesesFormatados.M0}`]: loja.mesM0,
          'Variação %': formatPercent(variacao) + '%',
          'Agência': `${loja.codAgRelacionamento} - ${loja.agRelacionamento}`,
          'Gerência Regional': loja.gerenciaRegional,
          'Diretoria Regional': loja.diretoriaRegional,
          'Tendência': loja.tendencia
        };
      });
      
      const wsEstaveis = XLSX.utils.json_to_sheet(estaveisData);
      XLSX.utils.book_append_sheet(workbook, wsEstaveis, "Lojas Estáveis");
    }

    // Salvar arquivo
    const nomeArquivo = `Análise_Evolução_${mesesFormatados.M1}_${mesesFormatados.M0}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
  };

  // Função para exportar dados para Excel
  const exportarParaExcel = (dados: DadosLoja[], nomeAba: string) => {
    import('xlsx').then((XLSX) => {
      const dadosFormatados = dados.map(loja => ({
        'Chave Loja': loja.chaveLoja,
        'Nome Loja': loja.nomeLoja,
        'CNPJ': loja.cnpj,
        [`${mesesFormatados.M2}`]: loja.mesM2 || 0,
        [`${mesesFormatados.M1}`]: loja.mesM1 || 0,
        [`${mesesFormatados.M0}`]: loja.mesM0 || 0,
        'Código Agência': loja.codAgRelacionamento,
        'Agência': loja.agRelacionamento,
        'Regional': loja.gerenciaRegional,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosFormatados);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // Chave Loja
        { wch: 30 }, // Nome Loja
        { wch: 18 }, // CNPJ
        { wch: 12 }, // M2
        { wch: 12 }, // M1
        { wch: 12 }, // M0
        { wch: 15 }, // Código Agência
        { wch: 25 }, // Agência
        { wch: 20 }, // Regional
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, nomeAba);
      XLSX.writeFile(wb, `analise_evolucao_${nomeAba.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  // Funções de paginação
  const getPaginatedData = (dados: DadosLoja[], pagina: number) => {
    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return dados.slice(inicio, fim);
  };

  const getTotalPaginas = (total: number) => Math.ceil(total / itensPorPagina);

  // Função para obter páginas visíveis (máximo 10)
  const getPaginasVisiveis = (paginaAtual: number, totalPaginas: number) => {
    const maxPaginasVisiveis = 10;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxPaginasVisiveis / 2));
    let fim = Math.min(totalPaginas, inicio + maxPaginasVisiveis - 1);
    
    // Ajustar início se fim for menor que maxPaginasVisiveis
    if (fim - inicio + 1 < maxPaginasVisiveis) {
      inicio = Math.max(1, fim - maxPaginasVisiveis + 1);
    }
    
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  };

  return (
    <div className="space-y-4 h-full">
      {/* Card Principal - Resumo Executivo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              📊 Resumo Executivo
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarAnaliseDetalhada}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Dialog open={showAnaliseDetalhada} onOpenChange={setShowAnaliseDetalhada}>
                <DialogTrigger asChild>
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50/70 transition-all duration-200">
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
                </DialogTrigger>

                <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Análise Detalhada de Evolução</DialogTitle>
                  </DialogHeader>
                  
                  {/* Cards de Métricas - Estilo Hotlist */}
                  <div className="grid grid-cols-4 gap-4 mb-4 flex-shrink-0">
                    <Card className="bg-gradient-to-br from-red-50 to-white border-red-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-semibold text-gray-900">Lojas que Zeraram</CardTitle>
                          <div className="p-2 rounded-full bg-red-50 border border-red-100">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div>
                          <p className="text-2xl font-bold text-red-800">{formatNumber(lojasQueZeraram.length)}</p>
                          <p className="text-xs text-gray-600 mt-1">vs {mesesFormatados.M1}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-semibold text-gray-900">Lojas Novas</CardTitle>
                          <div className="p-2 rounded-full bg-green-50 border border-green-100">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div>
                          <p className="text-2xl font-bold text-green-800">{formatNumber(lojasNovas.length)}</p>
                          <p className="text-xs text-gray-600 mt-1">primeira produção</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-semibold text-gray-900">Lojas que Voltaram</CardTitle>
                          <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                            <ArrowUpRight className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div>
                          <p className="text-2xl font-bold text-blue-800">{formatNumber(lojasQueVoltaram.length)}</p>
                          <p className="text-xs text-gray-600 mt-1">retomaram produção</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-semibold text-gray-900">Lojas Estáveis</CardTitle>
                          <div className="p-2 rounded-full bg-purple-50 border border-purple-100">
                            <Activity className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div>
                          <p className="text-2xl font-bold text-purple-800">{formatNumber(lojasEstaveisAtivas.length)}</p>
                          <p className="text-xs text-gray-600 mt-1">mantiveram produção</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Área com scroll para o conteúdo das tabs */}
                  <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="zeraram" className="h-full flex flex-col">
                      <TabsList className="mb-4 flex-shrink-0">
                        <TabsTrigger 
                          value="zeraram" 
                          className="flex items-center gap-2"
                          onClick={() => scrollToTable(tabelaZeraramRef)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Zeraram ({lojasQueZeraram.length})
                        </TabsTrigger>
                        <TabsTrigger 
                          value="novas" 
                          className="flex items-center gap-2"
                          onClick={() => scrollToTable(tabelaNovasRef)}
                        >
                          <TrendingUp className="h-4 w-4" />
                          Novas ({lojasNovas.length})
                        </TabsTrigger>
                        <TabsTrigger 
                          value="voltaram" 
                          className="flex items-center gap-2"
                          onClick={() => scrollToTable(tabelaVoltaramRef)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          Voltaram ({lojasQueVoltaram.length})
                        </TabsTrigger>
                        <TabsTrigger 
                          value="estaveis" 
                          className="flex items-center gap-2"
                          onClick={() => scrollToTable(tabelaEstaveisRef)}
                        >
                          <Activity className="h-4 w-4" />
                          Estáveis ({lojasEstaveisAtivas.length})
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex-1 overflow-auto">
                        <TabsContent value="zeraram" className="mt-0 h-full">
                          <div ref={tabelaZeraramRef} className="rounded-lg border border-red-200 bg-white shadow-sm">
                            <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Lojas que Zeraram Produção ({lojasQueZeraram.length})
                                  </h3>
                                  <p className="text-sm text-red-600 mt-1">
                                    Lojas que produziram em {mesesFormatados.M1} mas zeraram em {mesesFormatados.M0}
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => exportarParaExcel(lojasQueZeraram, 'Lojas Zeraram')}
                                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                  size="sm"
                                >
                                  <Download className="h-4 w-4" />
                                  Exportar Excel
                                </Button>
                              </div>
                            </div>
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-red-200">
                                  <TableHead className="w-[250px] font-semibold text-center">Loja</TableHead>
                                  <TableHead className="text-center w-[100px] font-semibold">{mesesFormatados.M1}</TableHead>
                                  <TableHead className="text-center w-[100px] font-semibold">{mesesFormatados.M0}</TableHead>
                                  <TableHead className="w-[200px] font-semibold text-center">Agência</TableHead>
                                  <TableHead className="font-semibold text-center">Regional</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getPaginatedData(lojasQueZeraram, paginaZeraram).map((loja, index) => (
                                  <TableRow key={loja.chaveLoja} className={index % 2 === 0 ? 'bg-red-25' : 'bg-white'}>
                                    <TableCell className="text-center">
                                      <div className="font-medium text-gray-900">{loja.nomeLoja}</div>
                                      <div className="text-sm text-gray-500">{loja.chaveLoja} • {loja.cnpj}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-gray-900">{formatNumber(loja.mesM1)}</div>
                                      <div className="text-xs text-gray-500">contas</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-md inline-block">0</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-medium">{loja.codAgRelacionamento}</div>
                                      <div className="text-gray-600">{loja.agRelacionamento}</div>
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">{loja.gerenciaRegional}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {/* Paginação */}
                            {getTotalPaginas(lojasQueZeraram.length) > 1 && (
                              <div className="flex justify-between items-center p-4 border-t border-red-200 bg-red-25">
                                <div className="text-sm text-gray-600">
                                  Mostrando {((paginaZeraram - 1) * itensPorPagina) + 1} a {Math.min(paginaZeraram * itensPorPagina, lojasQueZeraram.length)} de {lojasQueZeraram.length} lojas
                                </div>
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious 
                                        onClick={() => setPaginaZeraram(prev => Math.max(1, prev - 1))}
                                        className={paginaZeraram === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                    
                                    {/* Indicador de páginas anteriores */}
                                    {getPaginasVisiveis(paginaZeraram, getTotalPaginas(lojasQueZeraram.length))[0] > 1 && (
                                      <>
                                        <PaginationItem>
                                          <PaginationLink onClick={() => setPaginaZeraram(1)} className="cursor-pointer">
                                            1
                                          </PaginationLink>
                                        </PaginationItem>
                                        {getPaginasVisiveis(paginaZeraram, getTotalPaginas(lojasQueZeraram.length))[0] > 2 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                      </>
                                    )}
                                    
                                    {getPaginasVisiveis(paginaZeraram, getTotalPaginas(lojasQueZeraram.length)).map((pagina) => (
                                      <PaginationItem key={pagina}>
                                        <PaginationLink 
                                          onClick={() => setPaginaZeraram(pagina)}
                                          isActive={paginaZeraram === pagina}
                                          className="cursor-pointer"
                                        >
                                          {pagina}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ))}
                                    
                                    {/* Indicador de páginas posteriores */}
                                    {getPaginasVisiveis(paginaZeraram, getTotalPaginas(lojasQueZeraram.length)).slice(-1)[0] < getTotalPaginas(lojasQueZeraram.length) && (
                                      <>
                                        {getPaginasVisiveis(paginaZeraram, getTotalPaginas(lojasQueZeraram.length)).slice(-1)[0] < getTotalPaginas(lojasQueZeraram.length) - 1 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                        <PaginationItem>
                                          <PaginationLink 
                                            onClick={() => setPaginaZeraram(getTotalPaginas(lojasQueZeraram.length))} 
                                            className="cursor-pointer"
                                          >
                                            {getTotalPaginas(lojasQueZeraram.length)}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </>
                                    )}
                                    
                                    <PaginationItem>
                                      <PaginationNext 
                                        onClick={() => setPaginaZeraram(prev => Math.min(getTotalPaginas(lojasQueZeraram.length), prev + 1))}
                                        className={paginaZeraram === getTotalPaginas(lojasQueZeraram.length) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="novas" className="mt-0 h-full">
                          <div ref={tabelaNovasRef} className="rounded-lg border border-green-200 bg-white shadow-sm">
                            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Lojas Novas ({lojasNovas.length})
                                  </h3>
                                  <p className="text-sm text-green-600 mt-1">
                                    Lojas com primeira produção em {mesesFormatados.M0}
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => exportarParaExcel(lojasNovas, 'Lojas Novas')}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                  size="sm"
                                >
                                  <Download className="h-4 w-4" />
                                  Exportar Excel
                                </Button>
                              </div>
                            </div>
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-green-200">
                                  <TableHead className="w-[250px] font-semibold text-center">Loja</TableHead>
                                  <TableHead className="text-center w-[100px] font-semibold">{mesesFormatados.M1}</TableHead>
                                  <TableHead className="text-center w-[100px] font-semibold">{mesesFormatados.M0}</TableHead>
                                  <TableHead className="w-[200px] font-semibold text-center">Agência</TableHead>
                                  <TableHead className="font-semibold text-center">Regional</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getPaginatedData(lojasNovas, paginaNovas).map((loja, index) => (
                                  <TableRow key={loja.chaveLoja} className={index % 2 === 0 ? 'bg-green-25' : 'bg-white'}>
                                    <TableCell className="text-center">
                                      <div className="font-medium text-gray-900">{loja.nomeLoja}</div>
                                      <div className="text-sm text-gray-500">{loja.chaveLoja} • {loja.cnpj}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-md inline-block">0</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-md inline-block">{formatNumber(loja.mesM0)}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-medium">{loja.codAgRelacionamento}</div>
                                      <div className="text-gray-600">{loja.agRelacionamento}</div>
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">{loja.gerenciaRegional}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {/* Paginação */}
                            {getTotalPaginas(lojasNovas.length) > 1 && (
                              <div className="flex justify-between items-center p-4 border-t border-green-200 bg-green-25">
                                <div className="text-sm text-gray-600">
                                  Mostrando {((paginaNovas - 1) * itensPorPagina) + 1} a {Math.min(paginaNovas * itensPorPagina, lojasNovas.length)} de {lojasNovas.length} lojas
                                </div>
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious 
                                        onClick={() => setPaginaNovas(prev => Math.max(1, prev - 1))}
                                        className={paginaNovas === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                    
                                    {/* Indicador de páginas anteriores */}
                                    {getPaginasVisiveis(paginaNovas, getTotalPaginas(lojasNovas.length))[0] > 1 && (
                                      <>
                                        <PaginationItem>
                                          <PaginationLink onClick={() => setPaginaNovas(1)} className="cursor-pointer">
                                            1
                                          </PaginationLink>
                                        </PaginationItem>
                                        {getPaginasVisiveis(paginaNovas, getTotalPaginas(lojasNovas.length))[0] > 2 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                      </>
                                    )}
                                    
                                    {getPaginasVisiveis(paginaNovas, getTotalPaginas(lojasNovas.length)).map((pagina) => (
                                      <PaginationItem key={pagina}>
                                        <PaginationLink 
                                          onClick={() => setPaginaNovas(pagina)}
                                          isActive={paginaNovas === pagina}
                                          className="cursor-pointer"
                                        >
                                          {pagina}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ))}
                                    
                                    {/* Indicador de páginas posteriores */}
                                    {getPaginasVisiveis(paginaNovas, getTotalPaginas(lojasNovas.length)).slice(-1)[0] < getTotalPaginas(lojasNovas.length) && (
                                      <>
                                        {getPaginasVisiveis(paginaNovas, getTotalPaginas(lojasNovas.length)).slice(-1)[0] < getTotalPaginas(lojasNovas.length) - 1 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                        <PaginationItem>
                                          <PaginationLink 
                                            onClick={() => setPaginaNovas(getTotalPaginas(lojasNovas.length))} 
                                            className="cursor-pointer"
                                          >
                                            {getTotalPaginas(lojasNovas.length)}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </>
                                    )}
                                    
                                    <PaginationItem>
                                      <PaginationNext 
                                        onClick={() => setPaginaNovas(prev => Math.min(getTotalPaginas(lojasNovas.length), prev + 1))}
                                        className={paginaNovas === getTotalPaginas(lojasNovas.length) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="voltaram" className="mt-0 h-full">
                          <div ref={tabelaVoltaramRef} className="rounded-lg border border-blue-200 bg-white shadow-sm">
                            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                                    <ArrowUpRight className="h-5 w-5" />
                                    Lojas que Voltaram ({lojasQueVoltaram.length})
                                  </h3>
                                  <p className="text-sm text-blue-600 mt-1">
                                    Lojas que retomaram produção após zeramento
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => exportarParaExcel(lojasQueVoltaram, 'Lojas Voltaram')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                  size="sm"
                                >
                                  <Download className="h-4 w-4" />
                                  Exportar Excel
                                </Button>
                              </div>
                            </div>
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-blue-200">
                                  <TableHead className="w-[200px] font-semibold text-center">Loja</TableHead>
                                  <TableHead className="text-center w-[80px] font-semibold">{mesesFormatados.M2}</TableHead>
                                  <TableHead className="text-center w-[80px] font-semibold">{mesesFormatados.M1}</TableHead>
                                  <TableHead className="text-center w-[80px] font-semibold">{mesesFormatados.M0}</TableHead>
                                  <TableHead className="w-[180px] font-semibold text-center">Agência</TableHead>
                                  <TableHead className="font-semibold text-center">Regional</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getPaginatedData(lojasQueVoltaram, paginaVoltaram).map((loja, index) => (
                                  <TableRow key={loja.chaveLoja} className={index % 2 === 0 ? 'bg-blue-25' : 'bg-white'}>
                                    <TableCell className="text-center">
                                      <div className="font-medium text-gray-900">{loja.nomeLoja}</div>
                                      <div className="text-sm text-gray-500">{loja.chaveLoja} • {loja.cnpj}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-gray-700">{formatNumber(loja.mesM2)}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-md inline-block">0</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-md inline-block">{formatNumber(loja.mesM0)}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-medium">{loja.codAgRelacionamento}</div>
                                      <div className="text-gray-600">{loja.agRelacionamento}</div>
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">{loja.gerenciaRegional}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {/* Paginação */}
                            {getTotalPaginas(lojasQueVoltaram.length) > 1 && (
                              <div className="flex justify-between items-center p-4 border-t border-blue-200 bg-blue-25">
                                <div className="text-sm text-gray-600">
                                  Mostrando {((paginaVoltaram - 1) * itensPorPagina) + 1} a {Math.min(paginaVoltaram * itensPorPagina, lojasQueVoltaram.length)} de {lojasQueVoltaram.length} lojas
                                </div>
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious 
                                        onClick={() => setPaginaVoltaram(prev => Math.max(1, prev - 1))}
                                        className={paginaVoltaram === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                    
                                    {/* Indicador de páginas anteriores */}
                                    {getPaginasVisiveis(paginaVoltaram, getTotalPaginas(lojasQueVoltaram.length))[0] > 1 && (
                                      <>
                                        <PaginationItem>
                                          <PaginationLink onClick={() => setPaginaVoltaram(1)} className="cursor-pointer">
                                            1
                                          </PaginationLink>
                                        </PaginationItem>
                                        {getPaginasVisiveis(paginaVoltaram, getTotalPaginas(lojasQueVoltaram.length))[0] > 2 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                      </>
                                    )}
                                    
                                    {getPaginasVisiveis(paginaVoltaram, getTotalPaginas(lojasQueVoltaram.length)).map((pagina) => (
                                      <PaginationItem key={pagina}>
                                        <PaginationLink 
                                          onClick={() => setPaginaVoltaram(pagina)}
                                          isActive={paginaVoltaram === pagina}
                                          className="cursor-pointer"
                                        >
                                          {pagina}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ))}
                                    
                                    {/* Indicador de páginas posteriores */}
                                    {getPaginasVisiveis(paginaVoltaram, getTotalPaginas(lojasQueVoltaram.length)).slice(-1)[0] < getTotalPaginas(lojasQueVoltaram.length) && (
                                      <>
                                        {getPaginasVisiveis(paginaVoltaram, getTotalPaginas(lojasQueVoltaram.length)).slice(-1)[0] < getTotalPaginas(lojasQueVoltaram.length) - 1 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                        <PaginationItem>
                                          <PaginationLink 
                                            onClick={() => setPaginaVoltaram(getTotalPaginas(lojasQueVoltaram.length))} 
                                            className="cursor-pointer"
                                          >
                                            {getTotalPaginas(lojasQueVoltaram.length)}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </>
                                    )}
                                    
                                    <PaginationItem>
                                      <PaginationNext 
                                        onClick={() => setPaginaVoltaram(prev => Math.min(getTotalPaginas(lojasQueVoltaram.length), prev + 1))}
                                        className={paginaVoltaram === getTotalPaginas(lojasQueVoltaram.length) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="estaveis" className="mt-0 h-full">
                          <div ref={tabelaEstaveisRef} className="rounded-lg border border-purple-200 bg-white shadow-sm">
                            <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Lojas Estáveis ({lojasEstaveisAtivas.length})
                                  </h3>
                                  <p className="text-sm text-purple-600 mt-1">
                                    Lojas que mantiveram produção em ambos os meses
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => exportarParaExcel(lojasEstaveisAtivas, 'Lojas Estáveis')}
                                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                                  size="sm"
                                >
                                  <Download className="h-4 w-4" />
                                  Exportar Excel
                                </Button>
                              </div>
                            </div>
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-purple-200">
                                  <TableHead className="w-[200px] font-semibold text-center">Loja</TableHead>
                                  <TableHead className="text-center w-[80px] font-semibold">{mesesFormatados.M1}</TableHead>
                                  <TableHead className="text-center w-[80px] font-semibold">{mesesFormatados.M0}</TableHead>
                                  <TableHead className="w-[100px] font-semibold text-center">Variação</TableHead>
                                  <TableHead className="w-[180px] font-semibold text-center">Agência</TableHead>
                                  <TableHead className="font-semibold text-center">Regional</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getPaginatedData(lojasEstaveisAtivas, paginaEstaveis).map((loja, index) => {
                                  const variacao = ((loja.mesM0 - loja.mesM1) / loja.mesM1) * 100;
                                  return (
                                    <TableRow key={loja.chaveLoja} className={index % 2 === 0 ? 'bg-purple-25' : 'bg-white'}>
                                      <TableCell className="text-center">
                                        <div className="font-medium text-gray-900">{loja.nomeLoja}</div>
                                        <div className="text-sm text-gray-500">{loja.chaveLoja} • {loja.cnpj}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="font-semibold text-gray-700">{formatNumber(loja.mesM1)}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="font-semibold text-gray-900">{formatNumber(loja.mesM0)}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className={`flex items-center justify-center gap-1 ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          <div className={`p-1 rounded-full ${variacao >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                            {variacao >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                          </div>
                                          <div>
                                            <div className="font-semibold">{formatPercent(Math.abs(variacao))}%</div>
                                            <div className="text-xs">{variacao >= 0 ? 'cresceu' : 'caiu'}</div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="font-medium">{loja.codAgRelacionamento}</div>
                                        <div className="text-gray-600">{loja.agRelacionamento}</div>
                                      </TableCell>
                                      <TableCell className="text-center text-gray-600">{loja.gerenciaRegional}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                            
                            {/* Paginação */}
                            {getTotalPaginas(lojasEstaveisAtivas.length) > 1 && (
                              <div className="flex justify-between items-center p-4 border-t border-purple-200 bg-purple-25">
                                <div className="text-sm text-gray-600">
                                  Mostrando {((paginaEstaveis - 1) * itensPorPagina) + 1} a {Math.min(paginaEstaveis * itensPorPagina, lojasEstaveisAtivas.length)} de {lojasEstaveisAtivas.length} lojas
                                </div>
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious 
                                        onClick={() => setPaginaEstaveis(prev => Math.max(1, prev - 1))}
                                        className={paginaEstaveis === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                    
                                    {/* Indicador de páginas anteriores */}
                                    {getPaginasVisiveis(paginaEstaveis, getTotalPaginas(lojasEstaveisAtivas.length))[0] > 1 && (
                                      <>
                                        <PaginationItem>
                                          <PaginationLink onClick={() => setPaginaEstaveis(1)} className="cursor-pointer">
                                            1
                                          </PaginationLink>
                                        </PaginationItem>
                                        {getPaginasVisiveis(paginaEstaveis, getTotalPaginas(lojasEstaveisAtivas.length))[0] > 2 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                      </>
                                    )}
                                    
                                    {getPaginasVisiveis(paginaEstaveis, getTotalPaginas(lojasEstaveisAtivas.length)).map((pagina) => (
                                      <PaginationItem key={pagina}>
                                        <PaginationLink 
                                          onClick={() => setPaginaEstaveis(pagina)}
                                          isActive={paginaEstaveis === pagina}
                                          className="cursor-pointer"
                                        >
                                          {pagina}
                                        </PaginationLink>
                                      </PaginationItem>
                                    ))}
                                    
                                    {/* Indicador de páginas posteriores */}
                                    {getPaginasVisiveis(paginaEstaveis, getTotalPaginas(lojasEstaveisAtivas.length)).slice(-1)[0] < getTotalPaginas(lojasEstaveisAtivas.length) && (
                                      <>
                                        {getPaginasVisiveis(paginaEstaveis, getTotalPaginas(lojasEstaveisAtivas.length)).slice(-1)[0] < getTotalPaginas(lojasEstaveisAtivas.length) - 1 && (
                                          <PaginationItem>
                                            <span className="px-3 py-2 text-gray-500">...</span>
                                          </PaginationItem>
                                        )}
                                        <PaginationItem>
                                          <PaginationLink 
                                            onClick={() => setPaginaEstaveis(getTotalPaginas(lojasEstaveisAtivas.length))} 
                                            className="cursor-pointer"
                                          >
                                            {getTotalPaginas(lojasEstaveisAtivas.length)}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </>
                                    )}
                                    
                                    <PaginationItem>
                                      <PaginationNext 
                                        onClick={() => setPaginaEstaveis(prev => Math.min(getTotalPaginas(lojasEstaveisAtivas.length), prev + 1))}
                                        className={paginaEstaveis === getTotalPaginas(lojasEstaveisAtivas.length) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>

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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            📈 Análise por Tendência
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
    </div>
  );
};

export default GraficoTendencia; 