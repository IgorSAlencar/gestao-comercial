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
import { ChartBar, TrendingUp, AlertTriangle, TrendingDown, Activity, Plus, MoreHorizontal, Info, Search, Pin, Download, ArrowRight } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from 'xlsx';

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
  motivoBloqueio?: string;
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
  tendencia: string;
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
    visaoGeral: "Cada ação no dia a dia fortalece sua gestão. Atue com estratégia e transforme desafios em resultados!",
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
        },
        motivoBloqueio: "Bloqueio temporário devido a irregularidades na documentação. Necessário regularização com a gerência regional."
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
  const [ordenacao, setOrdenacao] = useState<{
    coluna: keyof DadosLoja | null;
    direcao: 'asc' | 'desc';
  }>({ coluna: null, direcao: 'asc' });
  const { user, isManager } = useAuth();
  const [modalBloqueio, setModalBloqueio] = useState<{
    isOpen: boolean;
    loja: DadosLoja | null;
  }>({
    isOpen: false,
    loja: null
  });
  const [lojasMarcadas, setLojasMarcadas] = useState<Set<string>>(new Set());

  const form = useForm<FiltrosLoja>({
    defaultValues: {
      chaveLoja: "",
      cnpj: "",
      nomeLoja: "",
      situacao: "",
      agencia: "",
      gerenciaRegional: "",
      diretoriaRegional: "",
      tendencia: "",
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
      if (values.tendencia && values.tendencia !== "all" && loja.tendencia !== values.tendencia) return false;
      
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

  const handleOrdenacao = (coluna: keyof DadosLoja) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const dadosOrdenados = React.useMemo(() => {
    if (!ordenacao.coluna) return dadosFiltrados;

    return [...dadosFiltrados].sort((a, b) => {
      const valorA = a[ordenacao.coluna!];
      const valorB = b[ordenacao.coluna!];

      if (valorA === valorB) return 0;
      
      const comparacao = valorA < valorB ? -1 : 1;
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
  }, [dadosFiltrados, ordenacao]);

  const exportarParaExcel = () => {
    // Preparar os dados para exportação
    const dadosParaExportar = dadosOrdenados.map(loja => ({
      'Chave Loja': loja.chaveLoja,
      'CNPJ': loja.cnpj,
      'Nome Loja': loja.nomeLoja,
      'Agência': loja.agencia,
      'M-3': loja.mesM3,
      'M-2': loja.mesM2,
      'M-1': loja.mesM1,
      'M0': loja.mesM0,
      'Situação': loja.situacao,
      'Últ. Contábil': formatDate(loja.dataUltTrxContabil),
      'Últ. Negócio': formatDate(loja.dataUltTrxNegocio),
      'Tendência': loja.tendencia,
      'Gerência Regional': loja.gerenciaRegional,
      'Diretoria Regional': loja.diretoriaRegional
    }));

    // Criar uma nova planilha
    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");

    // Gerar o arquivo Excel
    XLSX.writeFile(wb, `Analítico BE (Abertura De Contas) - ${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
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

  const toggleLojaMarcada = (chaveLoja: string) => {
    setLojasMarcadas(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(chaveLoja)) {
        novoSet.delete(chaveLoja);
      } else {
        novoSet.add(chaveLoja);
      }
      return novoSet;
    });
  };

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
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-blue-800">Ação Diária</CardTitle>
                  <p className="text-sm text-blue-600 mt-1">Loja que necessita atenção hoje</p>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Hoje
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-800">Loja Centro</h4>
                    <p className="text-sm text-gray-600">Chave: 5001 - Ag: 0001</p>
                  </div>
                  <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    Pendente
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Situação:</span> 5 contas abertas no sistema legado
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contato:</span> João Silva
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/migracao-contas'}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Iniciar Tratativa
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Tendência</CardTitle>
                <TrendingUp size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                  onClick={() => {
                    form.setValue('tendencia', 'comecando');
                    aplicarFiltros(form.getValues());
                  }}
                >
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Crescimento</p>
                    <p className="text-xl font-semibold text-green-800">
                      {dados?.dadosAnaliticos?.filter(loja => loja.tendencia === "comecando").length || 0}
                    </p>
                  </div>
                </div>
                <div 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    form.setValue('tendencia', 'estavel');
                    aplicarFiltros(form.getValues());
                  }}
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estável</p>
                    <p className="text-xl font-semibold text-blue-800">
                      {dados?.dadosAnaliticos?.filter(loja => loja.tendencia === "estavel").length || 0}
                    </p>
                  </div>
                </div>
                <div 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
                  onClick={() => {
                    form.setValue('tendencia', 'atencao');
                    aplicarFiltros(form.getValues());
                  }}
                >
                  <div className="bg-amber-100 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Atenção</p>
                    <p className="text-xl font-semibold text-amber-800">
                      {dados?.dadosAnaliticos?.filter(loja => loja.tendencia === "atencao").length || 0}
                    </p>
                  </div>
                </div>
                <div 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => {
                    form.setValue('tendencia', 'queda');
                    aplicarFiltros(form.getValues());
                  }}
                >
                  <div className="bg-red-100 p-2 rounded-full">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Queda</p>
                    <p className="text-xl font-semibold text-red-800">
                      {dados?.dadosAnaliticos?.filter(loja => loja.tendencia === "queda").length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Lojas Sem Abertura</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Lojas ativas sem movimentação de contas</p>
                </div>
                <AlertTriangle size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">Análise de Inatividade</h4>
                      <p className="text-sm text-gray-600">Identificação de lojas que precisam de atenção</p>
                    </div>
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {dados?.dadosAnaliticos?.filter(loja => 
                        loja.situacao === "ativa" && 
                        loja.mesM0 === 0 && 
                        loja.mesM1 === 0 && 
                        loja.mesM2 === 0 && 
                        loja.mesM3 === 0
                      ).length || 0} Lojas
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Situação:</span> Lojas ativas sem movimentação nos últimos 4 meses
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700"
                    onClick={() => window.location.href = '/analise-inatividade'}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Ver Análise Detalhada
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="oportunidades">
          <TabsList className="mb-4">
            <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
            <TabsTrigger value="acoes">Correspondentes Marcados</TabsTrigger>
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
                          <TableHead 
                            className="w-[120px] cursor-pointer hover:bg-gray-100" 
                            onClick={() => handleOrdenacao('chaveLoja')}
                          >
                            <div className="flex items-center gap-1">
                              Chave Loja
                              {ordenacao.coluna === 'chaveLoja' && (
                                <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => handleOrdenacao('nomeLoja')}
                          >
                            <div className="flex items-center gap-1">
                              Nome Loja
                              {ordenacao.coluna === 'nomeLoja' && (
                                <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="text-center" colSpan={4}>
                            <div className="mb-1">Qtd. Contas</div>
                            <div className="grid grid-cols-4 gap-2 text-xs font-normal">
                              <div 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleOrdenacao('mesM3')}
                              >
                                M-3 {ordenacao.coluna === 'mesM3' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                              </div>
                              <div 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleOrdenacao('mesM2')}
                              >
                                M-2 {ordenacao.coluna === 'mesM2' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                              </div>
                              <div 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleOrdenacao('mesM1')}
                              >
                                M-1 {ordenacao.coluna === 'mesM1' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                              </div>
                              <div 
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() => handleOrdenacao('mesM0')}
                              >
                                M0 {ordenacao.coluna === 'mesM0' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                              </div>
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-gray-100"
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
                            className="text-center cursor-pointer hover:bg-gray-100"
                            onClick={() => handleOrdenacao('dataUltTrxContabil')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Últ. Contábil
                              {ordenacao.coluna === 'dataUltTrxContabil' && (
                                <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-gray-100"
                            onClick={() => handleOrdenacao('dataUltTrxNegocio')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Últ. Negócio
                              {ordenacao.coluna === 'dataUltTrxNegocio' && (
                                <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-gray-100"
                            onClick={() => handleOrdenacao('tendencia')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Tendência
                              {ordenacao.coluna === 'tendencia' && (
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
                        {dadosOrdenados.map((loja) => (
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
                                  <div 
                                    className="cursor-pointer" 
                                    onClick={() => setModalBloqueio({ isOpen: true, loja })}
                                  >
                                    <TableStatus status="bloqueada" label="Bloqueada" />
                                  </div>
                                ) : (
                                  <TableStatus status="pendente" label="Em encerramento" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">{formatDate(loja.dataUltTrxContabil)}</TableCell>
                              <TableCell className="text-center">{formatDate(loja.dataUltTrxNegocio)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center items-center">
                                  {renderTendenciaIcon(loja.tendencia)}
                                </div>
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
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    title={lojasMarcadas.has(loja.chaveLoja) ? "Desmarcar loja" : "Acompanhar Loja"}
                                    onClick={() => toggleLojaMarcada(loja.chaveLoja)}
                                    className={`${lojasMarcadas.has(loja.chaveLoja) ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                  >
                                    <Pin size={16} className={lojasMarcadas.has(loja.chaveLoja) ? "text-purple-600" : "text-gray-600"} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {lojaExpandida === loja.chaveLoja && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={10} className="py-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Informações da Loja</h4>
                                      <ul className="space-y-1.5">
                                        <li className="text-sm"><span className="font-medium">Localização:</span> {loja.endereco}</li>
                                        <li className="text-sm"><span className="font-medium">Contato:</span> {loja.nomePdv}</li>
                                        <li className="text-sm"><span className="font-medium">Telefone:</span> {loja.telefoneLoja}</li>
                                        <li className="text-sm"><span className="font-medium">Data Certificação:</span> {loja.dataCertificacao ? formatDate(loja.dataCertificacao) : '—'}</li>
                                        <li className="text-sm"><span className="font-medium">Situação Tablet:</span> {loja.situacaoTablet}</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Hierarquia</h4>
                                      <ul className="space-y-1.5">
                                        <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {loja.diretoriaRegional}</li>
                                        <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {loja.gerenciaRegional}</li>
                                        <li className="text-sm"><span className="font-medium">Multiplicador:</span> {loja.multiplicadorResponsavel}</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Produtos Habilitados</h4>
                                      <div className="flex flex-col space-y-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dadosOrdenados
                .filter(loja => lojasMarcadas.has(loja.chaveLoja))
                .map((loja) => (
                  <Card key={loja.chaveLoja} className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg text-purple-800">{loja.nomeLoja}</CardTitle>
                          <p className="text-sm text-purple-600">Chave: {loja.chaveLoja} - Ag: {loja.agencia}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => toggleLojaMarcada(loja.chaveLoja)}
                          className="bg-purple-50 border-purple-200 hover:bg-purple-100"
                        >
                          <Pin size={16} className="text-purple-600" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg border border-purple-100">
                          <h4 className="text-sm font-medium text-purple-800 mb-2">Evolução de Contas</h4>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">M-3</p>
                              <p className="text-lg font-semibold text-purple-800">{loja.mesM3}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">M-2</p>
                              <p className="text-lg font-semibold text-purple-800">{loja.mesM2}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">M-1</p>
                              <p className="text-lg font-semibold text-purple-800">{loja.mesM1}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">M0</p>
                              <p className="text-lg font-semibold text-purple-800">{loja.mesM0}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-purple-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Situação:</span> {loja.situacao}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Contato:</span> {loja.nomeContato}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Últ. Contábil:</span> {formatDate(loja.dataUltTrxContabil)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Últ. Negócio:</span> {formatDate(loja.dataUltTrxNegocio)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {lojaExpandida === loja.chaveLoja && (
                          <div className="bg-white p-3 rounded-lg border border-purple-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Informações da Loja</h4>
                                <ul className="space-y-1.5">
                                  <li className="text-sm"><span className="font-medium">Localização:</span> {loja.endereco}</li>
                                  <li className="text-sm"><span className="font-medium">Contato:</span> {loja.nomePdv}</li>
                                  <li className="text-sm"><span className="font-medium">Telefone:</span> {loja.telefoneLoja}</li>
                                  <li className="text-sm"><span className="font-medium">Data Certificação:</span> {loja.dataCertificacao ? formatDate(loja.dataCertificacao) : '—'}</li>
                                  <li className="text-sm"><span className="font-medium">Situação Tablet:</span> {loja.situacaoTablet}</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Hierarquia</h4>
                                <ul className="space-y-1.5">
                                  <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {loja.diretoriaRegional}</li>
                                  <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {loja.gerenciaRegional}</li>
                                  <li className="text-sm"><span className="font-medium">Multiplicador:</span> {loja.multiplicadorResponsavel}</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Produtos Habilitados</h4>
                                <div className="flex flex-col space-y-2">
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
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                            onClick={() => toggleLojaExpandida(loja.chaveLoja)}
                          >
                            <Info size={16} className="text-blue-600 mr-2" />
                            {lojaExpandida === loja.chaveLoja ? "Ocultar Detalhes" : "Ver Detalhes"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-green-50 border-green-200 hover:bg-green-100"
                          >
                            <Plus size={16} className="text-green-600 mr-2" />
                            Adicionar Tratativa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {dadosOrdenados.filter(loja => lojasMarcadas.has(loja.chaveLoja)).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Pin size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum correspondente marcado</h3>
                  <p className="text-gray-500 mt-2">
                    Clique no ícone de alfinete nas lojas para marcá-las e acompanhar aqui.
                  </p>
                </div>
              )}
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

      {/* Modal de Bloqueio */}
      <Dialog open={modalBloqueio.isOpen} onOpenChange={() => setModalBloqueio({ isOpen: false, loja: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Bloqueio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Loja</h4>
              <p className="text-sm text-gray-600">
                {modalBloqueio.loja?.nomeLoja} - {modalBloqueio.loja?.chaveLoja}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data do Bloqueio</h4>
              <p className="text-sm text-gray-600">
                {modalBloqueio.loja?.dataBloqueio ? formatDate(modalBloqueio.loja.dataBloqueio) : '—'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Motivo do Bloqueio</h4>
              <p className="text-sm text-gray-600">
                {modalBloqueio.loja?.motivoBloqueio || 'Motivo não especificado'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetalhesEstrategia;
