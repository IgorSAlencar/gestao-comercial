
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  FileX, 
  Download,
  Search,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface Correspondente {
  id: string;
  nome: string;
  codigo: string;
  dataBloqueiio: string;
  motivo: string;
  status: "bloqueado" | "suspenso";
}

const CorrespondentesBloquadeos: React.FC = () => {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dados mockados para exemplificar
  const correspondentes: Correspondente[] = [
    {
      id: "1",
      nome: "Supermercado Pinheiros",
      codigo: "1278",
      dataBloqueiio: "2023-12-15",
      motivo: "Fraude documentação",
      status: "bloqueado"
    },
    {
      id: "2",
      nome: "Farmácia Saúde Total",
      codigo: "2351",
      dataBloqueiio: "2024-01-23",
      motivo: "Irregularidade operacional",
      status: "suspenso"
    },
    {
      id: "3",
      nome: "Padaria Bom Pão",
      codigo: "3892",
      dataBloqueiio: "2024-03-05",
      motivo: "Inconsistência cadastral",
      status: "bloqueado"
    },
    {
      id: "4",
      nome: "Posto de Combustível São Paulo",
      codigo: "4129",
      dataBloqueiio: "2024-02-18",
      motivo: "Violação de normas contratuais",
      status: "bloqueado"
    },
    {
      id: "5",
      nome: "Livraria Conhecimento",
      codigo: "5467",
      dataBloqueiio: "2024-03-10",
      motivo: "Documentação irregular",
      status: "suspenso"
    },
  ];

  // Filtra os correspondentes com base na busca
  const correspondentesFiltrados = correspondentes.filter(
    (corr) => 
      corr.nome.toLowerCase().includes(busca.toLowerCase()) || 
      corr.codigo.includes(busca)
  );

  const exportarParaExcel = () => {
    toast({
      title: "Download iniciado",
      description: "O arquivo será baixado em instantes.",
    });
    
    // Aqui seria implementado o código real de exportação para Excel
    console.log("Exportando dados para Excel");
  };

  const verDetalhes = (id: string) => {
    // Futuramente, navegaria para uma página de detalhes
    console.log(`Ver detalhes do correspondente ${id}`);
    
    // Simulação de navegação para uma página de detalhes
    toast({
      title: "Visualizando detalhes",
      description: `Carregando informações do correspondente ${id}`,
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FileX className="mr-2 h-8 w-8 text-red-500" />
              Correspondentes Bloqueados
            </h1>
            <p className="text-gray-500">
              Visualize e gerencie os correspondentes com restrições operacionais.
            </p>
          </div>
          <Button onClick={exportarParaExcel} className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Exportar para Excel
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Lista de Correspondentes</CardTitle>
            <CardDescription>
              {correspondentesFiltrados.length} correspondentes com restrições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Bloqueio</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {correspondentesFiltrados.length > 0 ? (
                    correspondentesFiltrados.map((corr) => (
                      <TableRow key={corr.id}>
                        <TableCell className="font-medium">{corr.codigo}</TableCell>
                        <TableCell>{corr.nome}</TableCell>
                        <TableCell>
                          {new Date(corr.dataBloqueiio).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{corr.motivo}</TableCell>
                        <TableCell>
                          <span 
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              corr.status === 'bloqueado' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {corr.status === 'bloqueado' ? (
                              <>
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Bloqueado
                              </>
                            ) : (
                              'Suspenso'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => verDetalhes(corr.id)}
                          >
                            Ver detalhes
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum correspondente encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink 
                      isActive={paginaAtual === 1}
                      href="#"
                      onClick={() => setPaginaAtual(1)}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={() => setPaginaAtual(2)}
                    >
                      2
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={() => setPaginaAtual(paginaAtual + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorrespondentesBloquadeos;
