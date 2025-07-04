import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Building2, 
  FileText, 
  Calendar, 
  Eye, 
  MessageSquarePlus,
  RefreshCw,
  ChevronRight,
  Info,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Correspondente {
  id: string;
  CHAVE_LOJA: string;
  CNPJ: string;
  NOME: string;
  nr_pacb: string;
  diretoria?: string;
  gerencia?: string;
  gerente_area?: string;
  coordenador?: string;
  supervisor?: string;
  agencia?: string;
  pa?: string;
  status?: 'ativo' | 'inativo';
  ultima_tratativa?: string;
  total_tratativas?: number;
}

interface CorrespondentesTableProps {
  correspondentes: Correspondente[];
  isLoading: boolean;
  onTratativa: (correspondente: Correspondente) => void;
  onViewHistorico?: (correspondente: Correspondente) => void;
  onRefresh: () => void;
}

export function CorrespondentesTable({ 
  correspondentes, 
  isLoading, 
  onTratativa, 
  onViewHistorico,
  onRefresh 
}: CorrespondentesTableProps) {
  const [correspondentExpandido, setCorrespondentExpandido] = useState<string | null>(null);

  const toggleCorrespondentExpandido = (id: string) => {
    setCorrespondentExpandido(correspondentExpandido === id ? null : id);
  };

  const getStatusBadge = (status: 'ativo' | 'inativo' | undefined) => {
    if (status === 'ativo') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Ativo
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        Inativo
      </Badge>
    );
  };

  const getTratativasBadge = (total?: number) => {
    if (!total || total === 0) {
      return (
        <Badge variant="outline" className="text-gray-500">
          Nenhuma
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        {total} tratativa{total !== 1 ? 's' : ''}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600">Carregando correspondentes...</p>
        </div>
      </div>
    );
  }

  if (correspondentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-20 h-20 -z-10"></div>
          <div className="flex items-center justify-center w-20 h-20">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum correspondente encontrado
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Não há correspondentes que atendam aos critérios de filtro selecionados.
            <br />
            <span className="text-sm text-gray-500">
              Tente ajustar os filtros ou limpar todos para ver todos os correspondentes.
            </span>
          </p>
          
          <Button 
            onClick={onRefresh} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Exibindo {correspondentes.length} correspondente{correspondentes.length !== 1 ? 's' : ''}
        </div>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-gray-100">
                <div className="flex items-center gap-1">
                  Chave Loja
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100">
                <div className="flex items-center gap-1">
                  Correspondente
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 text-center">
                <div className="flex items-center justify-center gap-1">
                  Nr PACB
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 text-center">
                <div className="flex items-center justify-center gap-1">
                  Status
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 text-center">
                <div className="flex items-center justify-center gap-1">
                  Tratativas
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 text-center">
                <div className="flex items-center justify-center gap-1">
                  Última Visita
                </div>
              </TableHead>
              <TableHead className="w-[150px] text-center">
                <div className="flex items-center justify-center">Ações</div>
              </TableHead>
            </TableRow>
          </TableHeader>
                    <TableBody>
            {correspondentes.map((correspondente) => (
              <React.Fragment key={correspondente.id}>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-mono text-sm">{correspondente.CHAVE_LOJA}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{correspondente.NOME}</div>
                    <div className="text-xs text-gray-500">{correspondente.CNPJ}</div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className="font-mono text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {correspondente.nr_pacb}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getStatusBadge(correspondente.status)}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getTratativasBadge(correspondente.total_tratativas)}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {formatDate(correspondente.ultima_tratativa)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Ver detalhes"
                        className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                        onClick={() => toggleCorrespondentExpandido(correspondente.id)}
                      >
                        <Info size={16} className="text-blue-600" />
                      </Button>
                      {onViewHistorico && correspondente.total_tratativas && correspondente.total_tratativas > 0 && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="Ver histórico de tratativas"
                          className="bg-purple-50 border-purple-200 hover:bg-purple-100"
                          onClick={() => onViewHistorico(correspondente)}
                        >
                          <Eye size={16} className="text-purple-600" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Adicionar tratativa"
                        className="bg-green-50 border-green-200 hover:bg-green-100"
                        onClick={() => onTratativa(correspondente)}
                      >
                        <MessageSquarePlus size={16} className="text-green-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {correspondentExpandido === correspondente.id && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={7} className="py-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            Hierarquia Organizacional
                          </h4>
                          <ul className="space-y-1.5">
                            <li className="text-sm"><span className="font-medium">Diretoria:</span> {correspondente.diretoria || 'Não informado'}</li>
                            <li className="text-sm"><span className="font-medium">Gerência:</span> {correspondente.gerencia || 'Não informado'}</li>
                            <li className="text-sm"><span className="font-medium">Gerente Área:</span> {correspondente.gerente_area || 'Não informado'}</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-600" />
                            Responsáveis
                          </h4>
                          <ul className="space-y-1.5">
                            <li className="text-sm"><span className="font-medium">Coordenador:</span> {correspondente.coordenador || 'Não informado'}</li>
                            <li className="text-sm"><span className="font-medium">Supervisor:</span> {correspondente.supervisor || 'Não informado'}</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-600" />
                            Localização
                          </h4>
                          <ul className="space-y-1.5">
                            <li className="text-sm"><span className="font-medium">Agência:</span> {correspondente.agencia || 'Não informado'}</li>
                            <li className="text-sm"><span className="font-medium">PA:</span> {correspondente.pa || 'Não informado'}</li>
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

      {/* Footer com informações */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Inativo</span>
          </div>
        </div>
        
        <div className="text-xs">
          💡 Clique em "Tratativa" para registrar uma nova visita ou acompanhamento
        </div>
      </div>
    </div>
  );
} 