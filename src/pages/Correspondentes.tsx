import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp, Filter } from 'lucide-react';
import { CorrespondentesTable } from '@/components/correspondentes/CorrespondentesTable';
import { CorrespondentesFilters } from '@/components/correspondentes/CorrespondentesFilters';
import { TratativaCorbanModal } from '@/components/correspondentes/TratativaCorbanModal';
import { ViewTratativasCorbanModal } from '@/components/correspondentes/ViewTratativasCorbanModal';
import { toast } from '@/hooks/use-toast';

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

interface FilterState {
  search: string;
  diretoria: string;
  gerencia: string;
  gerente_area: string;
  coordenador: string;
  supervisor: string;
  agencia: string;
  pa: string;
  status: string;
}

function Correspondentes() {
  const [correspondentes, setCorrespondentes] = useState<Correspondente[]>([]);
  const [filteredCorrespondentes, setFilteredCorrespondentes] = useState<Correspondente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    diretoria: '',
    gerencia: '',
    agencia: '',
    pa: '',
    status: ''
  });
  const [selectedCorrespondente, setSelectedCorrespondente] = useState<Correspondente | null>(null);
  const [tratativaModalOpen, setTratativaModalOpen] = useState(false);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  // Dados mock para desenvolvimento - depois será substituído pela API
  const mockData: Correspondente[] = [
    {
      id: '1',
      CHAVE_LOJA: 'LOJA001',
      CNPJ: '12.345.678/0001-90',
      NOME: 'Correspondente Alpha Ltda',
      nr_pacb: 'PACB001',
      diretoria: 'Diretoria Comercial',
      gerencia: 'Gerência Regional SP',
      gerente_area: 'Gerente Área Centro',
      coordenador: 'Coord. SP Capital',
      supervisor: 'João Silva',
      agencia: 'Agência Centro',
      pa: 'PA Vila Madalena',
      status: 'ativo',
      ultima_tratativa: '2024-01-15',
      total_tratativas: 5
    },
    {
      id: '2',
      CHAVE_LOJA: 'LOJA002',
      CNPJ: '98.765.432/0001-10',
      NOME: 'Beta Correspondente S/A',
      nr_pacb: 'PACB002',
      diretoria: 'Diretoria Comercial',
      gerencia: 'Gerência Regional RJ',
      gerente_area: 'Gerente Área Zona Sul',
      coordenador: 'Coord. RJ Sul',
      supervisor: 'Maria Santos',
      agencia: 'Agência Copacabana',
      status: 'ativo',
      ultima_tratativa: '2024-01-10',
      total_tratativas: 3
    },
    {
      id: '3',
      CHAVE_LOJA: 'LOJA003',
      CNPJ: '11.222.333/0001-44',
      NOME: 'Gamma Financial',
      nr_pacb: 'PACB003',
      diretoria: 'Diretoria Regional',
      gerencia: 'Gerência Regional MG',
      gerente_area: 'Gerente Área BH',
      coordenador: 'Coord. MG Central',
      supervisor: 'Carlos Oliveira',
      agencia: 'Agência Savassi',
      pa: 'PA Funcionários',
      status: 'inativo',
      ultima_tratativa: '2023-12-20',
      total_tratativas: 1
    }
  ];

  useEffect(() => {
    loadCorrespondentes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [correspondentes, filters]);

  const loadCorrespondentes = async () => {
    setIsLoading(true);
    try {
      // Simula carregamento da API
      setTimeout(() => {
        setCorrespondentes(mockData);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao carregar correspondentes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os correspondentes',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = correspondentes;

    if (filters.search) {
      filtered = filtered.filter(item =>
        item.NOME.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.CNPJ.includes(filters.search) ||
        item.CHAVE_LOJA.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.nr_pacb.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.diretoria) {
      filtered = filtered.filter(item => item.diretoria === filters.diretoria);
    }

    if (filters.gerencia) {
      filtered = filtered.filter(item => item.gerencia === filters.gerencia);
    }

    if (filters.agencia) {
      filtered = filtered.filter(item => item.agencia === filters.agencia);
    }

    if (filters.pa) {
      filtered = filtered.filter(item => item.pa === filters.pa);
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    setFilteredCorrespondentes(filtered);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTratativa = (correspondente: Correspondente) => {
    setSelectedCorrespondente(correspondente);
    setTratativaModalOpen(true);
  };

  const handleViewHistorico = (correspondente: Correspondente) => {
    setSelectedCorrespondente(correspondente);
    setHistoricoModalOpen(true);
  };

  const handleTratativaSuccess = () => {
    loadCorrespondentes(); // Recarrega os dados
    toast({
      title: 'Sucesso',
      description: 'Tratativa registrada com sucesso!',
      variant: 'default',
    });
  };

  const getStatsData = () => {
    const total = correspondentes.length;
    const ativos = correspondentes.filter(c => c.status === 'ativo').length;
    const comTratativas = correspondentes.filter(c => (c.total_tratativas || 0) > 0).length;

    return { total, ativos, comTratativas };
  };

  const stats = getStatsData();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestão de Correspondentes
            </h1>
            <p className="text-gray-600 mt-1">
              Acompanhe e gerencie os logs de tratativas com correspondentes bancários
            </p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Correspondentes
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-600 mt-1">
                Todos os correspondentes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Correspondentes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.ativos}</div>
              <p className="text-xs text-gray-600 mt-1">
                {((stats.ativos / stats.total) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Com Tratativas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.comTratativas}</div>
              <p className="text-xs text-gray-600 mt-1">
                Possuem histórico de tratativas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CorrespondentesFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            correspondentes={correspondentes}
          />
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Correspondentes
            {filteredCorrespondentes.length !== correspondentes.length && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({filteredCorrespondentes.length} de {correspondentes.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CorrespondentesTable 
            correspondentes={filteredCorrespondentes}
            isLoading={isLoading}
            onTratativa={handleTratativa}
            onViewHistorico={handleViewHistorico}
            onRefresh={loadCorrespondentes}
          />
        </CardContent>
      </Card>

      {/* Modal de Tratativa */}
      {selectedCorrespondente && (
        <TratativaCorbanModal
          isOpen={tratativaModalOpen}
          onClose={() => setTratativaModalOpen(false)}
          onSuccess={handleTratativaSuccess}
          correspondente={selectedCorrespondente}
        />
      )}

      {/* Modal de Histórico de Tratativas */}
      {selectedCorrespondente && (
        <ViewTratativasCorbanModal
          isOpen={historicoModalOpen}
          onClose={() => setHistoricoModalOpen(false)}
          onSuccess={handleTratativaSuccess}
          correspondente={selectedCorrespondente}
        />
      )}
    </div>
  );
}

export default Correspondentes; 