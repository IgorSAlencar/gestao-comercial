import React, { useState } from "react";
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
import { Info, Plus, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  segmento: string;
  status: "novo" | "em_contato" | "negociacao" | "convertido" | "sem_interesse" | "tratado";
  observacoes: string;
  municipio?: string;
  uf?: string;
  cnpj?: string;
  agencia?: string;
  pa?: string;
  gerentePJ?: string;
  diretoriaRegional?: string;
  gerenciaRegional?: string;
  dataVisita?: string;
  perfilRegiao?: "Grande Centro" | "Periferia" | "PA" | "Presença";
  temPerfilComercial?: boolean;
  motivoSemPerfil?: "Falta de Estrutura" | "Ramo Desenquadrado" | "Saúde Financeira (Restritivos)" | "Outros";
  motivoSemPerfilOutros?: string;
  clienteAceitouProposta?: boolean;
  motivoNaoEfetivacao?: "Mão de Obra (Funcionários)" | "Interferência no Negócio Principal" | "Insegurança" | "Remuneração não Atrativa" | "Restritivo Relevante" | "Outra";
  motivoNaoEfetivacaoOutros?: string;
}

interface ProspectTableProps {
  leads: Lead[];
  onUpdateStatus?: (lead: Lead) => void;
  tableTitle: string;
  onFilterChange?: (filters: {
    diretoriaRegional?: string;
    gerenciaRegional?: string;
  }) => void;
}

const statusLabels = {
  novo: { label: "Novo Lead", color: "bg-blue-100 text-blue-800" },
  em_contato: { label: "Em Contato", color: "bg-yellow-100 text-yellow-800" },
  negociacao: { label: "Em Negociação", color: "bg-purple-100 text-purple-800" },
  convertido: { label: "Convertido", color: "bg-green-100 text-green-800" },
  sem_interesse: { label: "Sem Interesse", color: "bg-gray-100 text-gray-800" },
  tratado: { label: "Tratado", color: "bg-green-100 text-green-800" }
};

const ProspectTable = ({ leads, onUpdateStatus, tableTitle, onFilterChange }: ProspectTableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Lead | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [filters, setFilters] = useState<{
    diretoriaRegional?: string;
    gerenciaRegional?: string;
  }>({});

  const handleSort = (key: keyof Lead) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const getSortIcon = (key: keyof Lead) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const sortedLeads = React.useMemo(() => {
    if (!sortConfig.key) return leads;

    return [...leads].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (sortConfig.direction === 'asc') {
        return String(aValue).localeCompare(String(bValue));
      } else {
        return String(bValue).localeCompare(String(aValue));
      }
    });
  }, [leads, sortConfig]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const updatedLead = {
        ...selectedLead,
        ...formData,
        status: "tratado" as const
      };

      if (onUpdateStatus) {
        onUpdateStatus(updatedLead);
      }

      setSelectedLead(null);
      setFormData({});
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
    }
  };

  // Função para obter valores únicos de diretoria regional
  const diretoriasRegionais = React.useMemo(() => {
    const diretorias = new Set(leads.map(lead => lead.diretoriaRegional).filter(Boolean));
    return Array.from(diretorias).sort();
  }, [leads]);

  // Função para obter valores únicos de gerência regional
  const gerenciasRegionais = React.useMemo(() => {
    const gerencias = new Set(leads.map(lead => lead.gerenciaRegional).filter(Boolean));
    return Array.from(gerencias).sort();
  }, [leads]);

  // Função para lidar com mudanças nos filtros
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

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
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{tableTitle}</h3>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Diretoria Regional</label>
              <select
                className="w-48 p-2 border rounded"
                value={filters.diretoriaRegional || ''}
                onChange={(e) => handleFilterChange('diretoriaRegional', e.target.value)}
              >
                <option value="">Todas</option>
                {diretoriasRegionais.map((diretoria) => (
                  <option key={diretoria} value={diretoria}>
                    {diretoria}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gerência Regional</label>
              <select
                className="w-48 p-2 border rounded"
                value={filters.gerenciaRegional || ''}
                onChange={(e) => handleFilterChange('gerenciaRegional', e.target.value)}
              >
                <option value="">Todas</option>
                {gerenciasRegionais.map((gerencia) => (
                  <option key={gerencia} value={gerencia}>
                    {gerencia}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-1 w-full"
                onClick={() => handleSort('nome')}
              >
                Nome
                {getSortIcon('nome')}
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-1 w-full"
                onClick={() => handleSort('municipio')}
              >
                Localização
                {getSortIcon('municipio')}
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-1 w-full"
                onClick={() => handleSort('status')}
              >
                Status
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-1 w-full"
                onClick={() => handleSort('telefone')}
              >
                Contato
                {getSortIcon('telefone')}
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-1 w-full"
                onClick={() => handleSort('cnpj')}
              >
                CNPJ
                {getSortIcon('cnpj')}
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-1 w-full"
                onClick={() => handleSort('agencia')}
              >
                Agência/PA
                {getSortIcon('agencia')}
              </Button>
            </TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => (
            <React.Fragment key={lead.id}>
              <TableRow>
                <TableCell className="text-left">
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.nome}</span>
                    {lead.segmento && (
                      <span className="text-xs text-gray-500">{lead.segmento}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {lead.municipio && lead.uf ? (
                    <span>{lead.municipio} - {lead.uf}</span>
                  ) : (
                    <span className="text-gray-400">Não informado</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={statusLabels[lead.status].color}>
                    {statusLabels[lead.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{lead.telefone}</TableCell>
                <TableCell className="text-center">
                  {lead.cnpj || <span className="text-gray-400">Não informado</span>}
                </TableCell>
                <TableCell className="text-center">
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
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 bg-blue-50 border-blue-200 hover:bg-blue-100"
                      title="Ver detalhes"
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      <Info className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 bg-green-50 border-green-200 hover:bg-green-100"
                      title="Adicionar tratativa"
                      onClick={() => {
                        setSelectedLead(lead);
                        setFormData({});
                      }}
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </Button>
                    {onUpdateStatus && (
                      <Button
                        size="sm"
                        className="bg-bradesco-blue"
                        onClick={() => onUpdateStatus(lead)}
                      >
                        Atualizar Status
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {expandedLead === lead.id && (
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={7} className="py-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Informações da Loja</h4>
                        <ul className="space-y-1.5">
                          <li className="text-sm">
                            <span className="font-medium">Localização:</span> {lead.municipio && lead.uf ? `${lead.municipio} - ${lead.uf}` : 'Não informado'}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">Nome PDV:</span> {lead.nome}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">Telefone:</span> {lead.telefone}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">CNPJ:</span> {lead.cnpj || 'Não informado'}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">Endereço:</span> {lead.endereco}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Hierarquia</h4>
                        <ul className="space-y-1.5">
                          <li className="text-sm">
                            <span className="font-medium">Diretoria Regional:</span> {lead.diretoriaRegional || 'Não informado'}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">Gerência Regional:</span> {lead.gerenciaRegional || 'Não informado'}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">Gerente PJ:</span> {lead.gerentePJ || 'Não informado'}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Dados Bancários</h4>
                        <ul className="space-y-1.5">
                          <li className="text-sm">
                            <span className="font-medium">Agência:</span> {lead.agencia || 'Não informado'}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">PA:</span> {lead.pa || 'Não informado'}
                          </li>
                          <li className="text-sm">
                            <span className="font-medium">Status:</span> {statusLabels[lead.status].label}
                          </li>
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

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Formulário de Tratativa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data da Visita</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={formData.dataVisita || ''}
                  onChange={(e) => setFormData({ ...formData, dataVisita: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Perfil da Região</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.perfilRegiao || ''}
                  onChange={(e) => setFormData({ ...formData, perfilRegiao: e.target.value as Lead['perfilRegiao'] })}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Grande Centro">Grande Centro</option>
                  <option value="Periferia">Periferia</option>
                  <option value="PA">PA</option>
                  <option value="Presença">Presença</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tem perfil comercial para ser correspondente?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="temPerfilComercial"
                      value="true"
                      checked={formData.temPerfilComercial === true}
                      onChange={() => setFormData({ ...formData, temPerfilComercial: true })}
                      className="mr-2"
                    />
                    Sim
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="temPerfilComercial"
                      value="false"
                      checked={formData.temPerfilComercial === false}
                      onChange={() => setFormData({ ...formData, temPerfilComercial: false })}
                      className="mr-2"
                    />
                    Não
                  </label>
                </div>
              </div>

              {formData.temPerfilComercial === false && (
                <div>
                  <label className="block text-sm font-medium mb-1">Por que não tem perfil comercial?</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.motivoSemPerfil || ''}
                    onChange={(e) => setFormData({ ...formData, motivoSemPerfil: e.target.value as Lead['motivoSemPerfil'] })}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Falta de Estrutura">Falta de Estrutura</option>
                    <option value="Ramo Desenquadrado">Ramo Desenquadrado</option>
                    <option value="Saúde Financeira (Restritivos)">Saúde Financeira (Restritivos)</option>
                    <option value="Outros">Outros</option>
                  </select>
                  {formData.motivoSemPerfil === "Outros" && (
                    <input
                      type="text"
                      className="w-full p-2 border rounded mt-2"
                      placeholder="Especifique o motivo"
                      value={formData.motivoSemPerfilOutros || ''}
                      onChange={(e) => setFormData({ ...formData, motivoSemPerfilOutros: e.target.value })}
                      required
                    />
                  )}
                </div>
              )}

              {formData.temPerfilComercial === true && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente aceitou proposta?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="clienteAceitouProposta"
                        value="true"
                        checked={formData.clienteAceitouProposta === true}
                        onChange={() => setFormData({ ...formData, clienteAceitouProposta: true })}
                        className="mr-2"
                      />
                      Sim
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="clienteAceitouProposta"
                        value="false"
                        checked={formData.clienteAceitouProposta === false}
                        onChange={() => setFormData({ ...formData, clienteAceitouProposta: false })}
                        className="mr-2"
                      />
                      Não
                    </label>
                  </div>
                </div>
              )}

              {formData.clienteAceitouProposta === false && (
                <div>
                  <label className="block text-sm font-medium mb-1">Qual o motivo da não efetivação?</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.motivoNaoEfetivacao || ''}
                    onChange={(e) => setFormData({ ...formData, motivoNaoEfetivacao: e.target.value as Lead['motivoNaoEfetivacao'] })}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Mão de Obra (Funcionários)">Mão de Obra (Funcionários)</option>
                    <option value="Interferência no Negócio Principal">Interferência no Negócio Principal</option>
                    <option value="Insegurança">Insegurança</option>
                    <option value="Remuneração não Atrativa">Remuneração não Atrativa</option>
                    <option value="Restritivo Relevante">Restritivo Relevante</option>
                    <option value="Outra">Outra</option>
                  </select>
                  {formData.motivoNaoEfetivacao === "Outra" && (
                    <input
                      type="text"
                      className="w-full p-2 border rounded mt-2"
                      placeholder="Especifique o motivo"
                      value={formData.motivoNaoEfetivacaoOutros || ''}
                      onChange={(e) => setFormData({ ...formData, motivoNaoEfetivacaoOutros: e.target.value })}
                      required
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedLead(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-bradesco-blue">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectTable;
