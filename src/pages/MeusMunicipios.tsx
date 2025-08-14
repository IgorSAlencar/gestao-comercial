import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Calendar, 
  Building2, 
  Plus, 
  Trash2, 
  Filter, 
  Users, 
  Search, 
  X, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MunicipioAutocomplete } from '@/components/ui/municipio-autocomplete';

// Tipos para os dados
interface Municipio {
  id: string;
  nome: string;
  uf: string;
  supervisorId: string;
  supervisorNome: string;
  visitasAgendadas: VisitaAgendada[];
  visitasRealizadas: VisitaRealizada[];
}

interface VisitaAgendada {
  id: string;
  data: Date;
  status: 'agendada' | 'realizada' | 'cancelada';
}

interface VisitaRealizada {
  id: string;
  data: Date;
  cnpjs: CNPJVisitado[];
  observacoes?: string;
}

interface CNPJVisitado {
  id: string;
  cnpj: string;
  razaoSocial: string;
  ramo: 'farmacia' | 'mercado';
  interesse: 'sim' | 'nao';
  contratoEnviado?: 'sim' | 'nao';
  motivoInteresse?: string;
  motivoContrato?: string;
  semCNPJ?: boolean;
  nomeLoja?: string;
}

// Dados mockados para demonstração
const municipiosMock: Municipio[] = [
  {
    id: "1",
    nome: "São Paulo",
    uf: "SP",
    supervisorId: "supervisor1",
    supervisorNome: "João Silva",
    visitasAgendadas: [
      {
        id: "v1",
        data: new Date(2024, 11, 15),
        status: 'agendada'
      }
    ],
    visitasRealizadas: []
  },
  {
    id: "2",
    nome: "Rio de Janeiro",
    uf: "RJ",
    supervisorId: "supervisor1",
    supervisorNome: "João Silva",
    visitasAgendadas: [],
    visitasRealizadas: [
      {
        id: "vr1",
        data: new Date(2024, 11, 10),
        cnpjs: [
          {
            id: "cnpj1",
            cnpj: "12.345.678/0001-90",
            razaoSocial: "Farmácia Popular Ltda",
            ramo: 'farmacia',
            interesse: 'sim',
            contratoEnviado: 'sim'
          }
        ],
        observacoes: "Visita bem-sucedida, cliente interessado"
      }
    ]
  },
  {
    id: "3",
    nome: "Belo Horizonte",
    uf: "MG",
    supervisorId: "supervisor2",
    supervisorNome: "Maria Santos",
    visitasAgendadas: [],
    visitasRealizadas: []
  }
];

const MeusMunicipiosPage = () => {
  const { user, isManager, isCoordinator, isSupervisor, subordinates } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados principais
  const [municipios, setMunicipios] = useState<Municipio[]>(municipiosMock);
  const [selectedUF, setSelectedUF] = useState<string>("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMunicipios, setExpandedMunicipios] = useState<Set<string>>(new Set());
  const [expandedCNPJs, setExpandedCNPJs] = useState<Set<string>>(new Set());

  // Estados para modais
  const [isAgendarVisitaOpen, setIsAgendarVisitaOpen] = useState(false);
  const [isTratarVisitaOpen, setIsTratarVisitaOpen] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
  const [dataVisita, setDataVisita] = useState<Date | null>(null);
  const [cnpjsVisitados, setCnpjsVisitados] = useState<CNPJVisitado[]>([]);
  const [observacoes, setObservacoes] = useState("");

  // Filtros disponíveis
  const ufs = Array.from(new Set(municipios.map(m => m.uf))).sort();

  // Filtrar municípios baseado no usuário logado e filtros
  const municipiosFiltrados = municipios.filter(municipio => {
    // Filtro por usuário
    if (isSupervisor && municipio.supervisorId !== user?.id) {
      return false;
    }
    
    if ((isManager || isCoordinator) && selectedSupervisor && municipio.supervisorId !== selectedSupervisor) {
      return false;
    }

    // Filtro por UF
    if (selectedUF && municipio.uf !== selectedUF) {
      return false;
    }

    // Filtro por busca
    if (searchTerm && !municipio.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Funções para manipular municípios
  const toggleMunicipioExpansion = (municipioId: string) => {
    const newExpanded = new Set(expandedMunicipios);
    if (newExpanded.has(municipioId)) {
      newExpanded.delete(municipioId);
    } else {
      newExpanded.add(municipioId);
    }
    setExpandedMunicipios(newExpanded);
  };

  const isMunicipioExpanded = (municipioId: string) => {
    return expandedMunicipios.has(municipioId);
  };

  // Funções para manipular CNPJs expandidos
  const toggleCNPJExpansion = (cnpjId: string) => {
    const newExpanded = new Set(expandedCNPJs);
    if (newExpanded.has(cnpjId)) {
      newExpanded.delete(cnpjId);
    } else {
      newExpanded.add(cnpjId);
    }
    setExpandedCNPJs(newExpanded);
  };

  const isCNPJExpanded = (cnpjId: string) => {
    return expandedCNPJs.has(cnpjId);
  };

  // Funções para agendar visita
  const handleAgendarVisita = (municipio: Municipio) => {
    setSelectedMunicipio(municipio);
    setDataVisita(null);
    setIsAgendarVisitaOpen(true);
  };

  const handleSalvarAgendamento = () => {
    if (!selectedMunicipio || !dataVisita) {
      toast({
        title: "Erro",
        description: "Selecione uma data para a visita",
        variant: "destructive"
      });
      return;
    }

    const novaVisita: VisitaAgendada = {
      id: `v${Date.now()}`,
      data: dataVisita,
      status: 'agendada'
    };

    setMunicipios(prev => prev.map(m => 
      m.id === selectedMunicipio.id 
        ? { ...m, visitasAgendadas: [...m.visitasAgendadas, novaVisita] }
        : m
    ));

    toast({
      title: "Sucesso",
      description: `Visita agendada para ${selectedMunicipio.nome} em ${format(dataVisita, "dd/MM/yyyy", { locale: ptBR })}`
    });

    setIsAgendarVisitaOpen(false);
    setSelectedMunicipio(null);
    setDataVisita(null);
  };

  // Funções para tratar visita
  const handleTratarVisita = (municipio: Municipio) => {
    setSelectedMunicipio(municipio);
    // Inicializa com pelo menos um CNPJ vazio
    setCnpjsVisitados([{
      id: `cnpj${Date.now()}`,
      cnpj: "",
      razaoSocial: "",
      ramo: 'farmacia',
      interesse: 'sim'
    }]);
    setObservacoes("");
    setIsTratarVisitaOpen(true);
  };

  const handleAdicionarCNPJ = () => {
    const novoCNPJ: CNPJVisitado = {
      id: `cnpj${Date.now()}`,
      cnpj: "",
      razaoSocial: "",
      ramo: 'farmacia',
      interesse: 'sim'
    };
    setCnpjsVisitados(prev => [...prev, novoCNPJ]);
  };

  const handleRemoverCNPJ = (index: number) => {
    setCnpjsVisitados(prev => prev.filter((_, i) => i !== index));
  };

  const handleCNPJChange = (index: number, field: keyof CNPJVisitado, value: any) => {
    setCnpjsVisitados(prev => prev.map((cnpj, i) => 
      i === index ? { ...cnpj, [field]: value } : cnpj
    ));
  };

  const handleSalvarTratativa = () => {
    if (cnpjsVisitados.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma empresa visitada",
        variant: "destructive"
      });
      return;
    }

    // Validação atualizada para considerar empresas sem CNPJ
    const hasInvalidEntries = cnpjsVisitados.some(cnpj => {
      if (cnpj.semCNPJ) {
        return !cnpj.nomeLoja || !cnpj.razaoSocial;
      } else {
        return !cnpj.cnpj || !cnpj.razaoSocial;
      }
    });

    if (hasInvalidEntries) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const novaVisita: VisitaRealizada = {
      id: `vr${Date.now()}`,
      data: new Date(),
      cnpjs: cnpjsVisitados,
      observacoes
    };

    setMunicipios(prev => prev.map(m => 
      m.id === selectedMunicipio!.id 
        ? { ...m, visitasRealizadas: [...m.visitasRealizadas, novaVisita] }
        : m
    ));

    toast({
      title: "Sucesso",
      description: `Tratativa salva para ${selectedMunicipio!.nome}`
    });

    setIsTratarVisitaOpen(false);
    setSelectedMunicipio(null);
    setCnpjsVisitados([]);
    setObservacoes("");
  };

  // Funções auxiliares
  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatCnpjOnType = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara conforme o usuário digita
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    } else {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  const getStatusBadge = (municipio: Municipio) => {
    if (municipio.visitasRealizadas.length > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Visitas Realizadas</Badge>;
    }
    if (municipio.visitasAgendadas.length > 0) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Visitas Agendadas</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600">Sem Visitas</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Municípios</h1>
          <p className="text-gray-600 mt-1">
            Gestão de municípios prioritários para contratação
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtro por Supervisor (apenas para gerentes/coordenadores) */}
          {(isManager || isCoordinator) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar por Supervisor</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtrar por Supervisor</DialogTitle>
                  <DialogDescription>
                    Selecione um supervisor para visualizar seus municípios
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        !selectedSupervisor ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedSupervisor(null)}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4" />
                        <span>Todos os supervisores</span>
                      </div>
                    </div>
                    
                    {subordinates
                      .filter(sub => sub.role === 'supervisor')
                      .map((supervisor) => (
                        <div 
                          key={supervisor.id} 
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedSupervisor === supervisor.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSupervisor(supervisor.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4" />
                            <span>{supervisor.name}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Fechar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedUF} onValueChange={setSelectedUF}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Selecione a UF..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {ufs.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicador de filtro ativo */}
      {selectedSupervisor && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="font-medium">
              Visualizando municípios de {
                subordinates.find(s => s.id === selectedSupervisor)?.name || "Supervisor"
              }
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedSupervisor(null)}
            className="text-sm"
          >
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Lista de Municípios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
        {municipiosFiltrados.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum município encontrado</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedUF || selectedSupervisor 
                    ? "Tente ajustar os filtros aplicados"
                    : "Não há municípios cadastrados para seu perfil"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          municipiosFiltrados.map((municipio) => (
            <Card 
              key={municipio.id} 
              className="hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{municipio.nome}</CardTitle>
                        <p className="text-xs text-gray-600">{municipio.uf}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 truncate">
                        <span className="font-medium">Supervisor:</span> {municipio.supervisorNome}
                      </p>
                      {getStatusBadge(municipio)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAgendarVisita(municipio)}
                      className="text-xs px-2 py-1 h-7"
                      title="Agendar Visita"
                    >
                      <Calendar className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleTratarVisita(municipio)}
                      className="text-xs px-2 py-1 h-7 bg-green-600 hover:bg-green-700"
                      title="Tratar Visita"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMunicipioExpansion(municipio.id)}
                      className="px-2 py-1 h-7"
                      title={isMunicipioExpanded(municipio.id) ? "Recolher" : "Expandir"}
                    >
                      {isMunicipioExpanded(municipio.id) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Conteúdo expandido */}
              {isMunicipioExpanded(municipio.id) && (
                <CardContent className="pt-4 border-t mt-3">
                  <div className="space-y-6">
                    {/* Visitas Agendadas */}
                    {municipio.visitasAgendadas.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Visitas Agendadas
                        </h4>
                        <div className="space-y-2">
                          {municipio.visitasAgendadas.map((visita) => (
                            <div key={visita.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">
                                  {format(visita.data, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                {visita.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Visitas Realizadas */}
                    {municipio.visitasRealizadas.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Visitas Realizadas
                        </h4>
                        <div className="space-y-4">
                          {municipio.visitasRealizadas.map((visita) => (
                            <div key={visita.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {format(visita.data, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <Badge variant="secondary" className="text-xs ml-auto">
                                  {visita.cnpjs.length} {visita.cnpjs.length === 1 ? 'empresa' : 'empresas'}
                                </Badge>
                              </div>
                              
                              {/* Lista simples de CNPJs */}
                              <div className="space-y-1">
                                {visita.cnpjs.map((cnpj, index) => (
                                  <div key={cnpj.id} className="group">
                                    <div 
                                      className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                                      onClick={() => toggleCNPJExpansion(cnpj.id)}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="text-xs font-medium text-gray-500 w-6 text-center">
                                          {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="text-sm font-medium text-gray-900 truncate">
                                            {cnpj.razaoSocial || 'Empresa sem nome'}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {cnpj.semCNPJ ? (
                                              <span className="italic">
                                                {cnpj.nomeLoja ? `Loja: ${cnpj.nomeLoja}` : 'Empresa informal'}
                                              </span>
                                            ) : (
                                              formatCnpj(cnpj.cnpj)
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {cnpj.interesse === 'sim' ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          {isCNPJExpanded(cnpj.id) ? (
                                            <ChevronUp className="h-3 w-3" />
                                          ) : (
                                            <ChevronDown className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Detalhes expandidos do CNPJ */}
                                    {isCNPJExpanded(cnpj.id) && (
                                      <div className="mt-2 p-3 bg-white border rounded-md ml-4">
                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                          {cnpj.semCNPJ ? (
                                            <div className="flex justify-between">
                                              <span className="font-medium text-gray-700">Nome da Loja:</span>
                                              <span className="text-gray-600 italic">
                                                {cnpj.nomeLoja || 'Não informado'}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex justify-between">
                                              <span className="font-medium text-gray-700">CNPJ:</span>
                                              <span className="text-gray-600">
                                                {formatCnpj(cnpj.cnpj)}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-700">Tipo:</span>
                                            <span className="text-gray-600">
                                              {cnpj.semCNPJ ? 'Empresa Informal' : 'Empresa Formal'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-700">Ramo:</span>
                                            <span className="text-gray-600">
                                              {cnpj.ramo === 'farmacia' ? 'Farmácia' : 'Mercado'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-700">Interesse:</span>
                                            <span className={cnpj.interesse === 'sim' ? 'text-green-600' : 'text-red-600'}>
                                              {cnpj.interesse === 'sim' ? 'Sim' : 'Não'}
                                            </span>
                                          </div>
                                          {cnpj.interesse === 'sim' && (
                                            <div className="flex justify-between">
                                              <span className="font-medium text-gray-700">Contrato Enviado:</span>
                                              <span className={cnpj.contratoEnviado === 'sim' ? 'text-green-600' : 'text-orange-600'}>
                                                {cnpj.contratoEnviado === 'sim' ? 'Sim' : 'Não'}
                                              </span>
                                            </div>
                                          )}
                                          {cnpj.motivoInteresse && (
                                            <div className="mt-2 pt-2 border-t">
                                              <span className="font-medium text-gray-700 block mb-1">
                                                Motivo {cnpj.interesse === 'sim' ? 'do interesse' : 'da falta de interesse'}:
                                              </span>
                                              <p className="text-gray-600 text-xs">{cnpj.motivoInteresse}</p>
                                            </div>
                                          )}
                                          {cnpj.motivoContrato && (
                                            <div className="mt-2 pt-2 border-t">
                                              <span className="font-medium text-gray-700 block mb-1">
                                                Motivo do contrato não enviado:
                                              </span>
                                              <p className="text-gray-600 text-xs">{cnpj.motivoContrato}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {visita.observacoes && (
                                <div className="mt-3 p-2 bg-white rounded border">
                                  <span className="text-xs font-medium text-gray-700 block mb-1">Observações:</span>
                                  <p className="text-xs text-gray-600">{visita.observacoes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {municipio.visitasAgendadas.length === 0 && municipio.visitasRealizadas.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma visita registrada para este município</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal Agendar Visita */}
      <Dialog open={isAgendarVisitaOpen} onOpenChange={setIsAgendarVisitaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Visita</DialogTitle>
            <DialogDescription>
              Agende uma visita para {selectedMunicipio?.nome} - {selectedMunicipio?.uf}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataVisita" className="text-sm font-medium">
                  Data da Visita
                </Label>
                <div className="mt-2">
                  <CalendarComponent
                    mode="single"
                    selected={dataVisita}
                    onSelect={setDataVisita}
                    className="rounded-md border"
                    locale={ptBR}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAgendarVisitaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarAgendamento} disabled={!dataVisita}>
              Agendar Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tratar Visita */}
      <Dialog open={isTratarVisitaOpen} onOpenChange={setIsTratarVisitaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Tratar Visita - {selectedMunicipio?.nome}
            </DialogTitle>
            <DialogDescription>
              Registre os CNPJs visitados e responda as perguntas para cada um
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Etapa 1: Quantidade de CNPJs */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Empresas Visitadas</h3>
                <p className="text-gray-600">
                  Quantas empresas foram visitadas em {selectedMunicipio?.nome}?
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="flex items-center border rounded-md overflow-hidden shadow-sm">
                  <button
                    type="button"
                    className="px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border-r focus:outline-none transition-colors"
                    onClick={() => {
                      if (cnpjsVisitados.length > 1) {
                        setCnpjsVisitados(prev => prev.slice(0, prev.length - 1));
                      }
                    }}
                    disabled={cnpjsVisitados.length <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  
                  <div className="px-6 py-3 bg-white text-center min-w-[80px]">
                    <span className="text-2xl font-bold text-gray-800">{cnpjsVisitados.length}</span>
                  </div>
                  
                  <button
                    type="button"
                    className="px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border-l focus:outline-none transition-colors"
                    onClick={handleAdicionarCNPJ}
                    disabled={cnpjsVisitados.length >= 20}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                
                <span className="ml-4 text-gray-600 font-medium">
                  {cnpjsVisitados.length === 1 ? 'empresa' : 'empresas'}
                </span>
              </div>

              {cnpjsVisitados.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma empresa adicionada</p>
                  <p className="text-sm">Use os botões acima para definir a quantidade</p>
                </div>
              )}
            </div>

            {/* Etapa 2: Lista de CNPJs */}
            {cnpjsVisitados.length > 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium mb-3 text-blue-800 flex items-center">
                    <Building2 className="mr-1.5 text-blue-600 h-4 w-4" />
                    Informe os dados das empresas visitadas:
                  </h3>
                </div>

                <div className="space-y-4">
                  {cnpjsVisitados.map((cnpj, index) => (
                    <Card key={cnpj.id} className="p-6 border-2 border-gray-100 hover:border-green-200 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-gray-900">Empresa #{index + 1}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverCNPJ(index)}
                          className="h-auto p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Checkbox para empresa sem CNPJ */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`sem-cnpj-${index}`}
                            checked={cnpj.semCNPJ || false}
                            onCheckedChange={(checked) => {
                              handleCNPJChange(index, 'semCNPJ', checked);
                              if (checked) {
                                // Limpar CNPJ quando marcar sem CNPJ
                                handleCNPJChange(index, 'cnpj', '');
                              } else {
                                // Limpar nome da loja quando desmarcar sem CNPJ
                                handleCNPJChange(index, 'nomeLoja', '');
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`sem-cnpj-${index}`} 
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            Empresa sem CNPJ (informal)
                          </Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CNPJ ou Nome da Loja */}
                        <div className="space-y-2">
                          {cnpj.semCNPJ ? (
                            <>
                              <Label htmlFor={`nome-loja-${index}`} className="text-sm text-gray-700">
                                Nome da Loja *
                              </Label>
                              <Input
                                id={`nome-loja-${index}`}
                                placeholder="Nome da loja..."
                                value={cnpj.nomeLoja || ''}
                                onChange={(e) => handleCNPJChange(index, 'nomeLoja', e.target.value)}
                                className="transition-all duration-200"
                              />
                            </>
                          ) : (
                            <>
                              <Label htmlFor={`cnpj-${index}`} className="text-sm text-gray-700">
                                CNPJ *
                              </Label>
                              <Input
                                id={`cnpj-${index}`}
                                placeholder="XX.XXX.XXX/XXXX-XX"
                                value={cnpj.cnpj}
                                onChange={(e) => {
                                  const formatted = formatCnpjOnType(e.target.value);
                                  handleCNPJChange(index, 'cnpj', formatted);
                                }}
                                onKeyPress={(e) => {
                                  if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                                    e.preventDefault();
                                  }
                                }}
                                maxLength={18} // 14 dígitos + 4 caracteres da máscara
                                className="transition-all duration-200"
                              />
                            </>
                          )}
                        </div>

    
                        {/* Ramo - aparece sempre */}
                        <div className="space-y-2">
                          <Label htmlFor={`ramo-${index}`} className="text-sm text-gray-700">
                            Ramo de Atividade é Farmácia/Mercado?
                          </Label>
                          <Select
                            value={cnpj.ramo}
                            onValueChange={(value: 'Sim' | 'Não') => handleCNPJChange(index, 'ramo', value)}
                          >
                            <SelectTrigger className="transition-all duration-200">
                              <SelectValue placeholder="Selecione a opção..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Interesse - aparece sempre */}
                        <div className="space-y-2">
                          <Label htmlFor={`interesse-${index}`} className="text-sm text-gray-700">
                            Houve Interesse?
                          </Label>
                          <Select
                            value={cnpj.interesse}
                            onValueChange={(value: 'sim' | 'nao') => handleCNPJChange(index, 'interesse', value)}
                          >
                            <SelectTrigger className="transition-all duration-200">
                              <SelectValue placeholder="Selecione a opção..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Campos condicionais baseados no interesse */}
                      {cnpj.interesse === 'sim' && (
                        <div className="mt-4">
                          {/* Contrato enviado */}
                          <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-700">Contrato foi enviado?</span>
                            </div>
                            <Select
                              value={cnpj.contratoEnviado || ""}
                              onValueChange={(value: 'sim' | 'nao') => handleCNPJChange(index, 'contratoEnviado', value)}
                            >
                              <SelectTrigger className="w-full transition-all duration-200">
                                <SelectValue placeholder="Selecione a opção..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sim">Sim</SelectItem>
                                <SelectItem value="nao">Não</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Motivo do contrato não enviado */}
                            {cnpj.contratoEnviado === 'nao' && (
                              <div className="mt-3">
                                <Label htmlFor={`motivo-contrato-${index}`} className="text-sm text-gray-700 block mb-2">
                                  Motivo do contrato não enviado
                                </Label>
                                <Textarea
                                  id={`motivo-contrato-${index}`}
                                  placeholder="Descreva o motivo..."
                                  value={cnpj.motivoContrato || ""}
                                  onChange={(e) => handleCNPJChange(index, 'motivoContrato', e.target.value)}
                                  className="min-h-[80px] resize-none transition-all duration-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}


          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsTratarVisitaOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarTratativa}
              disabled={cnpjsVisitados.length === 0 || cnpjsVisitados.some(cnpj => {
                if (cnpj.semCNPJ) {
                  return !cnpj.nomeLoja || !cnpj.razaoSocial;
                } else {
                  return !cnpj.cnpj || !cnpj.razaoSocial;
                }
              })}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 transition-all duration-200"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar Tratativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeusMunicipiosPage;
