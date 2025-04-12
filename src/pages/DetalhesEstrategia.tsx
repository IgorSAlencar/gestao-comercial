import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ChartBar, TrendingUp, AlertTriangle, TrendingDown, Activity, Plus, MoreHorizontal, Info, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableStatus,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormField,
  FormItem,
  FormControl
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";

interface DadosLoja {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  mesM3: number;
  mesM2: number;
  mesM1: number;
  mesM0: number;
  situacao: "ativa" | "bloqueada" | "em processo de encerramento";
  dataUltTrxContabil: Date;
  dataUltTrxNegocio: Date;
  dataBloqueio?: Date;
  dataInauguracao: Date;
  agencia: string;
  telefoneLoja: string;
  nomeContato: string;
  gerenciaRegional: string;
  diretoriaRegional: string;
  tendencia: "queda" | "atencao" | "estavel" | "comecando";
  endereco?: string;
  nomePdv?: string;
  multiplicadorResponsavel?: string;
  dataCertificacao?: Date;
  situacaoTablet?: "Instalado" | "Retirado" | "S.Tablet";
  produtosHabilitados?: {
    consignado: boolean;
    microsseguro: boolean;
    lime: boolean;
  };
}

interface DadosEstrategia {
  titulo: string;
  visaoGeral: string;
  oportunidades: {
    titulo: string;
    descricao: string;
  }[];
  acoes: {
    titulo: string;
    descricao: string;
    prioridade: "alta" | "media" | "baixa";
  }[];
  desempenho: {
    meta: number;
    realizado: number;
    anterior: number;
  };
  dadosAnaliticos?: DadosLoja[];
}

interface FiltrosLoja {
  chaveLoja: string;
  cnpj: string;
  nomeLoja: string;
  situacao: string;
  agencia: string;
  gerenciaRegional: string;
  diretoriaRegional: string;
}

const dadosSimulados: Record<string, DadosEstrategia> = {
  "credito": {
    titulo: "Estratégia de Crédito",
    visaoGeral: "Aumentar a oferta de produtos de crédito para clientes com bom histórico financeiro.",
    oportunidades: [
      {
        titulo: "Expansão de Crédito Pessoal",
        descricao: "Foco em ofertas personalizadas para clientes com bom histórico."
      },
      {
        titulo: "Consignado em Empresas Parceiras",
        descricao: "Ampliar parcerias com empresas para oferta de crédito consignado."
      }
    ],
    acoes: [
      {
        titulo: "Campanha de Marketing Direcionada",
        descricao: "Implementar campanha de marketing focada em crédito pessoal.",
        prioridade: "alta"
      },
      {
        titulo: "Treinamento da Equipe de Vendas",
        descricao: "Realizar treinamento específico sobre produtos de crédito.",
        prioridade: "media"
      }
    ],
    desempenho: {
      meta: 100,
      realizado: 75,
      anterior: 60
    }
  },
  "abertura-conta": {
    titulo: "Estratégia de Abertura de Contas",
    visaoGeral: "Aumentar o número de novas contas abertas com foco em jovens e pequenos empresários.",
    oportunidades: [
      {
        titulo: "Universitários",
        descricao: "Parcerias com universidades para abertura de contas para estudantes."
      },
      {
        titulo: "Pequenos Empresários",
        descricao: "Foco em facilitar abertura de contas para pequenos negócios."
      },
      {
        titulo: "Indicações de Clientes",
        descricao: "Programa de recompensas para clientes que indicarem novos correntistas."
      }
    ],
    acoes: [
      {
        titulo: "Campanha Digital",
        descricao: "Implementar campanha em redes sociais voltada para público jovem.",
        prioridade: "alta"
      },
      {
        titulo: "Visitas a Universidades",
        descricao: "Agendar visitas promocionais em universidades parceiras.",
        prioridade: "media"
      },
      {
        titulo: "Simplificação de Processos",
        descricao: "Revisar e simplificar processo de abertura de conta digital.",
        prioridade: "baixa"
      }
    ],
    desempenho: {
      meta: 100,
      realizado: 60,
      anterior: 45
    },
    dadosAnaliticos: [
      {
        chaveLoja: "5001",
        cnpj: "12.345.678/0001-99",
        nomeLoja: "Loja Centro",
        mesM3: 12,
        mesM2: 10,
        mesM1: 15,
        mesM0: 14,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-27"),
        dataInauguracao: new Date("2020-05-15"),
        agencia: "0001",
        telefoneLoja: "(11) 3456-7890",
        nomeContato: "João Silva",
        gerenciaRegional: "São Paulo Centro",
        diretoriaRegional: "Sudeste",
        tendencia: "estavel",
        endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP",
        nomePdv: "Centro SP",
        multiplicadorResponsavel: "Carlos Oliveira",
        dataCertificacao: new Date("2022-10-05"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: false
        }
      },
      {
        chaveLoja: "5002",
        cnpj: "23.456.789/0001-88",
        nomeLoja: "Loja Shopping Vila Olímpia",
        mesM3: 8,
        mesM2: 6,
        mesM1: 4,
        mesM0: 5,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-26"),
        dataUltTrxNegocio: new Date("2023-03-28"),
        dataInauguracao: new Date("2021-11-20"),
        agencia: "0002",
        telefoneLoja: "(11) 3456-7891",
        nomeContato: "Maria Santos",
        gerenciaRegional: "São Paulo Zona Sul",
        diretoriaRegional: "Sudeste",
        tendencia: "queda",
        endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP",
        nomePdv: "Vila Olímpia",
        multiplicadorResponsavel: "Ana Pereira",
        dataCertificacao: new Date("2022-09-15"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: false,
          lime: true
        }
      },
      {
        chaveLoja: "5003",
        cnpj: "34.567.890/0001-77",
        nomeLoja: "Loja Campinas Shopping",
        mesM3: 5,
        mesM2: 7,
        mesM1: 9,
        mesM0: 13,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-25"),
        dataInauguracao: new Date("2019-03-10"),
        agencia: "0015",
        telefoneLoja: "(19) 3456-7892",
        nomeContato: "Pedro Almeida",
        gerenciaRegional: "Campinas",
        diretoriaRegional: "Interior SP",
        tendencia: "comecando",
        endereco: "Campinas Shopping, Loja 67 - Campinas/SP",
        nomePdv: "Campinas Shop",
        multiplicadorResponsavel: "Roberto Costa",
        dataCertificacao: new Date("2022-11-20"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      },
      {
        chaveLoja: "5004",
        cnpj: "45.678.901/0001-66",
        nomeLoja: "Loja Rio Branco",
        mesM3: 10,
        mesM2: 8,
        mesM1: 6,
        mesM0: 5,
        situacao: "bloqueada",
        dataUltTrxContabil: new Date("2023-03-01"),
        dataUltTrxNegocio: new Date("2023-03-01"),
        dataBloqueio: new Date("2023-03-02"),
        dataInauguracao: new Date("2018-06-05"),
        agencia: "0032",
        telefoneLoja: "(21) 3456-7893",
        nomeContato: "Fernanda Lima",
        gerenciaRegional: "Rio de Janeiro Centro",
        diretoriaRegional: "Rio de Janeiro",
        tendencia: "queda",
        endereco: "Av. Rio Branco, 156 - Centro, Rio de Janeiro/RJ",
        nomePdv: "Rio Branco",
        multiplicadorResponsavel: "Paulo Mendes",
        dataCertificacao: new Date("2021-05-10"),
        situacaoTablet: "Retirado",
        produtosHabilitados: {
          consignado: false,
          microsseguro: false,
          lime: false
        }
      },
      {
        chaveLoja: "5005",
        cnpj: "56.789.012/0001-55",
        nomeLoja: "Loja Salvador Shopping",
        mesM3: 7,
        mesM2: 7,
        mesM1: 8,
        mesM0: 6,
        situacao: "em processo de encerramento",
        dataUltTrxContabil: new Date("2023-03-10"),
        dataUltTrxNegocio: new Date("2023-03-15"),
        dataInauguracao: new Date("2017-09-22"),
        agencia: "0048",
        telefoneLoja: "(71) 3456-7894",
        nomeContato: "Luciana Costa",
        gerenciaRegional: "Salvador",
        diretoriaRegional: "Nordeste",
        tendencia: "queda",
        endereco: "Salvador Shopping, Loja 33 - Salvador/BA",
        nomePdv: "Salvador Shop",
        multiplicadorResponsavel: "Marcos Vieira",
        dataCertificacao: new Date("2020-11-05"),
        situacaoTablet: "S.Tablet",
        produtosHabilitados: {
          consignado: false,
          microsseguro: true,
          lime: false
        }
      },
      {
        chaveLoja: "5006",
        cnpj: "67.890.123/0001-44",
        nomeLoja: "Loja Belo Horizonte",
        mesM3: 9,
        mesM2: 11,
        mesM1: 10,
        mesM0: 12,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-29"),
        dataUltTrxNegocio: new Date("2023-03-29"),
        dataInauguracao: new Date("2019-12-10"),
        agencia: "0056",
        telefoneLoja: "(31) 3456-7895",
        nomeContato: "Ricardo Souza",
        gerenciaRegional: "Belo Horizonte",
        diretoriaRegional: "Minas Gerais",
        tendencia: "estavel",
        endereco: "Av. Afonso Pena, 1500 - Centro, Belo Horizonte/MG",
        nomePdv: "BH Centro",
        multiplicadorResponsavel: "Camila Rocha",
        dataCertificacao: new Date("2022-07-15"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      }
    ]
  },
  "seguro": {
    titulo: "Estratégia de Seguros",
    visaoGeral: "Ampliar carteira de seguros com foco em microsseguros e seguros residenciais.",
    oportunidades: [
      {
        titulo: "Microsseguros para Baixa Renda",
        descricao: "Pacotes acessíveis para segmentos de menor poder aquisitivo."
      },
      {
        titulo: "Seguros Residenciais Simplificados",
        descricao: "Produtos simplificados para proteção residencial."
      }
    ],
    acoes: [
      {
        titulo: "Treinamento em Microsseguros",
        descricao: "Capacitar equipe para oferta adequada de microsseguros.",
        prioridade: "alta"
      },
      {
        titulo: "Parcerias com Imobiliárias",
        descricao: "Estabelecer parcerias para oferta de seguros residenciais.",
        prioridade: "media"
      }
    ],
    desempenho: {
      meta: 100,
      realizado: 40,
      anterior: 35
    }
  }
};

const DetalhesEstrategia: React.FC = () => {
  const { produto } = useParams<{ produto: string }>();
  const [dados, setDados] = useState<DadosEstrategia | null>(null);
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosLoja[]>([]);
  const { user, isManager } = useAuth();

  const form = useForm<FiltrosLoja>({
    defaultValues: {
      chaveLoja: "",
      cnpj: "",
      nomeLoja: "",
      situacao: "",
      agencia: "",
      gerenciaRegional: "",
      diretoriaRegional: "",
    }
  });

  useEffect(() => {
    if (produto && produto in dadosSimulados) {
      setDados(dadosSimulados[produto]);
      if (dadosSimulados[produto].dadosAnaliticos) {
        setDadosFiltrados(dadosSimulados[produto].dadosAnaliticos || []);
      }
    }
  }, [produto]);

  const aplicarFiltros = (values: FiltrosLoja) => {
    if (!dados?.dadosAnaliticos) return;
    
    const filtrados = dados.dadosAnaliticos.filter(loja => {
      if (values.chaveLoja && !loja.chaveLoja.includes(values.chaveLoja)) return false;
      if (values.cnpj && !loja.cnpj.includes(values.cnpj)) return false;
      if (values.nomeLoja && !loja.nomeLoja.toLowerCase().includes(values.nomeLoja.toLowerCase())) return false;
      if (values.situacao && values.situacao !== "all" && loja.situacao !== values.situacao) return false;
      if (values.agencia && !loja.agencia.includes(values.agencia)) return false;
      if (values.gerenciaRegional && values.gerenciaRegional !== "all" && !loja.gerenciaRegional.includes(values.gerenciaRegional)) return false;
      if (values.diretoriaRegional && values.diretoriaRegional !== "all" && !loja.diretoriaRegional.includes(values.diretoriaRegional)) return false;
      
      return true;
    });
    
    setDadosFiltrados(filtrados);
  };

  const limparFiltros = () => {
    form.reset();
    if (dados?.dadosAnaliticos) {
      setDadosFiltrados(dados.dadosAnaliticos);
    }
  };

  if (!dados) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Produto não encontrado ou dados indisponíveis.</p>
      </div>
    );
  }

  const percentualRealizado = Math.round((dados.desempenho.realizado / dados.desempenho.meta) * 100);
  const tendencia = dados.desempenho.realizado > dados.desempenho.anterior ? "positiva" : "negativa";

  const renderTendenciaIcon = (tendencia: string) => {
    switch(tendencia) {
      case "queda":
        return <TrendingDown size={16} className="text-red-500" />;
      case "atencao":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "estavel":
        return <Activity size={16} className="text-blue-500" />;
      case "comecando":
        return <TrendingUp size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return "—";
    return format(date, "dd/MM/yyyy", {locale: ptBR});
  };
  
  const toggleLojaExpandida = (chaveLoja: string) => {
    if (lojaExpandida === chaveLoja) {
      setLojaExpandida(null);
    } else {
      setLojaExpandida(chaveLoja);
    }
  };

  const getOpcoesUnicas = (campo: keyof DadosLoja) => {
    if (!dados?.dadosAnaliticos) return [];
    return Array.from(new Set(dados.dadosAnaliticos.map(loja => loja[campo] as string))).filter(Boolean);
  };

  const situacoes = ["ativa", "bloqueada", "em processo de encerramento"];
  const gerenciasRegionais = getOpcoesUnicas("gerenciaRegional");
  const diretoriasRegionais = getOpcoesUnicas("diretoriaRegional");

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{dados.titulo}</h1>
          <p className="text-gray-500">Estratégia Comercial - {user?.name}</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{dados.visaoGeral}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Desempenho</CardTitle>
                <ChartBar size={24} className="text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${percentualRealizado >= 70 ? 'bg-green-500' : percentualRealizado >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${percentualRealizado}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Meta: {dados.desempenho.meta}%</span>
                  <span className="text-sm font-medium">{percentualRealizado}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Tendência</CardTitle>
                <TrendingUp size={24} className="text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="text-xl font-bold">
                  {tendencia === "positiva" ? "+" : ""}{dados.desempenho.realizado - dados.desempenho.anterior}%
                </div>
                <div className="text-sm text-gray-500">
                  Comparando com período anterior ({dados.desempenho.anterior}%)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Atenção</CardTitle>
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1">
                {percentualRealizado < 50 ? (
                  <p>Meta atual muito distante. Intensifique as ações prioritárias.</p>
                ) : percentualRealizado < 80 ? (
                  <p>Meta em andamento. Mantenha o foco nas ações de alta prioridade.</p>
                ) : (
                  <p>Excelente desempenho! Continue com a estratégia atual.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="oportunidades">
          <TabsList className="mb-4">
            <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
            <TabsTrigger value="acoes">Ações Recomendadas</TabsTrigger>
            {isManager && <TabsTrigger value="gerencial">Visão Gerencial</TabsTrigger>}
          </TabsList>

          <TabsContent value="oportunidades">
            {produto === "abertura-conta" && dados.dadosAnaliticos ? (
              <Card>
                <CardHeader>
                  <CardTitle>Quadro Analítico de Oportunidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(aplicarFiltros)} className="space-y-4">
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Search size={16} />
                          Filtrar lojas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="chaveLoja"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Chave Loja" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="CNPJ" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="nomeLoja"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Nome da Loja" {...field} />
                                </FormControl>
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
                                    {situacoes.map(situacao => (
                                      <SelectItem key={situacao} value={situacao}>
                                        {situacao === "ativa" ? "Ativa" : 
                                         situacao === "bloqueada" ? "Bloqueada" : 
                                         "Em encerramento"}
                                      </SelectItem>
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
                                <FormControl>
                                  <Input placeholder="Agência" {...field} />
                                </FormControl>
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
                                    {gerenciasRegionais.map(gr => (
                                      <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                                    ))}
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
                                    {diretoriasRegionais.map(dr => (
                                      <SelectItem key={dr} value={dr}>{dr}</SelectItem>
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
                          <TableHead className="w-[120px]">Chave Loja</TableHead>
                          <TableHead>Nome Loja</TableHead>
                          <TableHead className="text-center" colSpan={4}>
                            <div className="mb-1">Qtd. Contas</div>
                            <div className="grid grid-cols-4 gap-2 text-xs font-normal">
                              <div>M-3</div>
                              <div>M-2</div>
                              <div>M-1</div>
                              <div>M0</div>
                            </div>
                          </TableHead>
                          <TableHead className="text-center">Situação</TableHead>
                          <TableHead className="text-center">Últ. Contábil</TableHead>
                          <TableHead className="text-center">Últ. Negócio</TableHead>
                          <TableHead className="text-center">Tendência</TableHead>
                          <TableHead className="w-[120px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosFiltrados.map((loja) => (
                          <React.Fragment key={loja.chaveLoja}>
                            <TableRow>
                              <TableCell className="font-medium">
                                <div>{loja.chaveLoja}</div>
                                <div className="text-xs text-gray-500">{loja.cnpj}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{loja.nomeLoja}</div>
                                <div className="text-xs text-gray-500">
                                  Ag: {loja.agencia}
                                </div>
                              </TableCell>
                              <TableCell className="text-center p-2">{loja.mesM3}</TableCell>
                              <TableCell className="text-center p-2">{loja.mesM2}</TableCell>
                              <TableCell className="text-center p-2">{loja.mesM1}</TableCell>
                              <TableCell className="text-center p-2">{loja.mesM0}</TableCell>
                              <TableCell className="text-center">
                                {loja.situacao === "ativa" ? (
                                  <TableStatus status="realizar" label="Ativa" />
                                ) : loja.situacao === "bloqueada" ? (
                                  <TableStatus status="pendente" label="Bloqueada" />
                                ) : (
                                  <TableStatus status="pendente" label="Em encerramento" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">{formatDate(loja.dataUltTrxContabil)}</TableCell>
                              <TableCell className="text-center">{formatDate(loja.dataUltTrxNegocio)}</TableCell>
                              <TableCell className="text-center">
                                {renderTendenciaIcon(loja.tendencia)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    title="Ver detalhes"
                                    onClick={() => toggleLojaExpandida(loja.chaveLoja)}
                                    className="bg-blue-50 border-blue-200 hover:bg-blue-100"
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
                            {lojaExpandida === loja.chaveLoja && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={10} className="py-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Informações Detalhadas</h4>
                                      <ul className="space-y-1.5">
                                        <li className="text-sm"><span className="font-medium">Localização:</span> {loja.endereco}</li>
                                        <li className="text-sm"><span className="font-medium">Nome PDV:</span> {loja.nomePdv}</li>
                                        <li className="text-sm"><span className="font-medium">Telefone:</span> {loja.telefoneLoja}</li>
                                        <li className="text-sm"><span className="font-medium">Multiplicador:</span> {loja.multiplicadorResponsavel}</li>
                                        <li className="text-sm"><span className="font-medium">Data Certificação:</span> {loja.dataCertificacao ? formatDate(loja.dataCertificacao) : '—'}</li>
                                        <li className="text-sm"><span className="font-medium">Situação Tablet:</span> {loja.situacaoTablet}</li>
                                        <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {loja.gerenciaRegional}</li>
                                        <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {loja.diretoriaRegional}</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Produtos Habilitados</h4>
                                      <div className="flex space-x-4">
                                        <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.consignado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                          Consignado
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.microsseguro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                          Microsseguro
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.lime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                          Lime
                                        </div>
                                      </div>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dados.oportunidades.map((oportunidade, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{oportunidade.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{oportunidade.descricao}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="acoes">
            <div className="grid grid-cols-1 gap-4">
              {dados.acoes.map((acao, index) => (
                <Card key={index} className={`border-l-4 ${
                  acao.prioridade === 'alta' ? 'border-l-red-500' : 
                  acao.prioridade === 'media' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{acao.titulo}</CardTitle>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        acao.prioridade === 'alta' ? 'bg-red-100 text-red-800' : 
                        acao.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        Prioridade {acao.prioridade}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{acao.descricao}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {isManager && (
            <TabsContent value="gerencial">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Visão Consolidada da Equipe</h3>
                    <p>Esta seção contém informações gerenciais detalhadas sobre o desempenho da sua equipe neste produto.</p>
                    <p className="text-amber-600">Disponível apenas para coordenadores e gerentes.</p>
                    
                    <div className="py-4 px-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm italic text-center">
                        Dados detalhados de equipe seriam exibidos aqui em uma implementação completa.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default DetalhesEstrategia;
