import React, { useState, useRef, useEffect } from "react";
import { 
  Card, CardHeader, CardTitle, CardContent 
} from "@/components/ui/card";
import { 
  TrendingUp, Activity, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Download,
  Info 
} from "lucide-react";
import { DadosLoja } from "@/shared/types/lead";
import { getRelativeMonths } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SectionKey = 'zeraram'|'novas'|'voltaram'|'estaveis';

interface AnaliseEvolucaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dadosAnaliticos: DadosLoja[];
}

const AnaliseEvolucaoModal: React.FC<AnaliseEvolucaoModalProps> = ({
  isOpen, onClose, dadosAnaliticos = []
}) => {
  // controla aba ativa
  const [activeTab, setActiveTab] = useState<SectionKey>('zeraram');
  // ref para o container de scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  // controla loja expandida
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);

  // ao mudar de aba, resetamos scroll e loja expandida
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      scrollRef.current.scrollTop = 0;
    }
    setLojaExpandida(null);
  }, [activeTab]);

  const meses = getRelativeMonths();
  
  // helpers de formatação
  const fmtNum = (n: number) => 
    new Intl.NumberFormat('pt-BR',{ minimumFractionDigits:0, maximumFractionDigits:0 }).format(n);
  const fmtPct = (n: number) => 
    new Intl.NumberFormat('pt-BR',{ minimumFractionDigits:1, maximumFractionDigits:1 }).format(n);
  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // definição das seções
  const sections = [
    {
      key: 'zeraram' as SectionKey,
      title: `Zeraram Produção (${dadosAnaliticos.filter(l=> (l.mesM1||0)>0 && (l.mesM0||0)===0).length})`,
      subtitle: `Produziram em ${meses.M1} mas zeraram em ${meses.M0}`,
      buttonText: 'Zeraram',
      icon: <AlertTriangle className="h-5 w-5"/>,
      data: dadosAnaliticos.filter(l=> (l.mesM1||0)>0 && (l.mesM0||0)===0),
      headerBg: 'bg-red-50', border: 'border-red-200', color: 'red'
    },
    {
      key: 'novas' as SectionKey,
      title: `Novas (${dadosAnaliticos.filter(l=> (l.mesM1||0)===0 && (l.mesM0||0)>0).length})`,
      subtitle: `Primeira produção em ${meses.M0}`,
      buttonText: 'Novas',
      icon: <TrendingUp className="h-5 w-5"/>,
      data: dadosAnaliticos.filter(l=> (l.mesM1||0)===0 && (l.mesM0||0)>0),
      headerBg: 'bg-green-50', border: 'border-green-200', color: 'green'
    },
    {
      key: 'voltaram' as SectionKey,
      title: `Retomaram Produção (${dadosAnaliticos.filter(l=> (l.mesM2||0)>0 && (l.mesM1||0)===0 && (l.mesM0||0)>0).length})`,
      subtitle: `Retomaram produção após zeramento`,
      buttonText: 'Retomaram',
      icon: <ArrowUpRight className="h-5 w-5"/>,
      data: dadosAnaliticos.filter(l=> (l.mesM2||0)>0 && (l.mesM1||0)===0 && (l.mesM0||0)>0),
      headerBg: 'bg-blue-50', border: 'border-blue-200', color: 'blue'
    },
    {
      key: 'estaveis' as SectionKey,
      title: `Estáveis (${dadosAnaliticos.filter(l=> (l.mesM1||0)>0 && (l.mesM0||0)>0).length})`,
      subtitle: `Mantiveram produção em ${meses.M1} e ${meses.M0}`,
      buttonText: 'Estáveis',
      icon: <Activity className="h-5 w-5"/>,
      data: dadosAnaliticos.filter(l=> (l.mesM1||0)>0 && (l.mesM0||0)>0),
      headerBg: 'bg-purple-50', border: 'border-purple-200', color: 'purple'
    }
  ];

  // exporta Excel
  const exportarExcel = (lista: DadosLoja[], nome: string) => {
    const wb = XLSX.utils.book_new();
    const dados = lista.map(l => ({
      // Informações Básicas
      'Chave Loja': l.chaveLoja,
      'Nome Loja': l.nomeLoja,
      'CNPJ': l.cnpj,
      'Nome PDV': l.nomePdv,
      'Endereço': l.endereco,
      
      // Dados de Contato
      'Nome Contato': l.nomeContato,
      'Telefone': l.telefoneLoja,
      
      // Evolução de Contas
      [`Contas ${meses.M3}`]: l.mesM3 || 0,
      [`Contas ${meses.M2}`]: l.mesM2 || 0,
      [`Contas ${meses.M1}`]: l.mesM1 || 0,
      [`Contas ${meses.M0}`]: l.mesM0 || 0,
      
      // Situação e Datas
      'Situação': l.situacao,
      'Última Transação Contábil': l.dataUltTrxContabil ? formatDate(l.dataUltTrxContabil) : '—',
      'Última Transação Negócio': l.dataUltTrxNegocio ? formatDate(l.dataUltTrxNegocio) : '—',
      'Data Inauguração': l.dataInauguracao ? formatDate(l.dataInauguracao) : '—',
      'Data Certificação': l.dataCertificacao ? formatDate(l.dataCertificacao) : '—',
      'Situação Tablet': l.situacaoTablet,
      
      // Hierarquia
      'Código Agência': l.codAgRelacionamento || '—',
      'Agência Relacionamento': l.agRelacionamento || '—',
      'Gerência Regional': l.gerenciaRegional,
      'Diretoria Regional': l.diretoriaRegional,
      'Multiplicador': l.multiplicadorResponsavel,
      
      // Produtos Habilitados
      'Consignado': l.produtosHabilitados?.consignado ? 'Sim' : 'Não',
      'Microsseguro': l.produtosHabilitados?.microsseguro ? 'Sim' : 'Não',
      'Lime': l.produtosHabilitados?.lime ? 'Sim' : 'Não',
      
      // Tendência
      'Tendência': l.tendencia
    }));

    // Criar e configurar a planilha
    const ws = XLSX.utils.json_to_sheet(dados);
    
    // Ajustar largura das colunas
    const colunas = Object.keys(dados[0]);
    const wscols = colunas.map(() => ({ wch: 20 })); // Largura padrão 20 para todas as colunas
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, nome);
    
    // Nome do arquivo com data atual
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `analise_evolucao_${nome.toLowerCase().replace(/\s+/g, '_')}_${dataAtual}.xlsx`;
    
    XLSX.writeFile(wb, nomeArquivo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0">
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className="flex-none p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">
              Análise Detalhada de Evolução
            </DialogTitle>
          </DialogHeader>

          {/* cards de resumo */}
          <div className="flex-none px-4 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.map(sec => (
                <Card 
                  key={sec.key} 
                  className={`bg-gradient-to-br from-${sec.color}-50 to-white border-${sec.color}-200`}
                >
                  <CardHeader className="px-4 pt-4 pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-semibold">
                        {sec.title.replace(/\(\d+\)/, '').trim()}
                      </CardTitle>
                      <div className={`p-2 rounded-full bg-${sec.color}-50 border border-${sec.color}-100`}>
                        {sec.icon}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className={`text-2xl font-bold text-${sec.color}-800`}>
                      {sec.data.length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {sec.subtitle}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* abas com tabelas */}
          <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as SectionKey)}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="flex-none">
                {sections.map(sec => (
                  <TabsTrigger key={sec.key} value={sec.key}>
                    {sec.icon} {sec.buttonText} ({sec.data.length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Container único da tabela */}
              <div className="flex-1 flex flex-col min-h-0 mt-4">
                {/* Cabeçalho da seção atual */}
                {sections.map(sec => sec.key === activeTab && (
                  <div key={sec.key} className={`flex-none px-6 py-4 rounded-t-lg border ${sec.border} ${sec.headerBg}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`flex items-center gap-2 text-lg font-semibold text-${sec.color}-800`}>
                          {sec.icon}{sec.title}
                        </h3>
                        <p className={`text-sm text-${sec.color}-600 mt-1`}>
                          {sec.subtitle}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        className={`bg-${sec.color}-600 hover:bg-${sec.color}-700 text-white`}
                        onClick={()=>exportarExcel(sec.data, sec.title)}
                      >
                        <Download className="h-4 w-4"/> Exportar
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Container de scroll */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-auto min-h-0 min-w-0 border-x border-b rounded-b-lg"
                >
                  <div className="min-w-[1200px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className={sections.find(s => s.key === activeTab)?.border}>
                          <TableHead className="w-[300px] text-center">Loja</TableHead>
                          {activeTab === 'voltaram' && (
                            <TableHead className="w-[100px] text-center">{meses.M2}</TableHead>
                          )}
                          <TableHead className="w-[100px] text-center">{meses.M1}</TableHead>
                          <TableHead className="w-[100px] text-center">{meses.M0}</TableHead>
                          {activeTab === 'estaveis' && (
                            <TableHead className="w-[120px] text-center">Variação</TableHead>
                          )}
                                            <TableHead className="w-[200px] text-center">Contato</TableHead>
                  <TableHead className="w-[150px] text-center">Telefone</TableHead>
                  <TableHead className="w-[50px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sections.find(s => s.key === activeTab)?.data.map((l, i) => {
                          const sec = sections.find(s => s.key === activeTab)!;
                          const varPct = activeTab === 'estaveis'
                            ? ((l.mesM0 - l.mesM1) / l.mesM1) * 100
                            : 0;
                          return (
                                            <React.Fragment key={l.chaveLoja}>
                  <TableRow className={i % 2 ? 'bg-white' : `bg-${sec.color}-25`}>
                    <TableCell className="p-3">
                      <div className="font-medium">{l.nomeLoja}</div>
                      <div className="text-sm text-gray-500">{l.chaveLoja}</div>
                      <div className="text-xs text-gray-400">{l.cnpj}</div>
                    </TableCell>
                    {activeTab === 'voltaram' && (
                      <TableCell className="p-3 text-center">{fmtNum(l.mesM2||0)}</TableCell>
                    )}
                    <TableCell className="p-3 text-center">{fmtNum(l.mesM1||0)}</TableCell>
                    <TableCell className="p-3 text-center">{fmtNum(l.mesM0||0)}</TableCell>
                    {activeTab === 'estaveis' && (
                      <TableCell className="p-3 text-center">
                        <div className={`flex items-center justify-center gap-2 text-${varPct>=0?'green':'red'}-600`}>
                          <div className={`p-1.5 rounded-full bg-${varPct>=0?'green':'red'}-100`}>
                            {varPct>=0
                              ? <ArrowUpRight className="h-3 w-3"/>
                              : <ArrowDownRight className="h-3 w-3"/>
                            }
                          </div>
                          {fmtPct(Math.abs(varPct))}%
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="p-3 text-center">
                      <div className="font-medium text-sm">{l.nomeContato || l.nomePdv}</div>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <div className="text-sm">{l.telefoneLoja || '—'}</div>
                    </TableCell>
                    <TableCell className="p-3 text-right w-[50px]">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Ver detalhes"
                        onClick={() => setLojaExpandida(l.chaveLoja === lojaExpandida ? null : l.chaveLoja)}
                        className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                      >
                        <Info size={16} className="text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {lojaExpandida === l.chaveLoja && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={7} className="py-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Informações da Loja</h4>
                            <ul className="space-y-1.5">
                              <li className="text-sm"><span className="font-medium">Localização:</span> {l.endereco}</li>
                              <li className="text-sm"><span className="font-medium">Contato:</span> {l.nomePdv}</li>
                              <li className="text-sm"><span className="font-medium">Telefone:</span> {l.telefoneLoja}</li>
                              <li className="text-sm"><span className="font-medium">Data Certificação:</span> {l.dataCertificacao ? formatDate(l.dataCertificacao) : '—'}</li>
                              <li className="text-sm"><span className="font-medium">Situação Tablet:</span> {l.situacaoTablet}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Hierarquia</h4>
                            <ul className="space-y-1.5">
                              <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {l.diretoriaRegional}</li>
                              <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {l.gerenciaRegional}</li>
                              <li className="text-sm"><span className="font-medium">Multiplicador:</span> {l.multiplicadorResponsavel}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Produtos Habilitados</h4>
                            <div className="flex flex-col space-y-2">
                              <div className={`px-2.5 py-1 rounded-full text-xs ${l.produtosHabilitados?.consignado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Consignado
                              </div>
                              <div className={`px-2.5 py-1 rounded-full text-xs ${l.produtosHabilitados?.microsseguro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Microsseguro
                              </div>
                              <div className={`px-2.5 py-1 rounded-full text-xs ${l.produtosHabilitados?.lime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                Lime
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Footer fixo */}
                {sections.find(s => s.key === activeTab)?.data.length! > 0 && (
                  <div className="flex-none p-3 bg-gray-50 border-x border-b rounded-b-lg text-center text-sm">
                    Total: {sections.find(s => s.key === activeTab)?.data.length} lojas
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnaliseEvolucaoModal;
