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
import { municipiosPrioritariosApi, tratativasMunicipiosApi, MunicipioPrioritario, VisitaAgendada, VisitaRealizada, CNPJVisitado } from '@/services/api';

// Usar os tipos da API
type Municipio = MunicipioPrioritario;

// Tipo local para CNPJVisitado com o campo dataVisita
interface CNPJVisitadoLocal extends Omit<CNPJVisitado, 'dataVisita'> {
  dataVisita?: string; // Formato DD/MM/YYYY
}

const MeusMunicipiosPage = () => {
  const { user, isManager, isCoordinator, isSupervisor, isAdmin, subordinates } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados dos filtros (declarados antes da query)
  const [selectedUF, setSelectedUF] = useState<string>("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);

  // Query para buscar municípios da API
  const { data: municipios = [], isLoading, error } = useQuery({
    queryKey: ['municipios-prioritarios', selectedSupervisor],
    queryFn: () => municipiosPrioritariosApi.getMunicipios(selectedSupervisor || undefined),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para salvar tratativas
  const salvarTratativaMutation = useMutation({
    mutationFn: tratativasMunicipiosApi.salvarTratativa,
    onSuccess: () => {
      // Recarregar municípios para mostrar as novas tratativas
      queryClient.invalidateQueries({ queryKey: ['municipios-prioritarios'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar tratativa:', error);
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [expandedMunicipios, setExpandedMunicipios] = useState<Set<string>>(new Set());
  const [expandedVisitas, setExpandedVisitas] = useState<Set<string>>(new Set());
  const [expandedCNPJs, setExpandedCNPJs] = useState<Set<string>>(new Set());

  // Estados para modais
  const [isAgendarVisitaOpen, setIsAgendarVisitaOpen] = useState(false);
  const [isTratarVisitaOpen, setIsTratarVisitaOpen] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
  const [dataVisita, setDataVisita] = useState<Date | null>(null);
  const [cnpjsVisitados, setCnpjsVisitados] = useState<CNPJVisitadoLocal[]>([]);
  const [observacoes, setObservacoes] = useState("");

  // Filtros disponíveis
  const ufs = Array.from(new Set(municipios.map(m => m.uf))).sort();

  // Calcular estatísticas dos municípios
  const estatisticas = {
    totalMunicipios: municipios.length,
    municipiosComVisita: municipios.filter(m => m.visitasRealizadas.length > 0).length,
    totalLojasVisitadas: municipios.reduce((total, m) => 
      total + m.visitasRealizadas.reduce((visitaTotal, v) => 
        visitaTotal + v.cnpjs.length, 0
      ), 0
    ),
    totalAceites: municipios.reduce((total, m) => 
      total + m.visitasRealizadas.reduce((visitaTotal, v) => 
        visitaTotal + v.cnpjs.filter(c => c.interesse === 'sim').length, 0
      ), 0
    ),
    totalContratosEnviados: municipios.reduce((total, m) => 
      total + m.visitasRealizadas.reduce((visitaTotal, v) => 
        visitaTotal + v.cnpjs.filter(c => c.interesse === 'sim' && c.contratoEnviado === 'sim').length, 0
      ), 0
    )
  };

  // Filtrar municípios baseado no usuário logado e filtros
  const municipiosFiltrados = municipios.filter(municipio => {
    // Para supervisores, coordenadores e gerentes, os dados já vêm filtrados do backend
    // O filtro por supervisor agora é feito via API no backend
    // Aqui apenas aplicamos filtros adicionais de UI
    
    // Filtro por UF - só filtra se uma UF específica foi selecionada
    if (selectedUF && selectedUF.trim() !== "" && selectedUF !== "default") {
      if (municipio.uf !== selectedUF) {
        return false;
      }
    }
    // Se selectedUF for string vazia ("") ou "default", significa "Todas" - não filtra por UF

    // Filtro por busca - só filtra se há termo de busca
    if (searchTerm && searchTerm.trim() !== "") {
      if (!municipio.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Filtro por status de visita
    if (selectedStatusFilter && selectedStatusFilter.trim() !== "") {
      const hasVisitasRealizadas = municipio.visitasRealizadas.length > 0;
      const hasVisitasAgendadas = municipio.visitasAgendadas.length > 0;
      
      switch (selectedStatusFilter) {
        case 'realizadas':
          if (!hasVisitasRealizadas) return false;
          break;
        case 'agendadas':
          if (!hasVisitasAgendadas || hasVisitasRealizadas) return false;
          break;
        case 'sem-visitas':
          if (hasVisitasRealizadas || hasVisitasAgendadas) return false;
          break;
        default:
          break;
      }
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

  // Funções para manipular visitas expandidas
  const toggleVisitaExpansion = (visitaId: string) => {
    const newExpanded = new Set(expandedVisitas);
    if (newExpanded.has(visitaId)) {
      newExpanded.delete(visitaId);
    } else {
      newExpanded.add(visitaId);
    }
    setExpandedVisitas(newExpanded);
  };

  const isVisitaExpanded = (visitaId: string) => {
    return expandedVisitas.has(visitaId);
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

    // Atualizar cache local do React Query
    queryClient.setQueryData(['municipios-prioritarios'], (oldData: Municipio[] | undefined) => {
      if (!oldData) return oldData;
      
      return oldData.map(m => 
        m.id === selectedMunicipio.id 
          ? { ...m, visitasAgendadas: [...m.visitasAgendadas, novaVisita] }
          : m
      );
    });

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
    setDataVisita(null); // Não precisamos mais da data global
    // Inicializa com pelo menos um CNPJ vazio
    setCnpjsVisitados([{
      id: `cnpj${Date.now()}`,
      cnpj: "",
      razaoSocial: "",
      ramo: 'farmacia',
      interesse: 'sim',
      dataVisita: ""
    }]);
    setObservacoes("");
    setIsTratarVisitaOpen(true);
  };

  const handleAdicionarCNPJ = () => {
    const novoCNPJ: CNPJVisitadoLocal = {
      id: `cnpj${Date.now()}`,
      cnpj: "",
      razaoSocial: "",
      ramo: 'farmacia',
      interesse: 'sim',
      dataVisita: ""
    };
    setCnpjsVisitados(prev => [...prev, novoCNPJ]);
  };

  const handleRemoverCNPJ = (index: number) => {
    setCnpjsVisitados(prev => prev.filter((_, i) => i !== index));
  };

  const handleCNPJChange = (index: number, field: keyof CNPJVisitadoLocal, value: any) => {
    setCnpjsVisitados(prev => prev.map((cnpj, i) => 
      i === index ? { ...cnpj, [field]: value } : cnpj
    ));
  };

  const handleSalvarTratativa = async () => {
    if (cnpjsVisitados.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma empresa visitada",
        variant: "destructive"
      });
      return;
    }

    // Validação atualizada para incluir data da visita
    const hasInvalidEntries = cnpjsVisitados.some(cnpj => {
      // Validar data da visita
      if (!cnpj.dataVisita || !validateDate(cnpj.dataVisita)) {
        return true;
      }
      
      // Validar outros campos baseados no tipo de empresa
      if (cnpj.semCNPJ) {
        return !cnpj.nomeLoja;
      } else {
        return !cnpj.cnpj;
      }
    });

    if (hasInvalidEntries) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios, incluindo datas válidas (DD/MM/YYYY)",
        variant: "destructive"
      });
      return;
    }

    try {
      // Preparar dados para enviar à API
      const tratativaData = {
        cd_munic: selectedMunicipio!.codigoMunicipio,
        empresas: cnpjsVisitados.map(cnpj => ({
          cnpj: cnpj.cnpj || '',
          semCNPJ: cnpj.semCNPJ || false,
          nomeLoja: cnpj.nomeLoja || undefined,
          ramo: (cnpj.ramo === 'farmacia' ? 'sim' : 'nao') as 'sim' | 'nao',
          interesse: cnpj.interesse,
          contratoEnviado: cnpj.contratoEnviado || undefined,
          motivoContrato: cnpj.motivoContrato || undefined,
          dataVisita: cnpj.dataVisita || undefined
        }))
      };

      console.log('Enviando tratativa:', tratativaData);

      // Salvar via API
      await salvarTratativaMutation.mutateAsync(tratativaData);

      toast({
        title: "Sucesso",
        description: `Tratativa salva para ${selectedMunicipio!.nome}`
      });

      setIsTratarVisitaOpen(false);
      setSelectedMunicipio(null);
      setCnpjsVisitados([]);
      setObservacoes("");
      
    } catch (error) {
      console.error('Erro ao salvar tratativa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tratativa. Tente novamente.",
        variant: "destructive"
      });
    }
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

  const formatDateOnType = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara DD/MM/YYYY conforme o usuário digita
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const validateDate = (dateString: string) => {
    // Verifica se a string tem o formato completo DD/MM/YYYY
    if (dateString.length !== 10) return false;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Validações básicas
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    // Criar data e verificar se é válida
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  const getStatusBadge = (municipio: Municipio) => {
    if (municipio.visitasRealizadas.length > 0) {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800"
        >
          Visitas Realizadas
        </Badge>
      );
    }
    if (municipio.visitasAgendadas.length > 0) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
        >
          Visitas Agendadas
        </Badge>
      );
    }
    return <Badge variant="outline" className="text-gray-600">Sem Visitas</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Municípios Prioritários</h1>
          <p className="text-gray-600 mt-1">
            Gestão de municípios prioritários para contratação
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtro por Supervisor (apenas para gerentes/coordenadores/admins) */}
          {(isManager || isCoordinator || isAdmin) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar por Gerente Comercial</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtrar por Gerente Comercial</DialogTitle>
                  <DialogDescription>
                    Selecione um Gerente Comercial para visualizar seus municípios
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
                        <span>Todos os Gerentes Comerciais</span>
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

       {/* Cards de Estatísticas */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2">
             <div className="flex justify-between items-center">
               <CardTitle className="text-lg font-semibold text-gray-900">Total de Municípios</CardTitle>
               <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
                 <MapPin className="h-5 w-5 text-blue-600" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="mt-2">
               <p className="text-3xl font-bold text-blue-600">{estatisticas.totalMunicipios}</p>
               <p className="text-sm text-gray-500 mt-1">Municípios prioritários</p>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2">
             <div className="flex justify-between items-center">
               <CardTitle className="text-lg font-semibold text-gray-900">Municípios Visitados</CardTitle>
               <div className="p-2 rounded-full bg-green-50 border border-green-100">
                 <Calendar className="h-5 w-5 text-green-600" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="mt-2">
               <p className="text-3xl font-bold text-green-600">{estatisticas.municipiosComVisita}</p>
               <p className="text-sm text-gray-500 mt-1">Com visitas realizadas</p>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2">
             <div className="flex justify-between items-center">
               <CardTitle className="text-lg font-semibold text-gray-900">Lojas Visitadas</CardTitle>
               <div className="p-2 rounded-full bg-purple-50 border border-purple-100">
                 <Building2 className="h-5 w-5 text-purple-600" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="mt-2">
               <p className="text-3xl font-bold text-purple-600">{estatisticas.totalLojasVisitadas}</p>
               <p className="text-sm text-gray-500 mt-1">Empresas visitadas</p>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2">
             <div className="flex justify-between items-center">
               <CardTitle className="text-lg font-semibold text-gray-900">Aceites</CardTitle>
               <div className="p-2 rounded-full bg-orange-50 border border-orange-100">
                 <CheckCircle className="h-5 w-5 text-orange-600" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="mt-2">
               <p className="text-3xl font-bold text-orange-600">{estatisticas.totalAceites}</p>
               <p className="text-sm text-gray-500 mt-1">Com interesse</p>
             </div>
           </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300">
           <CardHeader className="pb-2">
             <div className="flex justify-between items-center">
               <CardTitle className="text-lg font-semibold text-gray-900">Contratos Enviados</CardTitle>
               <div className="p-2 rounded-full bg-emerald-50 border border-emerald-100">
                 <FileText className="h-5 w-5 text-emerald-600" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="mt-2">
               <p className="text-3xl font-bold text-emerald-600">{estatisticas.totalContratosEnviados}</p>
               <p className="text-sm text-gray-500 mt-1">Documentos enviados</p>
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Filtros */}
       
      <div className="flex flex-col sm:flex-row gap-4">

      <div className="flex gap-2">
          <Select value={selectedUF} onValueChange={(value) => setSelectedUF(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {ufs.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedUF && selectedUF.trim() !== "" && selectedUF !== "default" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedUF("")}
              className="h-9 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
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
        

      </div>

      {/* Badges de Status de Visitas - Clicáveis */}
      <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'realizadas' ? '' : 'realizadas')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'realizadas'
              ? 'bg-green-600 border-green-600 text-white shadow-lg transform scale-105'
              : 'bg-green-50 border border-green-200 text-green-800 hover:bg-green-100'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            selectedStatusFilter === 'realizadas' ? 'bg-white' : 'bg-green-500'
          }`}></div>
          <span className="text-sm font-medium">
            Municípios Visitados ({municipios.filter(m => m.visitasRealizadas.length > 0).length})
          </span>
        </button>
        
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'agendadas' ? '' : 'agendadas')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'agendadas'
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105'
              : 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            selectedStatusFilter === 'agendadas' ? 'bg-white' : 'bg-blue-500'
          }`}></div>
          <span className="text-sm font-medium">
            Visitas Agendadas ({municipios.filter(m => m.visitasAgendadas.length > 0 && m.visitasRealizadas.length === 0).length})
          </span>
        </button>
        
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'sem-visitas' ? '' : 'sem-visitas')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 hover:shadow-md ${
            selectedStatusFilter === 'sem-visitas'
              ? 'bg-gray-600 border-gray-600 text-white shadow-lg transform scale-105'
              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            selectedStatusFilter === 'sem-visitas' ? 'bg-white' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm font-medium">
            Sem Visitas ({municipios.filter(m => m.visitasRealizadas.length === 0 && m.visitasAgendadas.length === 0).length})
          </span>
        </button>
      </div>

             {/* Indicadores de filtros ativos */}
       {(selectedSupervisor || (selectedUF && selectedUF.trim() !== "" && selectedUF !== "default") || searchTerm || selectedStatusFilter) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex flex-wrap gap-2 items-center">
            {selectedSupervisor && (
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Gerente Comercial: {subordinates.find(s => s.id === selectedSupervisor)?.name || "Gerente Comercial"}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedSupervisor(null)}
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
                         {selectedUF && selectedUF.trim() !== "" && selectedUF !== "default" && (
               <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                 <MapPin className="h-4 w-4 text-blue-600" />
                 <span className="text-sm font-medium text-blue-800">
                   UF: {selectedUF}
                 </span>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setSelectedUF("")}
                   className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-200"
                 >
                   <X className="h-3 w-3" />
                 </Button>
               </div>
             )}
            
            {searchTerm && searchTerm.trim() !== "" && (
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Busca: "{searchTerm}"
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchTerm("")}
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {selectedStatusFilter && (
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Status: {selectedStatusFilter === 'realizadas' ? 'Visitas Realizadas' : 
                          selectedStatusFilter === 'agendadas' ? 'Visitas Agendadas' : 
                          'Sem Visitas'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedStatusFilter("")}
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedSupervisor(null);
                setSelectedUF("");
                setSearchTerm("");
                setSelectedStatusFilter("");
              }}
              className="text-sm text-blue-600 hover:bg-blue-200"
            >
              Limpar todos os filtros
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando municípios...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar municípios</h3>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['municipios-prioritarios'] })}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}


      {/* Lista de Municípios */}
      {!isLoading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
          {municipiosFiltrados.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum município encontrado</h3>
                                 <p className="text-gray-500">
                   {(searchTerm && searchTerm.trim() !== "") || (selectedUF && selectedUF.trim() !== "" && selectedUF !== "default") || selectedSupervisor || selectedStatusFilter
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
                      {/* Só mostrar supervisor se o usuário logado não for supervisor */}
                      {!isSupervisor && municipio.supervisorNome && (
                        <p className="text-xs text-gray-600 truncate">
                          <span className="font-medium"></span> {municipio.supervisorNome}
                        </p>
                      )}
                      <div className="mt-7">
                        {getStatusBadge(municipio)}
                      </div>
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
                      variant="outline"
                      size="sm"
                      onClick={() => handleTratarVisita(municipio)}
                      className="text-xs px-2 py-1 h-7"
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
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                              >
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
                        <div className="space-y-3">
                          {municipio.visitasRealizadas.map((visita) => (
                            <div key={visita.id} className="border rounded-lg bg-gray-50">
                              {/* Header da visita - sempre visível */}
                              <div 
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => toggleVisitaExpansion(visita.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-semibold text-gray-900">
                                    {format(visita.data, "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {visita.cnpjs.length} {visita.cnpjs.length === 1 ? 'empresa' : 'empresas'}
                                  </span>
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto"
                                >
                                  {isVisitaExpanded(visita.id) ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              
                              {/* Conteúdo expandido da visita */}
                              {isVisitaExpanded(visita.id) && (
                                <div className="border-t border-gray-200 p-3">
                                  <div className="space-y-2">
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
                                          
                                          <div className="flex items-center gap-3">

                                            {/* Coluna de ícones com labels */}
                                            <div className="flex gap-4">
                                              {/* Aceite */}
                                              <div className="flex flex-col items-center w-[40px]">
                                                <span className="text-[10px] text-gray-600 mb-1">Aceite</span>
                                                {cnpj.interesse === 'sim' ? (
                                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                  <XCircle className="h-4 w-4 text-red-500" />
                                                )}
                                              </div>

                                              {/* Contrato - só mostra se tiver aceite */}
                                              {cnpj.interesse === 'sim' && (
                                                <div className="flex flex-col items-center w-[40px]">
                                                  <span className="text-[10px] text-gray-600 mb-1">Contrato</span>
                                                  {cnpj.contratoEnviado ? (
                                                    cnpj.contratoEnviado === 'sim' ? (
                                                      <CheckCircle className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                      <XCircle className="h-4 w-4 text-orange-500" />
                                                    )
                                                  ) : (
                                                    <div className="h-4 w-4" /> // Espaço vazio quando não se aplica
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity ml-2"
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
                                                <span className="font-medium text-gray-700">Ramo de Farmácia/Mercado?</span>
                                                <span className="text-gray-600">
                                                  {cnpj.ramo === 'farmacia' ? 'Sim' : 'Não'}
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
      )}

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

              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full max-w-md">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (cnpjsVisitados.length > 1) {
                          setCnpjsVisitados(prev => prev.slice(0, prev.length - 1));
                        }
                      }}
                      disabled={cnpjsVisitados.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </Button>
                    
                    <div className="flex flex-col items-center px-6">
                      <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {cnpjsVisitados.length}
                      </span>
                      <span className="text-sm text-gray-500 font-medium mt-1">
                        {cnpjsVisitados.length === 1 ? 'empresa' : 'empresas'}
                      </span>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={handleAdicionarCNPJ}
                      disabled={cnpjsVisitados.length >= 20}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </Button>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Mín: 1</span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <span>Máx: 20</span>
                    </div>
                  </div>
                </div>
                
                {cnpjsVisitados.length > 0 && (
                  <p className="text-sm text-gray-600 text-center max-w-md">
                    {cnpjsVisitados.length === 1 
                      ? "Você visitou 1 empresa neste município" 
                      : `Você visitou ${cnpjsVisitados.length} empresas neste município`
                    }
                  </p>
                )}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Data da Visita */}
                        <div className="space-y-2">
                          <Label htmlFor={`data-visita-${index}`} className="text-sm text-gray-700">
                            Data da Visita *
                          </Label>
                          <Input
                            id={`data-visita-${index}`}
                            placeholder="DD/MM/YYYY"
                            value={cnpj.dataVisita || ""}
                            onChange={(e) => {
                              const formatted = formatDateOnType(e.target.value);
                              handleCNPJChange(index, 'dataVisita', formatted);
                            }}
                            onKeyPress={(e) => {
                              if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                                e.preventDefault();
                              }
                            }}
                            maxLength={10}
                            className={`transition-all duration-200 ${
                              cnpj.dataVisita && !validateDate(cnpj.dataVisita) ? 'border-red-300 bg-red-50' : ''
                            }`}
                          />
                          {cnpj.dataVisita && !validateDate(cnpj.dataVisita) && (
                            <p className="text-xs text-red-600">Data inválida. Use o formato DD/MM/YYYY</p>
                          )}
                        </div>

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
                          
                          {/* Checkbox para empresa sem CNPJ - posicionado embaixo do campo */}
                          <div className="mt-2">
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
                                className="text-xs text-gray-500 cursor-pointer"
                              >
                                Não obtive o CNPJ durante a visita
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Segunda linha - Ramo e Interesse */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Ramo - aparece sempre */}
                        <div className="space-y-2">
                          <Label htmlFor={`ramo-${index}`} className="text-sm text-gray-700">
                            Ramo de Atividade é Farmácia/Mercado? (Sim / Não)
                          </Label>
                          <Select
                            value={cnpj.ramo}
                            onValueChange={(value: 'farmacia' | 'mercado') => handleCNPJChange(index, 'ramo', value)}
                          >
                            <SelectTrigger className="transition-all duration-200">
                              <SelectValue placeholder="Selecione Sim ou Não..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="farmacia">Sim</SelectItem>
                              <SelectItem value="mercado">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Interesse - aparece sempre */}
                        <div className="space-y-2">
                          <Label htmlFor={`interesse-${index}`} className="text-sm text-gray-700">
                            Houve Interesse? (Sim / Não)
                          </Label>
                          <Select
                            value={cnpj.interesse}
                            onValueChange={(value: 'sim' | 'nao') => handleCNPJChange(index, 'interesse', value)}
                          >
                            <SelectTrigger className="transition-all duration-200">
                              <SelectValue placeholder="Selecione Sim ou Não..." />
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
                                  Motivo do contrato não ser enviado?
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

                      {/* Campo para quando não há interesse */}
                      {cnpj.interesse === 'nao' && (
                        <div className="mt-4">
                          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-gray-700">Por que não houve interesse?</span>
                            </div>
                            <Textarea
                              id={`motivo-interesse-${index}`}
                              placeholder="Descreva o motivo da falta de interesse..."
                              value={cnpj.motivoContrato || ""} // Usando a mesma propriedade conforme solicitado
                              onChange={(e) => handleCNPJChange(index, 'motivoContrato', e.target.value)}
                              className="min-h-[80px] resize-none transition-all duration-200"
                            />
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
              disabled={salvarTratativaMutation.isPending || cnpjsVisitados.length === 0 || cnpjsVisitados.some(cnpj => {
                // Validar data da visita
                if (!cnpj.dataVisita || !validateDate(cnpj.dataVisita)) {
                  return true;
                }
                
                // Validar outros campos
                if (cnpj.semCNPJ) {
                  return !cnpj.nomeLoja;
                } else {
                  return !cnpj.cnpj;
                }
              })}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 transition-all duration-200"
            >
              {salvarTratativaMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Tratativa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeusMunicipiosPage;
