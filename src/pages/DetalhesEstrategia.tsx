
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
import { ChartBar, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Interface para dados de estratégia
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
}

// Dados simulados para cada produto
const dadosSimulados: Record<string, DadosEstrategia> = {
  "credito": {
    titulo: "Crédito",
    visaoGeral: "Estratégia focada em ampliar a base de clientes com crédito ativo, aumentando o ticket médio e reduzindo a inadimplência na região.",
    oportunidades: [
      { titulo: "Renovação de crédito", descricao: "125 clientes com perfil para renovação de crédito nos próximos 30 dias." },
      { titulo: "Aumento de limite", descricao: "78 clientes com potencial para aumento de limite de crédito baseado na análise de risco." },
      { titulo: "Crédito consignado", descricao: "43 clientes recentemente aposentados com potencial para crédito consignado." }
    ],
    acoes: [
      { titulo: "Campanha Crédito Fácil", descricao: "Foco em clientes com mais de 1 ano de relacionamento e bom histórico de pagamento.", prioridade: "alta" },
      { titulo: "Pré-aprovados", descricao: "Contatar clientes com crédito pré-aprovado pelo sistema de análise.", prioridade: "alta" },
      { titulo: "Negociação de taxas", descricao: "Oferecer taxas reduzidas para clientes de alto valor.", prioridade: "media" }
    ],
    desempenho: {
      meta: 100,
      realizado: 65,
      anterior: 50
    }
  },
  "abertura-conta": {
    titulo: "Abertura de Conta",
    visaoGeral: "Estratégia focada em ampliar a base de clientes através da abertura de novas contas, priorizando o público jovem e pequenos empresários da região.",
    oportunidades: [
      { titulo: "Universitários", descricao: "Campanha em 3 faculdades da região com potencial de 200 novas contas." },
      { titulo: "Pequenos empresários", descricao: "Parceria com associação comercial para oferta de contas PJ." },
      { titulo: "Indicações de clientes", descricao: "Programa de indicação com benefícios para quem trouxer novos correntistas." }
    ],
    acoes: [
      { titulo: "Conta Digital Zero", descricao: "Promover a conta digital sem taxas para novos clientes.", prioridade: "alta" },
      { titulo: "Parcerias locais", descricao: "Estabelecer parcerias com comércios locais para ofertas exclusivas.", prioridade: "media" },
      { titulo: "Workshop para MEIs", descricao: "Realizar workshop sobre gestão financeira para microempreendedores.", prioridade: "baixa" }
    ],
    desempenho: {
      meta: 100,
      realizado: 85,
      anterior: 70
    }
  },
  "seguro": {
    titulo: "Seguro",
    visaoGeral: "Estratégia focada em aumentar a penetração de produtos de seguro na base atual de clientes e explorar novos nichos de mercado na região.",
    oportunidades: [
      { titulo: "Seguro residencial", descricao: "157 clientes com financiamento imobiliário sem seguro residencial contratado." },
      { titulo: "Seguro de vida", descricao: "93 clientes recém-casados com potencial para contratação de seguro de vida." },
      { titulo: "Seguro auto", descricao: "112 clientes que adquiriram veículos nos últimos 6 meses sem seguro vinculado." }
    ],
    acoes: [
      { titulo: "Campanha Proteção Total", descricao: "Oferecer pacotes completos com descontos progressivos.", prioridade: "alta" },
      { titulo: "Cross-selling", descricao: "Identificar clientes com produtos de crédito sem seguros associados.", prioridade: "alta" },
      { titulo: "Microsseguros", descricao: "Introduzir produtos de baixo ticket para clientes de menor renda.", prioridade: "media" }
    ],
    desempenho: {
      meta: 100,
      realizado: 45,
      anterior: 30
    }
  }
};

const DetalhesEstrategia: React.FC = () => {
  const { produto } = useParams<{ produto: string }>();
  const [dados, setDados] = useState<DadosEstrategia | null>(null);
  const { user, isManager } = useAuth();

  useEffect(() => {
    if (produto && produto in dadosSimulados) {
      setDados(dadosSimulados[produto]);
    }
  }, [produto]);

  if (!dados) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Produto não encontrado ou dados indisponíveis.</p>
      </div>
    );
  }

  const percentualRealizado = Math.round((dados.desempenho.realizado / dados.desempenho.meta) * 100);
  const tendencia = dados.desempenho.realizado > dados.desempenho.anterior ? "positiva" : "negativa";

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
                    
                    {/* Aqui entrariam gráficos e dados mais detalhados que só gestores podem ver */}
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
