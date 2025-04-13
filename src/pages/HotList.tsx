
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableStatus
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  MoreHorizontal,
  FileEdit,
  Eye
} from "lucide-react";

// Mock data para demonstração
const mockHotListData = [
  {
    id: 1,
    cod_gr: "1001",
    ger_regional: "Norte",
    cod_dr: "2001",
    dir_regional: "São Paulo",
    cod_ag: "3001",
    nome_ag: "Agência Centro",
    cod_pa: "4001",
    nome_pa: "Posto Av. Paulista",
    nr_conta: "12345-6",
    rz_social: "Supermercado Silva Ltda",
    cnpj: "12.345.678/0001-90",
    praca_presenca: "SIM",
    supermercado: "SIM",
    situacao: "pendente"
  },
  {
    id: 2,
    cod_gr: "1002",
    ger_regional: "Sul",
    cod_dr: "2002",
    dir_regional: "Rio de Janeiro",
    cod_ag: "3002",
    nome_ag: "Agência Copacabana",
    cod_pa: "4002",
    nome_pa: "Posto Botafogo",
    nr_conta: "23456-7",
    rz_social: "Mercado Central do Rio Ltda",
    cnpj: "23.456.789/0001-01",
    praca_presenca: "NAO",
    supermercado: "SIM",
    situacao: "tratada"
  },
  {
    id: 3,
    cod_gr: "1001",
    ger_regional: "Norte",
    cod_dr: "2001",
    dir_regional: "São Paulo",
    cod_ag: "3003",
    nome_ag: "Agência Pinheiros",
    cod_pa: "4003",
    nome_pa: "Posto Vila Madalena",
    nr_conta: "34567-8",
    rz_social: "Minimercado Express Ltda",
    cnpj: "34.567.890/0001-12",
    praca_presenca: "SIM",
    supermercado: "NAO",
    situacao: "realizar"
  }
];

// Componente para os cards de resumo na parte superior
const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">152</div>
          <div className="text-sm text-muted-foreground">Total de leads</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">87</div>
          <div className="text-sm text-muted-foreground">Leads tratados</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">45</div>
          <div className="text-sm text-muted-foreground">Leads prospectados</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">20</div>
          <div className="text-sm text-muted-foreground">Pendentes de tratativa</div>
        </CardContent>
      </Card>
    </div>
  );
};

const HotList = () => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Toggle para expandir/colapsar detalhes da linha
  const toggleRowExpand = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Hot List</h1>
      <p className="text-muted-foreground mb-6">
        Lista de prospecção para equipe comercial com oportunidades de contratação.
      </p>

      <SummaryCards />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input placeholder="Buscar por razão social, CNPJ..." className="w-full" />
        </div>
        <div className="flex flex-row gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="tratada">Tratada</SelectItem>
              <SelectItem value="realizar">A realizar</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-md mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Código PA</TableHead>
              <TableHead>Nome PA</TableHead>
              <TableHead>Praça Presença</TableHead>
              <TableHead>Supermercado</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHotListData.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRowExpand(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      {expandedRow === item.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{item.rz_social}</TableCell>
                  <TableCell>{item.cnpj}</TableCell>
                  <TableCell>{item.cod_pa}</TableCell>
                  <TableCell>{item.nome_pa}</TableCell>
                  <TableCell>
                    <Badge variant={item.praca_presenca === "SIM" ? "default" : "outline"}>
                      {item.praca_presenca}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.supermercado === "SIM" ? "default" : "outline"}>
                      {item.supermercado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableStatus 
                      status={
                        item.situacao === "pendente" 
                          ? "pendente" 
                          : item.situacao === "tratada" 
                            ? "tratada" 
                            : "realizar"
                      } 
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Ver detalhes</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileEdit className="mr-2 h-4 w-4" />
                          <span>Registrar tratativa</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Marcar como prospectado</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedRow === item.id && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium">Gerência Regional</div>
                          <div className="text-sm">{item.ger_regional} ({item.cod_gr})</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Diretoria Regional</div>
                          <div className="text-sm">{item.dir_regional} ({item.cod_dr})</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Agência</div>
                          <div className="text-sm">{item.nome_ag} ({item.cod_ag})</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Número da Conta</div>
                          <div className="text-sm">{item.nr_conta}</div>
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

      {/* Paginação */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default HotList;
