
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Map, ChartPie, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface Municipio {
  id: string;
  nome: string;
  estado: string;
  populacao: number;
}

interface OpportunidadeMetrica {
  id: string;
  municipio_id: string;
  produto: string;
  potencial: number;
  atual: number;
  crescimento: number;
}

const municipios: Municipio[] = [
  { id: "1", nome: "São Paulo", estado: "SP", populacao: 11895893 },
  { id: "2", nome: "Campinas", estado: "SP", populacao: 1157979 },
  { id: "3", nome: "Guarulhos", estado: "SP", populacao: 1244518 },
  { id: "4", nome: "Santos", estado: "SP", populacao: 426646 },
  { id: "5", nome: "Jundiaí", estado: "SP", populacao: 379398 },
];

const oportunidades: OpportunidadeMetrica[] = [
  { id: "1", municipio_id: "1", produto: "Cartões de Crédito", potencial: 10000, atual: 3520, crescimento: 15 },
  { id: "2", municipio_id: "1", produto: "Empréstimos", potencial: 8500, atual: 4200, crescimento: 22 },
  { id: "3", municipio_id: "1", produto: "Seguros", potencial: 7200, atual: 1850, crescimento: 35 },
  { id: "4", municipio_id: "2", produto: "Cartões de Crédito", potencial: 2500, atual: 850, crescimento: 28 },
  { id: "5", municipio_id: "2", produto: "Empréstimos", potencial: 1800, atual: 720, crescimento: 18 },
  { id: "6", municipio_id: "2", produto: "Seguros", potencial: 1500, atual: 380, crescimento: 42 },
  { id: "7", municipio_id: "3", produto: "Cartões de Crédito", potencial: 3200, atual: 1280, crescimento: 25 },
  { id: "8", municipio_id: "3", produto: "Empréstimos", potencial: 2700, atual: 1120, crescimento: 20 },
  { id: "9", municipio_id: "3", produto: "Seguros", potencial: 2200, atual: 580, crescimento: 38 },
  { id: "10", municipio_id: "4", produto: "Cartões de Crédito", potencial: 1100, atual: 320, crescimento: 32 },
  { id: "11", municipio_id: "4", produto: "Empréstimos", potencial: 900, atual: 280, crescimento: 24 },
  { id: "12", municipio_id: "4", produto: "Seguros", potencial: 700, atual: 150, crescimento: 45 },
  { id: "13", municipio_id: "5", produto: "Cartões de Crédito", potencial: 950, atual: 280, crescimento: 30 },
  { id: "14", municipio_id: "5", produto: "Empréstimos", potencial: 780, atual: 250, crescimento: 26 },
  { id: "15", municipio_id: "5", produto: "Seguros", potencial: 620, atual: 130, crescimento: 48 },
];

const OpportunidadesPage = () => {
  const [municipioSelecionado, setMunicipioSelecionado] = useState<Municipio | null>(null);
  const [filtroMunicipio, setFiltroMunicipio] = useState("");
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState<Municipio[]>(municipios);
  
  const { toast } = useToast();
  
  const handleBuscaMunicipio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase();
    setFiltroMunicipio(valor);
    
    if (valor) {
      setMunicipiosFiltrados(
        municipios.filter(
          (municipio) =>
            municipio.nome.toLowerCase().includes(valor) ||
            municipio.estado.toLowerCase().includes(valor)
        )
      );
    } else {
      setMunicipiosFiltrados(municipios);
    }
  };
  
  const handleSelecionarMunicipio = (municipio: Municipio) => {
    setMunicipioSelecionado(municipio);
    setFiltroMunicipio("");
    
    toast({
      title: "Município selecionado",
      description: `Dados de oportunidade para ${municipio.nome}/${municipio.estado} carregados.`,
    });
  };
  
  const getOportunidadesPorMunicipio = (municipioId: string) => {
    return oportunidades.filter(op => op.municipio_id === municipioId);
  };
  
  const calcularPenetracaoPorProduto = (municipioId: string) => {
    const opsPorMunicipio = oportunidades.filter(op => op.municipio_id === municipioId);
    
    const totalPotencial = opsPorMunicipio.reduce((acc, op) => acc + op.potencial, 0);
    const totalAtual = opsPorMunicipio.reduce((acc, op) => acc + op.atual, 0);
    
    return (totalAtual / totalPotencial) * 100;
  };
  
  const produtoPrioritario = (municipioId: string) => {
    const ops = oportunidades.filter(op => op.municipio_id === municipioId);
    if (!ops.length) return null;
    
    // Ordena por maior crescimento potencial (potencial - atual) / potencial
    return ops.sort((a, b) => {
      const gapA = (a.potencial - a.atual) / a.potencial;
      const gapB = (b.potencial - b.atual) / b.potencial;
      return gapB - gapA;
    })[0];
  };
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Painel de Oportunidades</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Busca por Município</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Digite o nome do município ou UF..."
                className="pl-8"
                value={filtroMunicipio}
                onChange={handleBuscaMunicipio}
              />
            </div>
            <Button 
              className="bg-bradesco-blue"
              disabled={!municipioSelecionado}
            >
              <Map className="h-4 w-4 mr-2" /> Ver Mapa
            </Button>
          </div>
          
          {filtroMunicipio && (
            <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
              {municipiosFiltrados.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  Nenhum município encontrado.
                </div>
              ) : (
                <div>
                  {municipiosFiltrados.map((municipio) => (
                    <div
                      key={municipio.id}
                      className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelecionarMunicipio(municipio)}
                    >
                      <div className="font-medium">
                        {municipio.nome} - {municipio.estado}
                      </div>
                      <div className="text-sm text-gray-500">
                        População: {municipio.populacao.toLocaleString()} habitantes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {municipioSelecionado && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Penetração de Mercado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {calcularPenetracaoPorProduto(municipioSelecionado.id).toFixed(1)}%
                </div>
                <Progress value={calcularPenetracaoPorProduto(municipioSelecionado.id)} className="h-2" />
                <div className="mt-2 text-sm text-gray-500">
                  Meta regional: 75%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Produto Prioritário</CardTitle>
              </CardHeader>
              <CardContent>
                {produtoPrioritario(municipioSelecionado.id) && (
                  <>
                    <div className="text-xl font-bold">
                      {produtoPrioritario(municipioSelecionado.id)?.produto}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-green-600">
                      <span className="text-md">
                        +{produtoPrioritario(municipioSelecionado.id)?.crescimento}% potencial
                      </span>
                    </div>
                    <div className="mt-4">
                      <Button size="sm" className="text-xs bg-bradesco-blue">
                        Ver Estratégias <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Lojas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.floor(municipioSelecionado.populacao / 15000)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Potencial estimado: {Math.floor(municipioSelecionado.populacao / 10000)}
                </div>
                <div className="mt-4">
                  <Button size="sm" className="text-xs bg-bradesco-blue">
                    Ver Mapa de Distribuição
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades em {municipioSelecionado.nome}/{municipioSelecionado.estado}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="todos">
                <TabsList className="mb-4">
                  <TabsTrigger value="todos">Todos os Produtos</TabsTrigger>
                  <TabsTrigger value="cartoes">Cartões</TabsTrigger>
                  <TabsTrigger value="emprestimos">Empréstimos</TabsTrigger>
                  <TabsTrigger value="seguros">Seguros</TabsTrigger>
                </TabsList>
                <TabsContent value="todos" className="mt-0">
                  <div className="space-y-6">
                    {getOportunidadesPorMunicipio(municipioSelecionado.id).map((op) => (
                      <div key={op.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="font-medium">{op.produto}</h3>
                            <div className="flex flex-col md:flex-row md:items-center md:gap-4 mt-1">
                              <div className="text-sm text-gray-600">
                                Potencial: {op.potencial.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                Atual: {op.atual.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <div className="flex items-center gap-2">
                              <div className="w-48">
                                <Progress 
                                  value={(op.atual / op.potencial) * 100} 
                                  className="h-2" 
                                />
                              </div>
                              <div className="text-sm font-medium">
                                {((op.atual / op.potencial) * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="flex justify-end mt-2">
                              <Button size="sm" variant="outline">
                                Detalhes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                {/* Conteúdos para as outras abas seguiriam o mesmo padrão */}
                <TabsContent value="cartoes" className="mt-0">
                  <div className="space-y-6">
                    {getOportunidadesPorMunicipio(municipioSelecionado.id)
                      .filter(op => op.produto === "Cartões de Crédito")
                      .map((op) => (
                        <div key={op.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-medium">{op.produto}</h3>
                              <div className="flex flex-col md:flex-row md:items-center md:gap-4 mt-1">
                                <div className="text-sm text-gray-600">
                                  Potencial: {op.potencial.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Atual: {op.atual.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <div className="flex items-center gap-2">
                                <div className="w-48">
                                  <Progress 
                                    value={(op.atual / op.potencial) * 100} 
                                    className="h-2" 
                                  />
                                </div>
                                <div className="text-sm font-medium">
                                  {((op.atual / op.potencial) * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button size="sm" variant="outline">
                                  Detalhes
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="emprestimos" className="mt-0">
                  <div className="space-y-6">
                    {getOportunidadesPorMunicipio(municipioSelecionado.id)
                      .filter(op => op.produto === "Empréstimos")
                      .map((op) => (
                        <div key={op.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-medium">{op.produto}</h3>
                              <div className="flex flex-col md:flex-row md:items-center md:gap-4 mt-1">
                                <div className="text-sm text-gray-600">
                                  Potencial: {op.potencial.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Atual: {op.atual.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <div className="flex items-center gap-2">
                                <div className="w-48">
                                  <Progress 
                                    value={(op.atual / op.potencial) * 100} 
                                    className="h-2" 
                                  />
                                </div>
                                <div className="text-sm font-medium">
                                  {((op.atual / op.potencial) * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button size="sm" variant="outline">
                                  Detalhes
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="seguros" className="mt-0">
                  <div className="space-y-6">
                    {getOportunidadesPorMunicipio(municipioSelecionado.id)
                      .filter(op => op.produto === "Seguros")
                      .map((op) => (
                        <div key={op.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="font-medium">{op.produto}</h3>
                              <div className="flex flex-col md:flex-row md:items-center md:gap-4 mt-1">
                                <div className="text-sm text-gray-600">
                                  Potencial: {op.potencial.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Atual: {op.atual.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <div className="flex items-center gap-2">
                                <div className="w-48">
                                  <Progress 
                                    value={(op.atual / op.potencial) * 100} 
                                    className="h-2" 
                                  />
                                </div>
                                <div className="text-sm font-medium">
                                  {((op.atual / op.potencial) * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button size="sm" variant="outline">
                                  Detalhes
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OpportunidadesPage;
