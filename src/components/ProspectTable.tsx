
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Lead {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  segmento: string;
  status: "novo" | "em_contato" | "negociacao" | "convertido" | "sem_interesse";
  observacoes: string;
  municipio?: string;
  uf?: string;
  cnpj?: string;
  agencia?: string;
  pa?: string;
}

interface ProspectTableProps {
  leads: Lead[];
  onUpdateStatus?: (lead: Lead) => void;
  tableTitle: string;
}

const statusLabels = {
  novo: { label: "Novo Lead", color: "bg-blue-100 text-blue-800" },
  em_contato: { label: "Em Contato", color: "bg-yellow-100 text-yellow-800" },
  negociacao: { label: "Em Negociação", color: "bg-purple-100 text-purple-800" },
  convertido: { label: "Convertido", color: "bg-green-100 text-green-800" },
  sem_interesse: { label: "Sem Interesse", color: "bg-gray-100 text-gray-800" },
};

const ProspectTable = ({ leads, onUpdateStatus, tableTitle }: ProspectTableProps) => {
  if (leads.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        Nenhum lead encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="bg-muted/50 p-4 border-b">
        <h3 className="text-lg font-semibold">{tableTitle}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Agência/PA</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.nome}
                {lead.segmento && (
                  <div className="text-xs text-gray-500">{lead.segmento}</div>
                )}
              </TableCell>
              <TableCell>
                {lead.municipio && lead.uf && (
                  <span>{lead.municipio} - {lead.uf}</span>
                )}
                {!lead.municipio && !lead.uf && (
                  <span className="text-gray-400">Não informado</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={statusLabels[lead.status].color}>
                  {statusLabels[lead.status].label}
                </Badge>
              </TableCell>
              <TableCell>{lead.telefone}</TableCell>
              <TableCell>
                {lead.cnpj || <span className="text-gray-400">Não informado</span>}
              </TableCell>
              <TableCell>
                {(lead.agencia || lead.pa) ? (
                  <>
                    {lead.agencia && `Ag. ${lead.agencia}`}
                    {lead.agencia && lead.pa && ' | '}
                    {lead.pa && `PA ${lead.pa}`}
                  </>
                ) : (
                  <span className="text-gray-400">Não informado</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {onUpdateStatus && (
                  <Button
                    size="sm"
                    className="bg-bradesco-blue"
                    onClick={() => onUpdateStatus(lead)}
                  >
                    Atualizar Status
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProspectTable;
