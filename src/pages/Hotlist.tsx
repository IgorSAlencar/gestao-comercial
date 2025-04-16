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

interface DadosHotList {
  CNPJ: string;
  NOME_LOJA: string;
  LOCALIZACAO: string;
  AGENCIA: string;
  MERCADO: string;
  PRACA_PRESENCA: 'SIM' | 'NAO';
  situacao: 'pendente' | 'realizar' | 'tratada' | 'bloqueada';
  DIRETORIA_REGIONAL: string;
  GERENCIA_REGIONAL: string;
  PA: string;
  GERENTE_PJ: string;
}

const dadosFicticios: DadosHotList[] = [
  {
    CNPJ: "12.345.678/0001-99",
    NOME_LOJA: "Supermercado Central",
    LOCALIZACAO: "São Paulo - SP",
    AGENCIA: "0001",
    MERCADO: "Supermercado",
    PRACA_PRESENCA: "SIM",
    situacao: "pendente",
    DIRETORIA_REGIONAL: "DR São Paulo",
    GERENCIA_REGIONAL: "GR Centro",
    PA: "PA 001",
    GERENTE_PJ: "João Silva"
  },
  {
    CNPJ: "23.456.789/0001-88",
    NOME_LOJA: "Mercado do Bairro",
    LOCALIZACAO: "São Paulo - SP",
    AGENCIA: "0002",
    MERCADO: "Mercado",
    PRACA_PRESENCA: "NAO",
    situacao: "realizar",
    DIRETORIA_REGIONAL: "DR São Paulo",
    GERENCIA_REGIONAL: "GR Sul",
    PA: "PA 002",
    GERENTE_PJ: "Maria Santos"
  },
  {
    CNPJ: "34.567.890/0001-77",
    NOME_LOJA: "Supermercado Popular",
    LOCALIZACAO: "São Paulo - SP",
    AGENCIA: "0003",
    MERCADO: "Supermercado",
    PRACA_PRESENCA: "SIM",
    situacao: "tratada",
    DIRETORIA_REGIONAL: "DR São Paulo",
    GERENCIA_REGIONAL: "GR Norte",
    PA: "PA 003",
    GERENTE_PJ: "Pedro Oliveira"
  },
  {
    CNPJ: "45.678.901/0001-66",
    NOME_LOJA: "Mercado Express",
    LOCALIZACAO: "São Paulo - SP",
    AGENCIA: "0004",
    MERCADO: "Mercado",
    PRACA_PRESENCA: "NAO",
    situacao: "bloqueada",
    DIRETORIA_REGIONAL: "DR São Paulo",
    GERENCIA_REGIONAL: "GR Leste",
    PA: "PA 004",
    GERENTE_PJ: "Ana Costa"
  },
  {
    CNPJ: "56.789.012/0001-55",
    NOME_LOJA: "Supermercado Familiar",
    LOCALIZACAO: "São Paulo - SP",
    AGENCIA: "0005",
    MERCADO: "Supermercado",
    PRACA_PRESENCA: "SIM",
    situacao: "pendente",
    DIRETORIA_REGIONAL: "DR São Paulo",
    GERENCIA_REGIONAL: "GR Oeste",
    PA: "PA 005",
    GERENTE_PJ: "Carlos Ferreira"
  }
];

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
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pendente':
      return 'Pendente Tratativa';
    case 'tratado':
      return 'Tratado';
    case 'prospectado':
      return 'Prospectado';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pendente':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'tratado':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'prospectado':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const Hotlist: React.FC = () => {
  const { user } = useAuth();
  const [dados, setDados] = useState<DadosHotList[]>(dadosFicticios);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosHotList[]>(dadosFicticios);
  const [ordenacao, setOrdenacao] = useState<{ coluna: keyof DadosHotList | null; direcao: 'asc' | 'desc' }>({
    coluna: null,
    direcao: 'asc'
  });
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);

  const totalLeads = dadosFicticios.length;
  const leadsTratadas = dadosFicticios.filter(d => d.situacao === 'tratada').length;
  const leadsPendentes = dadosFicticios.filter(d => d.situacao === 'pendente').length;
  const leadsProspectadas = dadosFicticios.filter(d => d.situacao === 'realizar').length;

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
    }
  });

  const watchCnpj = form.watch('cnpj');
  const watchNomeLoja = form.watch('nomeLoja');

  useEffect(() => {
    const filtrados = dadosFicticios.filter(loja => {
      const busca = watchCnpj.toLowerCase();
      return (
        loja.CNPJ.toLowerCase().includes(busca) ||
        loja.NOME_LOJA.toLowerCase().includes(busca)
      );
    });
    setDados(filtrados);
  }, [watchCnpj]);

  const aplicarFiltros = (values: FiltrosHotList) => {
    const filtrados = dadosFicticios.filter(loja => {
      if (values.localizacao && !loja.LOCALIZACAO.toLowerCase().includes(values.localizacao.toLowerCase())) return false;
      if (values.mercado && values.mercado !== "all" && loja.MERCADO !== values.mercado) return false;
      if (values.pracaPresenca && values.pracaPresenca !== "all" && loja.PRACA_PRESENCA !== values.pracaPresenca) return false;
      if (values.situacao && values.situacao !== "all" && loja.situacao !== values.situacao) return false;
      if (values.diretoriaRegional && values.diretoriaRegional !== "all" && !loja.DIRETORIA_REGIONAL.includes(values.diretoriaRegional)) return false;
      if (values.gerenciaRegional && values.gerenciaRegional !== "all" && !loja.GERENCIA_REGIONAL.includes(values.gerenciaRegional)) return false;
      if (values.agencia && values.agencia !== "all" && !loja.AGENCIA.includes(values.agencia)) return false;
      if (values.pa && values.pa !== "all" && !loja.PA.includes(values.pa)) return false;
      return true;
    });
    setDados(filtrados);
  };

  const limparFiltros = () => {
    form.reset();
    setDados(dadosFicticios);
  };

  const exportarParaExcel = () => {
    const dadosParaExportar = dados.map(loja => ({
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

  const handleOrdenacao = (coluna: keyof DadosHotList) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleLojaExpandida = (cnpj: string) => {
    setLojaExpandida(lojaExpandida === cnpj ? null : cnpj);
  };

  const dadosOrdenados = [...dados].sort((a, b) => {
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

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">HotList</h1>
          <p className="text-gray-500">Lista de Prospecção - {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCardClick('all')}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Total de Leads</CardTitle>
                <Activity size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-blue-800">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCardClick('tratada')}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Leads Tratadas e Pendentes</CardTitle>
                <AlertTriangle size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tratadas</p>
                    <p className="text-xl font-semibold text-green-800">{leadsTratadas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-xl font-semibold text-amber-800">{leadsPendentes}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCardClick('realizar')}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Leads Prospectadas</CardTitle>
                <TrendingUp size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                <div className="bg-green-100 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prospectadas</p>
                  <p className="text-xl font-semibold text-green-800">{leadsProspectadas}</p>
                </div>
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
                            <Input placeholder="Localiza��ão" {...field} />
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
                              <SelectItem value="tratado">Tratado</SelectItem>
                              <SelectItem value="prospectado">Prospectado</SelectItem>
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
                              {Array.from(new Set(dadosFicticios.map(loja => loja.DIRETORIA_REGIONAL))).map(dr => (
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
                              {Array.from(new Set(dadosFicticios.map(loja => loja.GERENCIA_REGIONAL))).map(gr => (
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
                              {Array.from(new Set(dadosFicticios.map(loja => loja.AGENCIA))).map(ag => (
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
                              {Array.from(new Set(dadosFicticios.map(loja => loja.PA))).map(pa => (
                                <SelectItem key={pa} value={pa}>{pa}</SelectItem>
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
    </div>
  );
};

export default Hotlist;
