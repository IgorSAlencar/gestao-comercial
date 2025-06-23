import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableStatus } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Info, Plus, Search, Download, TrendingUp, Activity, AlertTriangle, CheckCircle, AlertCircle, List, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { hotListApi, HotListItem } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { TratativaModal } from '@/components/hotlist/TratativaModal';
import HotlistFilters from '@/components/hotlist/HotlistFilters';
import HotlistGerencial from '@/components/hotlist/HotlistGerencial';

// Função para formatação contábil
const formatarNumero = (numero: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numero);
};

interface FiltrosHotList {
  cnpj: string;
  nomeLoja: string;
  localizacao: string;
  mercado: string;
  pracaPresenca: string;
  situacao: string;
  diretoriaRegional: string;
  gerenciaRegional: string;
  agencia: string;
  pa: string;
  supervisor: string;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pendente':
      return 'Pendente Tratativa';
    case 'tratada':
      return 'Tratado';
    case 'realizar':
      return 'Realizar';
    case 'bloqueada':
      return 'Bloqueada';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pendente':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'tratada':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'realizar':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'bloqueada':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const ITEMS_PER_PAGE = 20;

const Hotlist: React.FC = () => {
  const { user } = useAuth();
  const [dados, setDados] = useState<HotListItem[]>([]);
  const [dadosFiltrados, setDadosFiltrados] = useState<HotListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ coluna: keyof HotListItem | null; direcao: 'asc' | 'desc' }>({
    coluna: null,
    direcao: 'asc'
  });
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supervisores, setSupervisores] = useState<{id: string, name: string}[]>([]);
  const [tratativaModalOpen, setTratativaModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HotListItem | null>(null);
  const [showGerencial, setShowGerencial] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  // Novo estado para armazenar os totais originais
  const [totais, setTotais] = useState({
    total: 0,
    tratadas: 0,
    pendentes: 0,
    prospectadas: 0
  });

  const form = useForm<FiltrosHotList>({
    defaultValues: {
      cnpj: "",
      nomeLoja: "",
      localizacao: "",
      mercado: "",
      pracaPresenca: "",
      situacao: "",
      diretoriaRegional: "",
      gerenciaRegional: "",
      agencia: "",
      pa: "",
      supervisor: "",
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        const hotListData = await hotListApi.getHotList(user.id);
        setDados(hotListData);
        setDadosFiltrados(hotListData);

        // Calcular totais originais
        setTotais({
          total: hotListData.length,
          tratadas: hotListData.filter(d => d.situacao === 'tratada').length,
          pendentes: hotListData.filter(d => d.situacao === 'pendente').length,
          prospectadas: hotListData.filter(d => d.situacao === 'realizar').length
        });

        // Extrair lista única de supervisores
        const uniqueSupervisors = Array.from(new Set(hotListData.map(item => item.supervisor_id)))
          .map(supervisorId => {
            const item = hotListData.find(d => d.supervisor_id === supervisorId);
            return {
              id: supervisorId,
              name: item?.supervisor_name || 'Supervisor não encontrado'
            };
          });
        setSupervisores(uniqueSupervisors);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da HotList",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const watchCnpj = form.watch('cnpj');
  const watchNomeLoja = form.watch('nomeLoja');

  useEffect(() => {
    const filtrados = dados.filter(loja => {
      const busca = watchCnpj.toLowerCase();
      return (
        loja.CNPJ.toLowerCase().includes(busca) ||
        loja.NOME_LOJA.toLowerCase().includes(busca)
      );
    });
    setDadosFiltrados(filtrados);
  }, [watchCnpj, dados]);

  const aplicarFiltros = (filtros: any) => {
    let filtrados = [...dados];

    // Aplicar filtro de busca geral
    if (filtros.searchTerm) {
      const searchLower = filtros.searchTerm.toLowerCase();
      filtrados = filtrados.filter(loja => 
        loja.CNPJ.toLowerCase().includes(searchLower) ||
        loja.NOME_LOJA.toLowerCase().includes(searchLower) ||
        loja.LOCALIZACAO.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtros de múltipla seleção
    if (filtros.mercado?.length > 0) {
      filtrados = filtrados.filter(loja => filtros.mercado.includes(loja.MERCADO));
    }
    if (filtros.situacao?.length > 0) {
      filtrados = filtrados.filter(loja => filtros.situacao.includes(loja.situacao));
    }
    if (filtros.pracaPresenca?.length > 0) {
      filtrados = filtrados.filter(loja => filtros.pracaPresenca.includes(loja.PRACA_PRESENCA));
    }
    if (filtros.supervisor?.length > 0) {
      filtrados = filtrados.filter(loja => filtros.supervisor.includes(loja.supervisor_id));
    }
    if (filtros.diretoriaRegional?.length > 0) {
      filtrados = filtrados.filter(loja => filtros.diretoriaRegional.includes(loja.DIRETORIA_REGIONAL));
    }
    if (filtros.gerenciaRegional?.length > 0) {
      filtrados = filtrados.filter(loja => filtros.gerenciaRegional.includes(loja.GERENCIA_REGIONAL));
    }
    if (filtros.agenciaPa?.length > 0) {
      filtrados = filtrados.filter(loja => 
        filtros.agenciaPa.includes(loja.AGENCIA) || filtros.agenciaPa.includes(loja.PA)
      );
    }

    setDadosFiltrados(filtrados);
    // Resetar para a primeira página quando aplicar filtros
    setCurrentPage(1);
  };

  const limparFiltros = () => {
    form.reset();
    setDadosFiltrados(dados);
  };

  const exportarParaExcel = () => {
    const dadosParaExportar = dadosFiltrados.map(loja => ({
      'CNPJ': loja.CNPJ,
      'Nome Loja': loja.NOME_LOJA,
      'Localização': loja.LOCALIZACAO,
      'Mercado': loja.MERCADO,
      'Praça Presença': loja.PRACA_PRESENCA,
      'Situação': loja.situacao,
      'Diretoria Regional': loja.DIRETORIA_REGIONAL,
      'Gerência Regional': loja.GERENCIA_REGIONAL,
      'PA': loja.PA,
      'Gerente PJ': loja.GERENTE_PJ
    }));

    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `HotList - ${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleOrdenacao = (coluna: keyof HotListItem) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleLojaExpandida = (cnpj: string) => {
    setLojaExpandida(lojaExpandida === cnpj ? null : cnpj);
  };

  const dadosOrdenados = [...dadosFiltrados].sort((a, b) => {
    if (!ordenacao.coluna) return 0;
    
    const valorA = a[ordenacao.coluna];
    const valorB = b[ordenacao.coluna];
    
    if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCardClick = (situacao: string) => {
    if (situacao === 'all') {
      setDadosFiltrados(dados);
    } else {
      const filtrados = dados.filter(loja => loja.situacao === situacao);
      setDadosFiltrados(filtrados);
    }
  };

  const handleOpenTratativa = (item: HotListItem) => {
    setSelectedItem(item);
    setTratativaModalOpen(true);
  };

  const handleTratativaSuccess = async () => {
    // Recarregar os dados após registrar uma tratativa
    if (!user) return;
    const hotListData = await hotListApi.getHotList(user.id);
    setDados(hotListData);
    setDadosFiltrados(hotListData);
    
    // Atualizar os totais
    setTotais({
      total: hotListData.length,
      tratadas: hotListData.filter(d => d.situacao === 'tratada').length,
      pendentes: hotListData.filter(d => d.situacao === 'pendente').length,
      prospectadas: hotListData.filter(d => d.situacao === 'realizar').length
    });
  };

  // Obter os dados da página atual
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return dadosOrdenados.slice(startIndex, endIndex);
  };

  // Calcular o total de páginas
  const totalPages = Math.ceil(dadosFiltrados.length / ITEMS_PER_PAGE);

  // Navegar entre páginas
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setLojaExpandida(null); // Fecha qualquer loja expandida ao mudar de página
    }
  };

  // Verificar se o usuário é supervisor
  const isSupervisor = user?.role === 'supervisor';

  // Verificar se o usuário tem perfil gerencial
  const isGerencial = user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'coordenador';

  const handleSupervisorClick = (supervisorId: string) => {
    const filtrados = dados.filter(item => item.supervisor_id === supervisorId);
    setDadosFiltrados(filtrados);
    setSelectedSupervisor(supervisorId);
    setCurrentPage(1);
    toast({
      title: "Filtro aplicado",
      description: `Exibindo leads do supervisor selecionado`,
    });
  };

  const handleClearSupervisorFilter = () => {
    setDadosFiltrados(dados);
    setSelectedSupervisor(null);
    setCurrentPage(1);
    toast({
      title: "Filtro removido",
      description: "Exibindo todos os leads",
    });
  };

  const toggleGerencialView = () => {
    setShowGerencial(!showGerencial);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">HotList</h1>
            <p className="text-gray-500">Lista de Prospecção - {user?.name}</p>
          </div>
          {isGerencial && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={toggleGerencialView}
            >
              <BarChart2 className="h-5 w-5" />
              {showGerencial ? 'Visão Normal' : 'Visão Gerencial'}
            </Button>
          )}
        </div>

        {/* Exibir o painel gerencial apenas para usuários com perfil adequado e quando showGerencial for true */}
        {isGerencial && showGerencial && (
          <HotlistGerencial 
            dados={dados} 
            onSupervisorClick={handleSupervisorClick}
            onClearFilter={handleClearSupervisorFilter}
            supervisorSelecionado={selectedSupervisor}
          />
        )}

        {/* Mostrar os cards e a tabela apenas quando não estiver em modo gerencial */}
        {!showGerencial && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card 
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => handleCardClick('all')}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-blue-900">Total de Leads</CardTitle>
                    <div className="p-2 bg-blue-200 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-blue-900">{formatarNumero(totais.total)}</p>
                    <p className="text-sm text-blue-700 mt-1">Leads ativos no sistema</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => handleCardClick('tratada')}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-green-900">Leads Tratadas</CardTitle>
                    <div className="p-2 bg-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-green-900">{formatarNumero(totais.tratadas)}</p>
                    <p className="text-sm text-green-700 mt-1">Leads já processados</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => handleCardClick('pendente')}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-amber-900">Leads Pendentes</CardTitle>
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-amber-900">{formatarNumero(totais.pendentes)}</p>
                    <p className="text-sm text-amber-700 mt-1">Aguardando tratativa</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => handleCardClick('realizar')}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-purple-900">Leads Prospectadas</CardTitle>
                    <div className="p-2 bg-purple-200 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-purple-900">{formatarNumero(totais.prospectadas)}</p>
                    <p className="text-sm text-purple-700 mt-1">Em prospecção</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <HotlistFilters 
                  dados={dados}
                  onFilter={aplicarFiltros}
                  onExport={exportarParaExcel}
                  isSupervisor={isSupervisor}
                />

                <div className="overflow-x-auto mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrdenacao('NOME_LOJA')}
                        >
                          <div className="flex items-center gap-1">
                            Nome / CNPJ
                            {ordenacao.coluna === 'NOME_LOJA' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleOrdenacao('LOCALIZACAO')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Localização
                            {ordenacao.coluna === 'LOCALIZACAO' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleOrdenacao('MERCADO')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Mercado
                            {ordenacao.coluna === 'MERCADO' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleOrdenacao('PRACA_PRESENCA')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Praça Presença
                            {ordenacao.coluna === 'PRACA_PRESENCA' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleOrdenacao('situacao')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Situação
                            {ordenacao.coluna === 'situacao' && (
                              <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        {!isSupervisor && (
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-100 text-center"
                            onClick={() => handleOrdenacao('supervisor_name')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Supervisor
                              {ordenacao.coluna === 'supervisor_name' && (
                                <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                        )}
                        <TableHead className="w-[120px] text-center">
                          <div className="flex items-center justify-center">Ações</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCurrentPageData().map((loja, index) => (
                        <React.Fragment key={index}>
                          <TableRow>
                            <TableCell>
                              <div className="font-medium">{loja.NOME_LOJA}</div>
                              <div className="text-xs text-gray-500">{loja.CNPJ}</div>
                            </TableCell>
                            <TableCell className="text-center">{loja.LOCALIZACAO}</TableCell>
                            <TableCell className="text-center">{loja.MERCADO}</TableCell>
                            <TableCell className="text-center">{loja.PRACA_PRESENCA}</TableCell>
                            <TableCell className="text-center">
                              <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loja.situacao)}`}>
                                {getStatusLabel(loja.situacao)}
                              </div>
                            </TableCell>
                            {!isSupervisor && (
                              <TableCell className="text-center">
                                <div className="text-sm text-gray-600">{loja.supervisor_name}</div>
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  title="Ver detalhes"
                                  className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                                  onClick={() => toggleLojaExpandida(loja.CNPJ)}
                                >
                                  <Info size={16} className="text-blue-600" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  title="Adicionar tratativa"
                                  className="bg-green-50 border-green-200 hover:bg-green-100"
                                  onClick={() => handleOpenTratativa(loja)}
                                >
                                  <Plus size={16} className="text-green-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {lojaExpandida === loja.CNPJ && (
                            <TableRow className="bg-gray-50">
                              <TableCell colSpan={!isSupervisor ? 7 : 6} className="py-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Informações da Loja</h4>
                                    <ul className="space-y-1.5">
                                      <li className="text-sm"><span className="font-medium">Localização:</span> {loja.LOCALIZACAO}</li>
                                      <li className="text-sm"><span className="font-medium">Mercado:</span> {loja.MERCADO}</li>
                                      <li className="text-sm"><span className="font-medium">Praça Presença:</span> {loja.PRACA_PRESENCA}</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Hierarquia</h4>
                                    <ul className="space-y-1.5">
                                      <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {loja.DIRETORIA_REGIONAL}</li>
                                      <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {loja.GERENCIA_REGIONAL}</li>
                                      <li className="text-sm"><span className="font-medium">Agência:</span> {loja.AGENCIA}</li>
                                      <li className="text-sm"><span className="font-medium">PA:</span> {loja.PA}</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Responsáveis</h4>
                                    <ul className="space-y-1.5">
                                      {!isSupervisor && (
                                        <li className="text-sm"><span className="font-medium">Supervisor:</span> {loja.supervisor_name}</li>
                                      )}
                                      <li className="text-sm"><span className="font-medium">Gerente PJ:</span> {loja.GERENTE_PJ}</li>
                                    </ul>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <div>
                      Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, dadosFiltrados.length)} de {dadosFiltrados.length} leads
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-2">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedItem && (
        <TratativaModal
          isOpen={tratativaModalOpen}
          onClose={() => setTratativaModalOpen(false)}
          onSuccess={handleTratativaSuccess}
          hotlistItem={selectedItem}
        />
      )}
    </div>
  );
};

export default Hotlist; 