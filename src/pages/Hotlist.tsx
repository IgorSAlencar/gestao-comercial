import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableStatus } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Info, Plus, Search, Download, TrendingUp, Activity, AlertTriangle, CheckCircle, AlertCircle, List } from 'lucide-react';
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { hotListApi, HotListItem } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { TratativaModal } from '@/components/hotlist/TratativaModal';

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

const Hotlist: React.FC = () => {
  const { user } = useAuth();
  const [dados, setDados] = useState<HotListItem[]>([]);
  const [dadosFiltrados, setDadosFiltrados] = useState<HotListItem[]>([]);
  const [ordenacao, setOrdenacao] = useState<{ coluna: keyof HotListItem | null; direcao: 'asc' | 'desc' }>({
    coluna: null,
    direcao: 'asc'
  });
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supervisores, setSupervisores] = useState<{id: string, name: string}[]>([]);
  const [tratativaModalOpen, setTratativaModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HotListItem | null>(null);

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

  const totalLeads = dadosFiltrados.length;
  const leadsTratadas = dadosFiltrados.filter(d => d.situacao === 'tratada').length;
  const leadsPendentes = dadosFiltrados.filter(d => d.situacao === 'pendente').length;
  const leadsProspectadas = dadosFiltrados.filter(d => d.situacao === 'realizar').length;

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

  const aplicarFiltros = (values: FiltrosHotList) => {
    const filtrados = dados.filter(loja => {
      if (values.localizacao && !loja.LOCALIZACAO.toLowerCase().includes(values.localizacao.toLowerCase())) return false;
      if (values.mercado && values.mercado !== "all" && loja.MERCADO !== values.mercado) return false;
      if (values.pracaPresenca && values.pracaPresenca !== "all" && loja.PRACA_PRESENCA !== values.pracaPresenca) return false;
      if (values.situacao && values.situacao !== "all" && loja.situacao !== values.situacao) return false;
      if (values.diretoriaRegional && values.diretoriaRegional !== "all" && !loja.DIRETORIA_REGIONAL.includes(values.diretoriaRegional)) return false;
      if (values.gerenciaRegional && values.gerenciaRegional !== "all" && !loja.GERENCIA_REGIONAL.includes(values.gerenciaRegional)) return false;
      if (values.agencia && values.agencia !== "all" && !loja.AGENCIA.includes(values.agencia)) return false;
      if (values.pa && values.pa !== "all" && !loja.PA.includes(values.pa)) return false;
      if (values.supervisor && values.supervisor !== "all" && loja.supervisor_id !== values.supervisor) return false;
      return true;
    });
    setDadosFiltrados(filtrados);
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
    form.setValue('situacao', situacao);
    aplicarFiltros(form.getValues());
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
        <div>
          <h1 className="text-3xl font-bold">HotList</h1>
          <p className="text-gray-500">Lista de Prospecção - {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                <p className="text-3xl font-bold text-blue-900">{totalLeads}</p>
                <p className="text-sm text-blue-700 mt-1">Leads ativos no sistema</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                <p className="text-3xl font-bold text-green-900">{leadsTratadas}</p>
                <p className="text-sm text-green-700 mt-1">Leads já processados</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                <p className="text-3xl font-bold text-amber-900">{leadsPendentes}</p>
                <p className="text-sm text-amber-700 mt-1">Aguardando tratativa</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                <p className="text-3xl font-bold text-purple-900">{leadsProspectadas}</p>
                <p className="text-sm text-purple-700 mt-1">Em prospecção</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(aplicarFiltros)} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Search size={16} />
                      Filtrar lojas
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportarParaExcel}
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Exportar Excel
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Buscar por CNPJ ou Nome da Loja" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                form.setValue('cnpj', e.target.value);
                                form.setValue('nomeLoja', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="localizacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Localização" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mercado"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Mercado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="Supermercado">Supermercado</SelectItem>
                              <SelectItem value="Mercado">Mercado</SelectItem>
                              <SelectItem value="Atacado">Atacado</SelectItem>
                              <SelectItem value="Farmácia">Farmácia</SelectItem>
                              <SelectItem value="Posto">Posto</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pracaPresenca"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Praça Presença" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="SIM">Sim</SelectItem>
                              <SelectItem value="NAO">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="situacao"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Situação" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="pendente">Pendente Tratativa</SelectItem>
                              <SelectItem value="tratada">Tratado</SelectItem>
                              <SelectItem value="realizar">Realizar</SelectItem>
                              <SelectItem value="bloqueada">Bloqueada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diretoriaRegional"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Diretoria Regional" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {Array.from(new Set(dados.map(loja => loja.DIRETORIA_REGIONAL))).map(dr => (
                                <SelectItem key={dr} value={dr}>{dr}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gerenciaRegional"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Gerência Regional" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {Array.from(new Set(dados.map(loja => loja.GERENCIA_REGIONAL))).map(gr => (
                                <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="agencia"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Agência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {Array.from(new Set(dados.map(loja => loja.AGENCIA))).map(ag => (
                                <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pa"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="PA" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {Array.from(new Set(dados.map(loja => loja.PA))).map(pa => (
                                <SelectItem key={pa} value={pa}>{pa}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supervisor"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Supervisor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {supervisores.map(supervisor => (
                                <SelectItem key={supervisor.id} value={supervisor.id}>
                                  {supervisor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={limparFiltros}
                    >
                      Limpar
                    </Button>
                    <Button type="submit">
                      Aplicar Filtros
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <div className="overflow-x-auto">
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
                    <TableHead className="w-[120px] text-center">
                      <div className="flex items-center justify-center">Ações</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosOrdenados.map((loja, index) => (
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
                        <TableCell className="text-center">
                          <div className="text-sm text-gray-600">{loja.supervisor_name}</div>
                        </TableCell>
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
                          <TableCell colSpan={6} className="py-3">
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
                                  <li className="text-sm"><span className="font-medium">Supervisor:</span> {loja.supervisor_name}</li>
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
            </div>
          </CardContent>
        </Card>
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