import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, MessageSquare, Filter, Users, ListFilter, PanelsTopLeft, UserPlus, RefreshCw, Search, X, Building2, CheckCircle, XCircle, Calendar as CalendarReagendIcon, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { DateRange } from "react-day-picker";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventApi, userApi, Event } from "@/services/api";
import EventsTable from "@/components/EventsTable";
import { MunicipioAutocomplete } from '@/components/ui/municipio-autocomplete';
import { useSearchParams } from 'react-router-dom';
import { API_CONFIG } from "@/config/api.config";
import { eventCategoryApi, EventCategory } from "@/services/api";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const AgendaPage = () => {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Event | null>(null);
  const [isTeamMemberDialogOpen, setIsTeamMemberDialogOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<{ id: string; name: string } | null>(null);
  const [isParecerDialogOpen, setIsParecerDialogOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [parecerText, setParecerText] = useState("");
  const [isProspeccaoMode, setIsProspeccaoMode] = useState(false);
  const [numCnpjs, setNumCnpjs] = useState<number>(1);
  const [cnpjValues, setCnpjValues] = useState<string[]>([]);
  const [cnpjProspectStatus, setCnpjProspectStatus] = useState<boolean[]>([]);
  const [currentEventType, setCurrentEventType] = useState<string | null>(null);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
  const [teamMemberSearchTerm, setTeamMemberSearchTerm] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState<"start" | "end" | null>(null);
  const [dateError, setDateError] = useState<string>("");
  
  // Estados para o novo fluxo de tratativa
  const [tratativaStep, setTratativaStep] = useState<'pergunta-inicial' | 'tratativa' | 'reagendamento'>('pergunta-inicial');
  const [visitaRealizada, setVisitaRealizada] = useState<boolean | null>(null);
  const [desejaReagendar, setDesejaReagendar] = useState<boolean | null>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState<Date | null>(null);
  const [novaDataFimReagendamento, setNovaDataFimReagendamento] = useState<Date | null>(null);
  const [selectedRangeReagendamento, setSelectedRangeReagendamento] = useState<DateRange | undefined>();
  const [calendarReagendamentoOpen, setCalendarReagendamentoOpen] = useState<"start" | "end" | null>(null);
  const [dateReagendamentoError, setDateReagendamentoError] = useState<string>("");
  
  // Categorias padrão como fallback
  const defaultCategories: EventCategory[] = [
    {
      id: 1,
      name: "Prospecção",
      description: "Atividades de prospecção de novos clientes",
      subcategories: []
    },
    {
      id: 2,
      name: "Visitas Operacionais",
      description: "Visitas operacionais para clientes existentes",
      subcategories: []
    },
    {
      id: 3,
      name: "Visitas de Negociação",
      description: "Visitas para negociação de produtos e serviços",
      subcategories: []
    },
    {
      id: 4,
      name: "Outros",
      description: "Outros tipos de eventos",
      subcategories: []
    }
  ];

  // Estado para categorias
  const [eventCategories, setEventCategories] = useState<EventCategory[]>(defaultCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  
  const [novoEvento, setNovoEvento] = useState<Omit<Event, "id">>({
    titulo: "",
    descricao: "",
    dataInicio: new Date(),
    dataFim: new Date(),
    tipo: "visita",
    location: "",
    subcategory: "",
    other_description: "",
    informar_agencia_pa: false,
    agencia_pa_number: "",
    is_pa: false,
    municipio: "",
    uf: ""
  });

  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user, isManager, isCoordinator, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Estado para controlar quando exibir notificações de erro
  const [errorNotificationShown, setErrorNotificationShown] = useState(false);

  // Query para buscar eventos
  const { data: eventos = [], isLoading, error } = useQuery({
    queryKey: ['events', selectedSupervisor],
    queryFn: async () => {
      try {
        return await eventApi.getEvents(
          undefined, 
          selectedSupervisor || undefined
        );
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: isAdmin ? 1 : 3,
    retryDelay: 5000,
    refetchOnWindowFocus: !isAdmin,
    refetchInterval: isAdmin ? false : 60000,
  });

  // Verificar parâmetros da URL ao carregar a página
  useEffect(() => {
    // Verificar data na URL
    const dataParam = searchParams.get('data');
    if (dataParam) {
      const novaData = new Date(dataParam);
      if (!isNaN(novaData.getTime())) {
        setDate(novaData);
        setSelectedDate(novaData);
      }
    }
    
    // Verificar supervisor na URL
    const supervisorParam = searchParams.get('supervisor');
    if (supervisorParam) {
      setSelectedSupervisor(supervisorParam);
      
      // Verificar se há um filtro de nome para preencher o campo de busca
      const filterParam = searchParams.get('filter');
      if (filterParam) {
        setFilterSearchTerm(decodeURIComponent(filterParam));
      }
    }
    
    // Verificar evento específico na URL
    const eventoParam = searchParams.get('evento');
    if (eventoParam && eventos) {
      // Buscar o evento específico e destacá-lo
      const eventoEncontrado = eventos.find(e => e.id === eventoParam);
      if (eventoEncontrado) {
        // Se encontrou o evento, seleciona a data dele
        const dataEvento = new Date(eventoEncontrado.dataInicio);
        setDate(dataEvento);
        setSelectedDate(dataEvento);
        // Seleciona o evento para possível destaque na UI
        setSelectedEvento(eventoEncontrado);
      }
    }
  }, [searchParams, eventos]);

  // Query para buscar gerentes e coordenadores (apenas para admin)
  const { data: managers = [] } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      if (!isAdmin) return [];
      try {
        const gerentes = await userApi.getUsersByRole("gerente");
        const coordenadores = await userApi.getUsersByRole("coordenador");
        return [...gerentes, ...coordenadores].sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error("Erro ao buscar gerentes/coordenadores:", error);
        return [];
      }
    },
    enabled: !!isAdmin
  });

  // Estado para filtro de gerente/coordenador
  const [selectedManager, setSelectedManager] = useState<string | null>(null);

  // Query modificada para buscar supervisores
  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors', user?.id, selectedManager],
    queryFn: async () => {
      if (isAdmin) {
        try {
          if (selectedManager) {
            // Se um gerente/coordenador está selecionado, buscar apenas seus subordinados supervisores
            const subordinates = await userApi.getSubordinates(selectedManager);
            return subordinates.filter(sub => sub.role === "supervisor");
          } else {
            // Se nenhum gerente está selecionado, buscar todos os supervisores
            return await userApi.getUsersByRole("supervisor");
          }
        } catch (error) {
          console.error("Erro ao buscar supervisores:", error);
          return [];
        }
      } else if ((isManager || isCoordinator) && user?.id) {
        try {
          const allSubordinates = await userApi.getSubordinates(user.id);
          return allSubordinates.filter(subordinate => subordinate.role === "supervisor");
        } catch (error) {
          console.error("Erro ao buscar supervisores:", error);
          return [];
        }
      }
      return [];
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
  });

  // New query to fetch team members (subordinates) for creating events on their behalf
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ['teamMembers', user?.id],
    queryFn: async () => {
      if ((isManager || isCoordinator || isAdmin) && user?.id) {
        try {
          // Para gerentes e coordenadores, buscar supervisores subordinados
          if (isManager || isCoordinator) {
            // Buscar todos os subordinados
            console.log(`Buscando membros da equipe para usuário ${user.id} (${user.role})`);
            const allSubordinates = await userApi.getSubordinates(user.id);
            // Filtrar apenas supervisores
            const supervisors = allSubordinates.filter(subordinate => subordinate.role === "supervisor");
            console.log(`Encontrados ${supervisors.length} supervisores para criar eventos (de ${allSubordinates.length} subordinados)`);
            return supervisors;
          }
          // Para admins, buscar todos os supervisores
          else if (isAdmin) {
            const supervisors = await userApi.getUsersByRole("supervisor");
            console.log(`Admin: Encontrados ${supervisors.length} supervisores para criar eventos`);
            return supervisors;
          }
        } catch (error) {
          console.error("Erro ao buscar membros da equipe:", error);
          toast({
            title: "Aviso",
            description: "Não foi possível carregar a lista completa de membros da equipe",
            variant: "destructive",
          });
        }
      }
      return [];
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
    retry: 3,
    retryDelay: 3000,
  });

  // Exibe mensagem de erro apenas uma vez para usuários
  useEffect(() => {
    if (error && !errorNotificationShown) {
      console.error("Erro ao carregar eventos:", error);
      
      // Mensagem específica para administradores
      if (isAdmin) {
        toast({
          title: "Atenção",
          description: "A visualização de eventos para administradores pode estar indisponível temporariamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao carregar eventos",
          description: "Ocorreu um problema ao buscar a agenda. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
      
      setErrorNotificationShown(true);
    }
  }, [error, isAdmin, errorNotificationShown]);

  const createEventMutation = useMutation({
    mutationFn: eventApi.createEvent,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // Verifica se é um reagendamento (só se o modal de parecer estiver aberto)
      if (isParecerDialogOpen && tratativaStep === 'reagendamento') {
        toast({
          title: "Evento reagendado",
          description: "O evento foi reagendado com sucesso!",
        });
        setIsParecerDialogOpen(false);
        // O reset será feito pelo onOpenChange do Dialog
      } else {
        // Evento novo sendo criado
        toast({
          title: "Evento adicionado",
          description: "O evento foi adicionado à agenda com sucesso!",
        });
        setIsDialogOpen(false);
        resetForm();
      }
    },
    onError: (error: Error) => {
      console.error("Erro ao criar evento:", error);
      let mensagemErro = error.message || "Erro ao adicionar evento";
      
      // Mensagens específicas para erros comuns
      if (mensagemErro.includes("permissão para criar evento")) {
        mensagemErro = "Você não tem permissão para criar eventos para este supervisor. Verifique se ele está na sua equipe.";
      }
      
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive",
      });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string, data: Omit<Event, "id"> }) => 
      eventApi.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso!",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar evento",
        variant: "destructive",
      });
    }
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ eventId, tratativa }: { eventId: string, tratativa: string }) => 
      eventApi.updateEventFeedback(eventId, tratativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // Verifica se é uma marcação de "não realizada" ou parecer normal
      if (tratativaStep === 'reagendamento' && !desejaReagendar) {
        toast({
          title: "Visita registrada",
          description: "A visita foi marcada como não realizada.",
        });
      } else {
        toast({
          title: "Parecer adicionado",
          description: "O parecer foi adicionado ao evento com sucesso!",
        });
      }
      
      setIsParecerDialogOpen(false);
      // O reset será feito pelo onOpenChange do Dialog
    },
    onError: (error: Error) => {
      console.error('Erro no updateFeedbackMutation:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar parecer",
        variant: "destructive",
      });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: eventApi.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento excluído",
        description: "O evento foi removido da agenda com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir evento",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setNovoEvento({
      titulo: "",
      descricao: "",
      dataInicio: new Date(),
      dataFim: new Date(),
      tipo: "visita",
      location: "",
      subcategory: "",
      other_description: "",
      informar_agencia_pa: false,
      agencia_pa_number: "",
      is_pa: false,
      municipio: "",
      uf: ""
    });
    setEditingEvent(null);
    setSelectedRange(undefined);
    setSelectedTeamMember(null);
  };

  // Helper para normalizar UUID
  const normalizeUUID = (uuid: string | undefined | null): string | null => {
    if (!uuid) return null;
    // Remover hífens e converter para maiúsculas para garantir consistência
    return uuid.replace(/-/g, '').toUpperCase();
  };

  const handleSalvarEvento = () => {
    if (!novoEvento.titulo) {
      toast({
        title: "Campo obrigatório",
        description: "O título do evento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!novoEvento.location) {
      toast({
        title: "Campo obrigatório",
        description: "A ocorrência do evento é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar datas
    if (!novoEvento.dataInicio || !novoEvento.dataFim) {
      toast({
        title: "Datas inválidas",
        description: "As datas de início e fim são obrigatórias",
        variant: "destructive",
      });
      return;
    }

    // Validar subcategoria quando necessária
    if (novoEvento.location !== "Outros" && !novoEvento.subcategory) {
      toast({
        title: "Campo obrigatório",
        description: "A subcategoria é obrigatória para esta ocorrência",
        variant: "destructive",
      });
      return;
    }
    
    // Validar campo de descrição para "Outros"
    if (novoEvento.location === "Outros" && !novoEvento.other_description) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição é obrigatória quando a ocorrência é 'Outros'",
        variant: "destructive",
      });
      return;
    }
    
    // Validar campos de Município/UF
    if (!novoEvento.municipio || !novoEvento.uf) {
      toast({
        title: "Campo obrigatório",
        description: "Os campos de Município e UF são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Determine whose behalf we're creating the event for
    let eventSupervisorId = user?.id;  // Default para o próprio usuário
    
    // Se temos um membro da equipe selecionado, usar o ID dele
    if (selectedTeamMember && selectedTeamMember.id) {
      console.log("Usando selectedTeamMember:", selectedTeamMember);
      eventSupervisorId = selectedTeamMember.id;
    } 
    // Se não temos membro da equipe mas temos supervisor selecionado (do filtro)
    else if ((isManager || isCoordinator || isAdmin) && selectedSupervisor) {
      console.log("Usando selectedSupervisor:", selectedSupervisor);
      eventSupervisorId = selectedSupervisor;
    }
    
    if (!eventSupervisorId) {
      toast({
        title: "Erro",
        description: "Não foi possível determinar o supervisor para o evento",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Criando evento com as seguintes informações:");
    console.log("- Usuário atual:", user?.id, user?.name, user?.role);
    console.log("- Supervisor selecionado:", eventSupervisorId);
    console.log("- selectedTeamMember:", selectedTeamMember);
    console.log("- selectedSupervisor:", selectedSupervisor);
    console.log("- ID normalizado:", normalizeUUID(eventSupervisorId));
    
    // Verificar se o supervisor selecionado existe na lista de membros da equipe
    const supervisorExistsInTeam = teamMembers.length > 0 && 
      teamMembers.some(member => 
        normalizeUUID(member.id) === normalizeUUID(eventSupervisorId)
      );
    
    console.log("Supervisor existe na equipe:", supervisorExistsInTeam);
    
    if (!supervisorExistsInTeam && eventSupervisorId !== user?.id && teamMembers.length > 0) {
      console.log("Verificação da equipe:", teamMembers.map(m => m.id));
      
      // Aviso mas ainda permite criar
      toast({
        title: "Aviso",
        description: "O supervisor selecionado não parece estar na sua equipe. Isso pode causar erro de permissão.",
        variant: "destructive",
      });
    }
    
    // Certificar-se de que as datas estão no formato correto
    const dataInicio = novoEvento.dataInicio instanceof Date 
      ? novoEvento.dataInicio 
      : new Date(novoEvento.dataInicio);
    
    const dataFim = novoEvento.dataFim instanceof Date 
      ? novoEvento.dataFim 
      : new Date(novoEvento.dataFim);
    
    const eventData = {
      ...novoEvento,
      dataInicio,
      dataFim,
      supervisorId: eventSupervisorId,
      createdById: user?.id, // Add creator information
      createdByName: user?.name // Add creator name
    };
    
    console.log("Dados do evento a serem enviados:", eventData);
    
    try {
      if (editingEvent) {
        updateEventMutation.mutate({ 
          eventId: editingEvent, 
          data: eventData 
        });
      } else {
        createEventMutation.mutate(eventData);
      }
    } catch (error) {
      console.error("Erro ao tentar criar/atualizar evento:", error);
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para resetar o estado da tratativa (mantém isProspeccaoMode e currentEventId durante o fluxo)
  const resetTratativaState = () => {
    setTratativaStep('pergunta-inicial');
    setVisitaRealizada(null);
    setDesejaReagendar(null);
    setNovaDataReagendamento(null);
    setNovaDataFimReagendamento(null);
    setSelectedRangeReagendamento(undefined);
    setCalendarReagendamentoOpen(null);
    setDateReagendamentoError("");
    setParecerText("");
    // NÃO resetar currentEventId, currentEventType e isProspeccaoMode durante o fluxo
    // setCurrentEventId(null);
    // setCurrentEventType(null);
    // setIsProspeccaoMode(false);
    resetProspeccaoState();
  };

  const handleAbrirParecerDialog = (id: string) => {
    const evento = eventos.find(evento => evento.id === id);
    if (evento) {

      setCurrentEventId(id);
      setCurrentEventType(evento.location || null);
      setSelectedEvento(evento);
      
      // Verifica se é um evento de prospecção
      const isProspecao = evento.location === "Prospecção";
      setIsProspeccaoMode(isProspecao);
      
      // Reset do estado
      resetTratativaState();
      
      // Se já existe tratativa, vai direto para a edição
      if (evento.tratativa && evento.tratativa.trim() !== '') {

        setTratativaStep('tratativa');
        setVisitaRealizada(true); // Marca como realizada já que tem tratativa
        
        // Carrega os dados existentes
        if (isProspecao) {
          loadTratativasProspecao(id);
        } else {
          setParecerText(evento.tratativa);
        }
      } else {

        setTratativaStep('pergunta-inicial');
      }
      
      setIsParecerDialogOpen(true);

    }
  };

  // Função para lidar com a resposta da pergunta inicial
  const handleVisitaRealizadaResponse = (realizada: boolean) => {

    setVisitaRealizada(realizada);
    
    if (realizada) {
      // Se a visita foi realizada, vai para a etapa de tratativa
      setTratativaStep('tratativa');
      
      // Se for evento de prospecção, carrega os dados específicos
      if (isProspeccaoMode && currentEventId) {
        loadTratativasProspecao(currentEventId);
      } else if (selectedEvento) {
        // Para eventos normais, carrega o parecer existente
        setParecerText(selectedEvento.tratativa || "");
      }
    } else {
      // Se a visita não foi realizada, pergunta se deseja reagendar
      
      setTratativaStep('reagendamento');
    }
  };

  // Função para lidar com a resposta do reagendamento
  const handleReagendamentoResponse = (reagendar: boolean) => {
    setDesejaReagendar(reagendar);
    
    if (!reagendar) {
      // Se não quer reagendar, apenas marca como não realizada

      handleSalvarTratativaSemReagendamento();
    }
    // Se quer reagendar, o usuário continua na mesma etapa para selecionar a data
  };

  // Função para salvar tratativa sem reagendamento
  const handleSalvarTratativaSemReagendamento = () => {
    // Usar currentEventId primeiro, selectedEvento.id como fallback
    const eventoId = currentEventId || selectedEvento?.id;
    
    if (!eventoId) {
      console.error('Erro: Nenhum ID de evento disponível', { currentEventId, selectedEventoId: selectedEvento?.id });
      toast({
        title: "Erro",
        description: "Não foi possível identificar o evento. Tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    const tratativaNaoRealizada = "Visita não realizada.";

    
    updateFeedbackMutation.mutate({ 
      eventId: eventoId, 
      tratativa: tratativaNaoRealizada 
    });
  };

  // Função para reagendar evento
  const handleReagendarEvento = () => {
    if (!currentEventId || !selectedEvento || !novaDataReagendamento || !novaDataFimReagendamento) {
      toast({
        title: "Erro",
        description: "Por favor, selecione a nova data para reagendamento.",
        variant: "destructive",
      });
      return;
    }

    // Dados do novo evento (cópia do evento atual)
    const novoEventoData = {
      titulo: selectedEvento.titulo,
      descricao: selectedEvento.descricao,
      dataInicio: novaDataReagendamento,
      dataFim: novaDataFimReagendamento,
      tipo: selectedEvento.tipo,
      location: selectedEvento.location || "",
      subcategory: selectedEvento.subcategory || "",
      other_description: selectedEvento.other_description || "",
      informar_agencia_pa: selectedEvento.informar_agencia_pa || false,
      agencia_pa_number: selectedEvento.agencia_pa_number || "",
      is_pa: selectedEvento.is_pa || false,
      municipio: selectedEvento.municipio || "",
      uf: selectedEvento.uf || "",
      supervisorId: selectedEvento.supervisorId,
      createdById: user?.id,
      createdByName: user?.name
    };

    // Cria o novo evento
    createEventMutation.mutate(novoEventoData);

    // Marca o evento atual como reagendado
    const tratativaReagendada = `Reagendada para ${format(novaDataReagendamento, "dd/MM/yyyy", { locale: ptBR })}`;
    updateFeedbackMutation.mutate({ 
      eventId: currentEventId, 
      tratativa: tratativaReagendada 
    });
  };

  // Função para lidar com seleção de data do reagendamento
  const handleReagendamentoDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const selectedDate = new Date(date);

    if (calendarReagendamentoOpen === "start") {
      if (novaDataFimReagendamento && selectedDate > novaDataFimReagendamento) {
        setDateReagendamentoError("A data final deve ser igual ou posterior à data inicial");
        return;
      }
      setNovaDataReagendamento(selectedDate);
      setDateReagendamentoError("");
    } else if (calendarReagendamentoOpen === "end") {
      if (novaDataReagendamento && selectedDate < novaDataReagendamento) {
        setDateReagendamentoError("A data final não pode ser anterior à data inicial");
        return;
      }
      setNovaDataFimReagendamento(selectedDate);
      setDateReagendamentoError("");
    }
    setCalendarReagendamentoOpen(null);
  };

  // Função auxiliar para resetar o estado da prospecção
  const resetProspeccaoState = () => {
    setCnpjValues([]);
    setCnpjProspectStatus([]);
    setNumCnpjs(1);
  };

  // Formatar CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
  const formatCnpj = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numericValue.length <= 14) {
      return numericValue
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18); // Limita ao tamanho máximo de um CNPJ formatado
    }
    
    return numericValue.substring(0, 14); // Limita a 14 dígitos se exceder
  };
  
  // Limpar CNPJ (manter apenas números)
  const cleanCnpj = (value: string) => {
    return value.replace(/\D/g, '');
  };
  
  // Validar CNPJ
  const isValidCnpj = (cnpj: string) => {
    const cleaned = cleanCnpj(cnpj);
    return cleaned.length === 14;
  };
  
  const handleCnpjChange = (index: number, value: string) => {
    const formatted = formatCnpj(value);
    const newCnpjValues = [...cnpjValues];
    newCnpjValues[index] = formatted;
    setCnpjValues(newCnpjValues);
  };

  const handleProspectStatusChange = (index: number) => {
    const newStatus = [...cnpjProspectStatus];
    newStatus[index] = !newStatus[index];
    setCnpjProspectStatus(newStatus);
  };
  
  // Salvamento de parecer + CNPJs de prospecção na API
  const savePropectVisitaMutation = useMutation({
    mutationFn: async ({ eventoId, supervisorId, observacao, cnpjs, prospectStatus }: { 
      eventoId: string, 
      supervisorId?: string, 
      observacao: string, 
      cnpjs: string[],
      prospectStatus: boolean[]
    }) => {
      console.log(`Salvando tratativas de prospecção na nova tabela`);
      const response = await fetch(`${API_CONFIG.apiUrl}/tratativas-prospecao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventoId,
          userId: user?.id,
          userName: user?.name,
          cnpjs: cnpjs.map((cnpj, index) => ({
            cnpj,
            tratado: prospectStatus[index],
            descricao: observacao
          })),
          dtAgenda: new Date(),
          dtTratativa: new Date()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar prospecção');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Prospecção registrada",
        description: "Os CNPJs visitados foram registrados com sucesso!",
      });
      setIsParecerDialogOpen(false);
      // O reset será feito pelo onOpenChange do Dialog
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar visitas de prospecção",
        variant: "destructive",
      });
    }
  });
  
  const handleSalvarParecer = () => {
    if (!currentEventId) return;
    
    // Se for prospecção, salva no sistema de CNPJs
    if (isProspeccaoMode && currentEventType === "Prospecção") {
      // Filtra CNPJs vazios
      const validCnpjs = cnpjValues.filter(cnpj => cleanCnpj(cnpj).length > 0);
      
      if (validCnpjs.length > 0) {
        // Busca o evento atual para obter o supervisorId
        const currentEvent = eventos.find(ev => ev.id === currentEventId);
        const supervisorId = currentEvent?.supervisorId;
        
        // Filtra os status correspondentes aos CNPJs válidos
        const validStatus = cnpjProspectStatus.filter((_, index) => 
          cleanCnpj(cnpjValues[index]).length > 0
        );
        
        // Chama a API para salvar os CNPJs e a observação na nova tabela
        savePropectVisitaMutation.mutate({
          eventoId: currentEventId,
          supervisorId,
          observacao: parecerText,
          cnpjs: validCnpjs,
          prospectStatus: validStatus
        });
        
        // Formata texto com os CNPJs para exibição na UI
        const cnpjListText = validCnpjs.map((cnpj, index) => 
          `${cnpj} (${validStatus[index] ? 'Prospectado' : 'Não Prospectado'})`
        ).join(', ');
        const tratativaFinal = `Empresas visitadas: ${cnpjListText}\n\n${parecerText}`;
        
        // Salva também no campo de tratativa do evento para manter compatibilidade visual
        updateFeedbackMutation.mutate({ 
          eventId: currentEventId, 
          tratativa: tratativaFinal 
        });
      } else {
        // Mesmo sem CNPJs, ainda salva o parecer no evento
        updateFeedbackMutation.mutate({ 
          eventId: currentEventId, 
          tratativa: parecerText 
        });
      }
    } else {
      // Para eventos não relacionados a prospecção, salva normalmente
      updateFeedbackMutation.mutate({ 
        eventId: currentEventId, 
        tratativa: parecerText 
      });
    }
  };

  const handleEditarEvento = (id: string) => {
    const evento = eventos.find(evento => evento.id === id);
    if (evento) {
      setNovoEvento({
        titulo: evento.titulo,
        descricao: evento.descricao,
        dataInicio: new Date(evento.dataInicio),
        dataFim: new Date(evento.dataFim),
        tipo: evento.tipo,
        tratativa: evento.tratativa,
        location: evento.location || "",
        subcategory: evento.subcategory || "",
        other_description: evento.other_description || "",
        informar_agencia_pa: evento.informar_agencia_pa || false,
        agencia_pa_number: evento.agencia_pa_number || "",
        is_pa: evento.is_pa || false,
        municipio: evento.municipio || "",
        uf: evento.uf || ""
      });
      setEditingEvent(id);
      
      setSelectedRange({
        from: new Date(evento.dataInicio),
        to: new Date(evento.dataFim),
      });
      
      setIsDialogOpen(true);
    }
  };

  const handleExcluirEvento = (id: string) => {
    deleteEventMutation.mutate(id);
  };

  const formatDateRange = (inicio: Date, fim: Date) => {
    if (format(inicio, "yyyy-MM-dd") === format(fim, "yyyy-MM-dd")) {
      return format(inicio, "dd 'de' MMMM", { locale: ptBR });
    }
    
    return `${format(inicio, "dd/MM", { locale: ptBR })} - ${format(fim, "dd/MM", { locale: ptBR })}`;
  };

  const eventosFiltrados = eventos.filter(evento => {
    const currentDate = format(date, "yyyy-MM-dd");
    const startDate = format(evento.dataInicio instanceof Date 
      ? evento.dataInicio 
      : new Date(evento.dataInicio), "yyyy-MM-dd");
    const endDate = format(evento.dataFim instanceof Date 
      ? evento.dataFim 
      : new Date(evento.dataFim), "yyyy-MM-dd");
    
    const eventDate = new Date(currentDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Filtro por supervisor
    const matchesSupervisor = !selectedSupervisor || evento.supervisorId === selectedSupervisor;
    
    // Filtro por categoria de evento (dinâmico)
    let matchesFilter = true;
    if (selectedFilter) {
      // Usar categorias padrão se eventCategories não estiver disponível
      const categoriesToUse = eventCategories || [
        { id: 1, name: "Prospecção", description: "", subcategories: [] },
        { id: 2, name: "Visitas Operacionais", description: "", subcategories: [] },
        { id: 3, name: "Visitas de Negociação", description: "", subcategories: [] },
        { id: 4, name: "Outros", description: "", subcategories: [] }
      ];
      
      const selectedCategory = categoriesToUse.find(category => 
        category.name.toLowerCase() === selectedFilter
      );
      
      if (selectedCategory) {
        matchesFilter = evento.location === selectedCategory.name;
      }
    }
    
    return eventDate >= start && eventDate <= end && matchesSupervisor && matchesFilter;
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const selectedDate = new Date(date);

    if (calendarOpen === "start") {
      if (novoEvento.dataFim && selectedDate > new Date(novoEvento.dataFim)) {
        setDateError("A data final deve ser igual ou posterior à data inicial");
        return;
      }
      setNovoEvento(prev => ({
        ...prev,
        dataInicio: selectedDate
      }));
      setDateError("");
    } else if (calendarOpen === "end") {
      if (novoEvento.dataInicio && selectedDate < new Date(novoEvento.dataInicio)) {
        setDateError("A data final não pode ser anterior à data inicial");
        return;
      }
      setNovoEvento(prev => ({
        ...prev,
        dataFim: selectedDate
      }));
      setDateError("");
    }
    setCalendarOpen(null);
  };

  const handleFilterChange = (value: string) => {
    try {
      console.log('[Agenda] Alterando filtro para:', value);
      console.log('[Agenda] Categorias disponíveis:', eventCategories?.map(c => c.name));
      
      if (value === "all") {
        setSelectedFilter(null);
        console.log('[Agenda] Filtro removido');
      } else {
        setSelectedFilter(value);
        console.log('[Agenda] Filtro definido para:', value);
      }
    } catch (error) {
      console.error('[Agenda] Erro ao alterar filtro:', error);
      setSelectedFilter(null);
    }
  };

  const hasEvents = (date: Date) => {
    return eventos.some(evento => {
      const startDate = new Date(evento.dataInicio);
      const endDate = new Date(evento.dataFim);
      const currentDate = new Date(date);
      
      // Remove a parte de hora para comparar apenas as datas
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Verifica se o evento está dentro do intervalo de datas
      const isDateInRange = currentDate >= startDate && currentDate <= endDate;
      
      // Se houver um supervisor selecionado, verifica se o evento pertence a ele
      if (selectedSupervisor) {
        return isDateInRange && evento.supervisorId === selectedSupervisor;
      }
      
      // Se não houver supervisor selecionado, retorna true para qualquer evento no intervalo
      return isDateInRange;
    });
  };

  // Função para verificar se existe evento pendente de tratativa na data
  const hasPendingEvents = (date: Date) => {
    return eventos.some(evento => {
      const startDate = new Date(evento.dataInicio);
      const endDate = new Date(evento.dataFim);
      const currentDate = new Date(date);
      
      // Remove a parte de hora para comparar apenas as datas
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Verifica se o evento está dentro do intervalo de datas
      const isDateInRange = currentDate >= startDate && currentDate <= endDate;
      
      // Verifica se o evento não tem tratativa (pendente)
      const isPending = !evento.tratativa || evento.tratativa.trim() === '';
      
      // Se houver um supervisor selecionado, verifica se o evento pertence a ele
      if (selectedSupervisor) {
        return isDateInRange && evento.supervisorId === selectedSupervisor && isPending;
      }
      
      // Se não houver supervisor selecionado, retorna true para qualquer evento pendente no intervalo
      return isDateInRange && isPending;
    });
  };

  const renderDayContent = (date: Date) => {
    const day = date.getDate();
    const hasEvent = hasEvents(date);
    const hasPending = hasPendingEvents(date);
    const isSelected = selectedDate && 
      date.getDate() === selectedDate.getDate() && 
      date.getMonth() === selectedDate.getMonth() && 
      date.getFullYear() === selectedDate.getFullYear();
    
    return (
      <div className="relative flex flex-col items-center gap-1">
        <span>{day}</span>
        {hasEvent && (
          <div className={`w-1 h-1 rounded-full ${
            isSelected ? 'bg-white' : 
            hasPending ? 'bg-red-800' : 'bg-bradesco-blue'
          }`}></div>
        )}
      </div>
    );
  };

  const modifiers = {
    hasEvents: (date: Date) => hasEvents(date),
  };

  const modifiersStyles = {
    hasEvents: {
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#2563eb', // Cor azul do Bradesco
      },
    },
  };

  const calendarLabels = {
    months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    previous: "Mês anterior",
    today: "Hoje"
  };

  const loadTratativasProspecao = async (id: string) => {
    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/tratativas-prospecao/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const tratativas = data.data;
        const cnpjs = tratativas.map(t => formatCnpj(t.CNPJ));
        const status = tratativas.map(t => t.TRATADO === 1);
        
        setCnpjValues(cnpjs);
        setCnpjProspectStatus(status);
        setNumCnpjs(cnpjs.length);
        
        if (tratativas[0]?.DESCRICAO) {
          setParecerText(tratativas[0].DESCRICAO);
        }
      } else {
        const eventoAtual = eventos.find(e => e.id === id);
        if (eventoAtual) {
          handleLegacyTratativa(eventoAtual);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados de prospecção:", error);
      const eventoAtual = eventos.find(e => e.id === id);
      if (eventoAtual) {
        handleLegacyTratativa(eventoAtual);
      }
    }
  };

  const handleLegacyTratativa = (eventoAtual: Event) => {
    if (eventoAtual.tratativa) {
      const cnpjMatch = eventoAtual.tratativa.match(/Empresas visitadas:\s*([\d\.,\s\/\-]+)/i);
      if (cnpjMatch && cnpjMatch[1]) {
        const cnpjList = cnpjMatch[1].split(',').map(cnpj => cnpj.trim());
        setCnpjValues(cnpjList);
        setCnpjProspectStatus(cnpjList.map(() => false));
        setNumCnpjs(cnpjList.length);
        
        const cleanedText = eventoAtual.tratativa.replace(/Empresas visitadas:[\d\.,\s\/\-]+\n\n/i, '');
        setParecerText(cleanedText);
      } else {
        resetProspeccaoState();
        setParecerText(eventoAtual.tratativa || "");
      }
    } else {
      resetProspeccaoState();
      setParecerText("");
    }
  };

  const handleParecerClick = (eventoAtual: Event) => {
    setSelectedEvento(eventoAtual);
    const isProspecao = eventoAtual.location === 'Prospecção';
    
    if (isProspecao) {
      loadTratativasProspecao(eventoAtual.id);
    } else {
      resetProspeccaoState();
      setParecerText(eventoAtual.tratativa || "");
    }
    
    setIsParecerDialogOpen(true);
  };

  const handleTratativaSubmit = async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/tratativas-prospecao`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          eventoId: id,
          userId: user?.id,
          userName: user?.name
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar tratativa');
      }
      
      // Atualiza a lista de eventos
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      toast({
        title: "Sucesso",
        description: "Tratativa salva com sucesso",
      });
      
      setIsParecerDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar tratativa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tratativa",
        variant: "destructive",
      });
    }
  };



  // Função para carregar categorias
  const loadCategories = async () => {
    if (!user?.id) return;
    
    setIsLoadingCategories(true);
    setCategoriesError(null);
    
    try {
      //console.log('[Agenda] Iniciando busca de categorias da API...');
      const categories = await eventCategoryApi.getCategories();
      //console.log('[Agenda]  sucesso:', categories);
      setEventCategories(categories);
      setErrorNotificationShown(false);
    } catch (error) {
      //console.error('[Agenda] Erro ao buscar categorias da API, usando categorias padrão:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setCategoriesError(errorMessage);
      
      // Usar categorias padrão como fallback
      setEventCategories(defaultCategories);
      //console.log('[Agenda] Usando categorias padrão como fallback');
      
      // Não mostrar toast de erro, apenas log
      //console.warn('[Agenda] API de categorias indisponível, usando dados padrão');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Carregar categorias ao montar o componente
  useEffect(() => {
    loadCategories();
  }, [user?.id]);

  // Função auxiliar para obter subcategorias de uma categoria
  const getSubcategories = (categoryName: string) => {
    const category = eventCategories.find(c => c.name === categoryName);
    return category?.subcategories || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agenda de Atividades</h1>
        
        <div className="flex space-x-2">
          {(isManager || isCoordinator) && (
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar por Usuário</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filtrar por Usuário</DialogTitle>
                  <DialogDescription>
                    Selecione um usuário para visualizar sua agenda
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input 
                      placeholder="Buscar usuário..." 
                      value={filterSearchTerm}
                      onChange={(e) => setFilterSearchTerm(e.target.value.toLowerCase())}
                      className="pl-9"
                    />
                    {filterSearchTerm && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setFilterSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        !selectedSupervisor ? 'bg-bradesco-blue text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedSupervisor(null);
                        setIsFilterDialogOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <p className="font-medium">Todos os usuários</p>
                      </div>
                    </div>
                    
                    {supervisors
                      .filter(supervisor => 
                        filterSearchTerm === "" || 
                        supervisor.name.toLowerCase().includes(filterSearchTerm)
                      )
                      .map((supervisor) => (
                                              <div 
                        key={supervisor.id} 
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedSupervisor === supervisor.id ? 'bg-bradesco-blue text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setSelectedSupervisor(supervisor.id);
                          setIsFilterDialogOpen(false);
                        }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{supervisor.name}</p>
                              <p className="text-xs opacity-70">{supervisor.role.charAt(0).toUpperCase() + supervisor.role.slice(1)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filterSearchTerm && !supervisors.some(supervisor => 
                        supervisor.name.toLowerCase().includes(filterSearchTerm)
                      ) && (
                        <div className="text-center py-4 text-gray-500">
                          Nenhum usuário encontrado com esse nome.
                        </div>
                      )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>
                      Fechar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {(isManager || isCoordinator || isAdmin) ? (
            <Dialog open={isTeamMemberDialogOpen} onOpenChange={(open) => {
              setIsTeamMemberDialogOpen(open);
              if (!open) {
                setTeamMemberSearchTerm("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-bradesco-blue">
                  <UserPlus className="h-4 w-4 mr-2" /> Agendar para Equipe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Selecionar membro da equipe</DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input 
                      placeholder="Buscar membro da equipe..." 
                      value={teamMemberSearchTerm}
                      onChange={(e) => setTeamMemberSearchTerm(e.target.value.toLowerCase())}
                      className="pl-9"
                    />
                    {teamMemberSearchTerm && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setTeamMemberSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {isLoadingTeamMembers ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin h-6 w-6 border-2 border-bradesco-blue border-t-transparent rounded-full"></div>
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="space-y-3">
                        <div className="text-center py-4 text-gray-500">
                          Nenhum membro encontrado na sua equipe.
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Tentar novamente
                        </Button>
                      </div>
                    ) : (
                      teamMembers
                        .filter(member => 
                          teamMemberSearchTerm === "" || 
                          member.name.toLowerCase().includes(teamMemberSearchTerm)
                        )
                        .map((member) => (
                          <div 
                            key={member.id} 
                            className="p-3 border rounded-md cursor-pointer transition-colors hover:bg-gray-100"
                            onClick={() => {
                              setSelectedTeamMember({ id: member.id, name: member.name });
                              setIsTeamMemberDialogOpen(false);
                              setTeamMemberSearchTerm("");
                              setIsDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm opacity-70">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                    
                    {teamMemberSearchTerm && !teamMembers.some(member => 
                      member.name.toLowerCase().includes(teamMemberSearchTerm)
                    ) && (
                      <div className="text-center py-4 text-gray-500">
                        Nenhum membro encontrado com esse nome.
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsTeamMemberDialogOpen(false);
                    setTeamMemberSearchTerm("");
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-bradesco-blue"
                    onClick={() => {
                      setSelectedTeamMember(null);
                      setIsTeamMemberDialogOpen(false);
                      setTeamMemberSearchTerm("");
                      setIsDialogOpen(true);
                    }}
                  >
                    Criar para mim mesmo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-bradesco-blue">
                  <Plus className="h-4 w-4 mr-2" /> Novo Evento
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar evento" : (
                    selectedTeamMember 
                      ? `Adicionar evento para ${selectedTeamMember.name}` 
                      : "Adicionar novo evento"
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm">Título</label>
                  <Input
                    className="col-span-3"
                    value={novoEvento.titulo}
                    onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm">Intervalo de Datas</label>
                  <div className="col-span-3 flex flex-col space-y-2">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={novoEvento.dataInicio ? format(novoEvento.dataInicio instanceof Date 
                            ? novoEvento.dataInicio 
                            : new Date(novoEvento.dataInicio), "dd/MM/yyyy") : ""}
                          onClick={() => setCalendarOpen("start")}
                          readOnly
                          placeholder="Data inicial"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={novoEvento.dataFim ? format(novoEvento.dataFim instanceof Date 
                            ? novoEvento.dataFim 
                            : new Date(novoEvento.dataFim), "dd/MM/yyyy") : ""}
                          onClick={() => setCalendarOpen("end")}
                          readOnly
                          placeholder="Data final"
                        />
                      </div>
                    </div>
                    {dateError && (
                      <p className="text-sm text-red-500">{dateError}</p>
                    )}
                  </div>
                </div>
                
                {calendarOpen && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <div className="col-span-1"></div>
                    <div className="col-span-3 bg-white border rounded-md shadow-md p-2">
                      <Calendar
                        mode="range"
                        selected={selectedRange}
                        onSelect={(range) => {
                          setSelectedRange(range);
                          if (range?.from) {
                            setNovoEvento({ 
                              ...novoEvento, 
                              dataInicio: range.from,
                              dataFim: range.to || range.from
                            });
                          }
                          if (range?.from && range?.to) {
                            setCalendarOpen(null);
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="location">Ocorrência</Label>
                  <Select
                    value={novoEvento.location}
                    onValueChange={(value) =>
                      setNovoEvento({ ...novoEvento, location: value, subcategory: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Ocorrência" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <div className="px-4 py-2 text-center text-gray-500">
                          Carregando categorias...
                        </div>
                      ) : (
                        eventCategories.map(category => (
                          <SelectItem 
                            key={category.id} 
                            value={category.name}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200"
                          >
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {novoEvento.location !== "Outros" && novoEvento.location && (
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategoria</Label>
                    <Select
                      value={novoEvento.subcategory}
                      onValueChange={(value) =>
                        setNovoEvento({ ...novoEvento, subcategory: value })
                      }
                      disabled={!novoEvento.location || novoEvento.location === "Outros"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a Subcategoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubcategories(novoEvento.location).map(subcategory => (
                          <SelectItem 
                            key={subcategory.id} 
                            value={subcategory.name}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200"
                          >
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {novoEvento.location === "Outros" && (
                  <div className="space-y-2">
                    <Label htmlFor="other_description">Descreva o Evento</Label>
                    <Input
                      id="other_description"
                      value={novoEvento.other_description}
                      onChange={(e) =>
                        setNovoEvento({ ...novoEvento, other_description: e.target.value })
                      }
                      placeholder="Descreva a ocorrência"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="informar_agencia_pa"
                      checked={novoEvento.informar_agencia_pa || false}
                      onChange={(e) =>
                        setNovoEvento({ ...novoEvento, informar_agencia_pa: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="informar_agencia_pa" className="text-sm text-gray-700">
                      Desejo informar a Agência/PA que irei visitar
                    </Label>
                  </div>
                </div>

                {novoEvento.informar_agencia_pa && (
                  <div className="space-y-2">
                    <Label htmlFor="agencia_pa_number">Código da {novoEvento.is_pa ? 'PA' : 'Agência'}</Label>
                    <div className="flex gap-3">
                      <ToggleGroup 
                        type="single" 
                        className="bg-slate-100 rounded-lg h-10"
                        value={novoEvento.is_pa ? "pa" : "ag"}
                        onValueChange={(value) => 
                          setNovoEvento({ ...novoEvento, is_pa: value === "pa" })
                        }
                      >
                        <ToggleGroupItem 
                          value="ag" 
                          className="text-xs font-medium px-3 h-8 data-[state=on]:bg-bradesco-blue data-[state=on]:text-white transition-colors"
                        >
                          AG
                        </ToggleGroupItem>
                        <ToggleGroupItem 
                          value="pa" 
                          className="text-xs font-medium px-3 h-8 data-[state=on]:bg-bradesco-blue data-[state=on]:text-white transition-colors"
                        >
                          PA
                        </ToggleGroupItem>
                      </ToggleGroup>

                      <Input
                        id="agencia_pa_number"
                        type="text"
                        value={novoEvento.agencia_pa_number || ""}
                        onChange={(e) =>
                          setNovoEvento({ ...novoEvento, agencia_pa_number: e.target.value })
                        }
                        placeholder="Ex: 1234"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="municipio" className="block text-sm font-medium text-gray-700">
                        Município/UF
                      </Label>
                      <MunicipioAutocomplete
                        value={{ municipio: novoEvento.municipio || "", uf: novoEvento.uf || "" }}
                        onChange={({ municipio, uf }) => {
                          setNovoEvento(prev => ({
                            ...prev,
                            municipio,
                            uf
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingEvent(null);
                  setCalendarOpen(null);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarEvento} className="bg-bradesco-blue">
                  {editingEvent ? "Atualizar Evento" : "Criar Evento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedSupervisor && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-bradesco-blue" />
            <span className="font-medium">
              Visualizando agenda de {
                supervisors.find(s => s.id === selectedSupervisor)?.name || "Usuário"
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

      <Tabs defaultValue="calendar" onValueChange={(value) => setViewMode(value as "calendar" | "table")}>
        <TabsList className="mb-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Tabela
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Calendário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-2 bg-white shadow-sm">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setSelectedDate(newDate);
                      }
                    }}
                    className="w-full max-w-[100%] overflow-hidden"
                    components={{
                      DayContent: ({ date }) => renderDayContent(date)
                    }}
                    locale={ptBR}
                    classNames={{
                      months: "w-full flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "w-full",
                      caption: "flex justify-center pt-1 relative items-center w-full",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex w-full mt-2",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                      row: "flex w-full mt-2",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md h-9 w-9 flex-1 flex items-center justify-center",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground flex items-center justify-center",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
                
                {(isManager || isCoordinator || isAdmin) && supervisors.length > 0 && (
                  <div className="mt-6">
                    {isAdmin && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Users className="h-4 w-4" /> 
                          Filtrar por Gerência/Coordenação
                        </h3>
                        <Select
                          value={selectedManager || ""}
                          onValueChange={(value) => setSelectedManager(value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os Supervisores" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os Supervisores</SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name} ({manager.role === "gerente" ? "Gerente" : "Coordenador"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4" /> 
                      {isAdmin ? "Supervisores" : "Usuários"}
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      <div 
                        className={`p-2 text-sm rounded-md cursor-pointer transition-colors ${
                          !selectedSupervisor ? 'bg-bradesco-blue text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSupervisor(null)}
                      >
                        Todos os usuários
                      </div>
                      
                      {supervisors.map((supervisor) => (
                        <div 
                          key={supervisor.id} 
                          className={`p-2 text-sm rounded-md cursor-pointer transition-colors ${
                            selectedSupervisor === supervisor.id ? 'bg-bradesco-blue text-white' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSupervisor(supervisor.id)}
                        >
                          {supervisor.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Eventos de {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {selectedFilter && (
                    <span className="ml-2 text-sm font-normal text-bradesco-blue">
                      • Filtrado por: {eventCategories?.find(c => c.name.toLowerCase() === selectedFilter)?.name || selectedFilter}
                    </span>
                  )}
                </CardTitle>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      <span>Filtros</span>
                      {selectedFilter && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-bradesco-blue"></span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleFilterChange("all")}>
                      Todas as categorias
                    </DropdownMenuItem>
                    {isLoadingCategories ? (
                      <DropdownMenuItem disabled>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 animate-spin border border-gray-300 border-t-bradesco-blue rounded-full"></div>
                          Carregando categorias...
                        </div>
                      </DropdownMenuItem>
                    ) : eventCategories && eventCategories.length > 0 ? (
                      eventCategories.map((category) => (
                        <DropdownMenuItem 
                          key={category.id}
                          className="cursor-pointer" 
                          onClick={() => handleFilterChange(category.name.toLowerCase())}
                        >
                          {category.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        <div className="text-gray-500">
                          Nenhuma categoria disponível
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="py-8 text-center text-gray-500">
                    Carregando eventos...
                  </div>
                )}
                
                {error && (
                  <div className="py-8 text-center text-red-500">
                    Erro ao carregar eventos: {error instanceof Error ? error.message : "Erro desconhecido"}
                  </div>
                )}
                
                {!isLoading && !error && eventosFiltrados.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {selectedFilter ? (
                      <>
                        Nenhum evento da categoria "{eventCategories?.find(c => c.name.toLowerCase() === selectedFilter)?.name || selectedFilter}" 
                        {selectedSupervisor && ` para ${supervisors.find(s => s.id === selectedSupervisor)?.name || "este usuário"}`} 
                        {" "}nesta data.
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedFilter(null)}
                            className="text-bradesco-blue border-bradesco-blue hover:bg-bradesco-blue hover:text-white"
                          >
                            Limpar filtro de categoria
                          </Button>
                        </div>
                      </>
                    ) : selectedSupervisor ? (
                      `Nenhum evento agendado para ${supervisors.find(s => s.id === selectedSupervisor)?.name || "este usuário"} nesta data.`
                    ) : (
                      "Nenhum evento agendado para esta data."
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventosFiltrados.map((evento) => (
                      <div
                        key={evento.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-grow">
                            <h3 className="font-medium">{evento.titulo}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <span>{formatDateRange(
                                evento.dataInicio instanceof Date ? evento.dataInicio : new Date(evento.dataInicio),
                                evento.dataFim instanceof Date ? evento.dataFim : new Date(evento.dataFim)
                              )}</span>
                              {evento.location && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{evento.location}</span>
                                </>
                              )}
                              {evento.subcategory && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{evento.subcategory}</span>
                                </>
                              )}
                            </div>
                            {evento.municipio && evento.uf && (
                              <div className="mt-1 text-sm text-gray-500">
                                {evento.municipio}, {evento.uf}
                                {evento.informar_agencia_pa && evento.agencia_pa_number && (
                                  <span> • {evento.is_pa ? "PA" : "Agência"} {evento.agencia_pa_number}</span>
                                )}
                              </div>
                            )}
                            
                            {(isManager || isCoordinator || isAdmin) && evento.supervisorName && (
                              <div className="mt-1 text-xs font-medium text-bradesco-blue flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {evento.supervisorName}
                              </div>
                            )}
                            
                            {/* Show creator information if event was created on behalf of someone */}
                            {evento.createdById && evento.createdById !== evento.supervisorId && evento.createdByName && (
                              <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                <UserPlus className="h-3 w-3" />
                                Criado por: {evento.createdByName}
                              </div>
                            )}
                            
                            {evento.tratativa && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-700">Parecer / Tratativa:</p>
                                  {evento.location === "Prospecção" && (
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-gray-500" />
                                      <span className="text-xs font-medium text-gray-600">Visita de Prospecção</span>
                                    </div>
                                  )}
                                </div>
                                {evento.location === "Prospecção" ? (
                                  <div className="space-y-2">
                                    {(function() {
                                      // Extrai CNPJs do texto da tratativa
                                      const cnpjRegex = /\d{2}[\.,]?\d{3}[\.,]?\d{3}[\/]?\d{4}[-]?\d{2}/g;
                                      const cnpjs = evento.tratativa.match(cnpjRegex) || [];
                                      
                                      // Remove os CNPJs e o texto padrão para obter apenas as observações
                                      let observacoes = evento.tratativa;
                                      cnpjs.forEach(cnpj => {
                                        observacoes = observacoes.replace(cnpj, '');
                                      });
                                      
                                      // Remove o texto padrão e limpa o texto
                                      observacoes = observacoes
                                        .replace(/Empresas visitadas:[\s\S]*?\n/g, '')
                                        .trim()
                                        .replace(/^\s*[\r\n]/gm, ''); // Remove linhas em branco extras
                                      
                                      if (cnpjs.length > 0) {
                                        return (
                                          <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {cnpjs.map((cnpj, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-bradesco-blue transition-colors">
                                                  <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm font-medium">{formatCnpj(cnpj)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                      CNPJ
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                            {observacoes && (
                                              <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <MessageSquare className="h-4 w-4 text-gray-500" />
                                                  <span className="text-sm font-medium text-gray-700">Observações</span>
                                                </div>
                                                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                                  {observacoes}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );
                                      }
                                      return (
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                          {evento.tratativa}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{evento.tratativa}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditarEvento(evento.id)}
                              className="h-8 w-8 p-0 hover:bg-gray-100 group relative"
                              title="Editar evento"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              <span className="absolute left-auto right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Editar evento
                              </span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAbrirParecerDialog(evento.id)}
                              className="h-8 w-8 p-0 hover:bg-gray-100 group relative"
                              title="Adicionar parecer"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="absolute left-auto right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Adicionar parecer
                              </span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 group relative" 
                              onClick={() => handleExcluirEvento(evento.id)}
                              title="Excluir evento"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="absolute left-auto right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Excluir evento
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <EventsTable 
                events={eventos}
                onEditEvent={handleEditarEvento}
                onDeleteEvent={handleExcluirEvento}
                onAddFeedback={handleAbrirParecerDialog}
                isManagerView={isManager || isCoordinator || isAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isParecerDialogOpen} onOpenChange={(open) => {
        setIsParecerDialogOpen(open);
        if (!open) {
          // Reset completo ao fechar o modal
          setTratativaStep('pergunta-inicial');
          setVisitaRealizada(null);
          setDesejaReagendar(null);
          setNovaDataReagendamento(null);
          setNovaDataFimReagendamento(null);
          setSelectedRangeReagendamento(undefined);
          setCalendarReagendamentoOpen(null);
          setDateReagendamentoError("");
          setParecerText("");
          setCurrentEventId(null);
          setCurrentEventType(null);
          setIsProspeccaoMode(false);
          resetProspeccaoState();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tratativaStep === 'pergunta-inicial' && "Status da Visita"}
              {tratativaStep === 'tratativa' && (
                selectedEvento?.tratativa && selectedEvento.tratativa.trim() !== '' 
                  ? (isProspeccaoMode ? "Editar Parecer de Prospecção" : "Editar Parecer/Tratativa")
                  : (isProspeccaoMode ? "Parecer de Prospecção" : "Parecer/Tratativa")
              )}
              {tratativaStep === 'reagendamento' && "Reagendamento"}
            </DialogTitle>
            {tratativaStep === 'pergunta-inicial' && (
              <DialogDescription>
                A visita agendada para <strong>{selectedEvento?.titulo}</strong> pôde ser realizada?
              </DialogDescription>
            )}
            {tratativaStep === 'tratativa' && selectedEvento?.tratativa && selectedEvento.tratativa.trim() !== '' && (
              <DialogDescription>
                Editando a tratativa existente para <strong>{selectedEvento?.titulo}</strong>
              </DialogDescription>
            )}
          </DialogHeader>
          
          {/* Etapa 1: Pergunta inicial - ESCOLHA UMA DAS OPÇÕES ABAIXO */}
          
          {/* OPÇÃO 1: Cards Elegantes (ATUAL) */}
          {tratativaStep === 'pergunta-inicial' && (
            <div className="py-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-bradesco-blue to-blue-600 rounded-full flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Status da Visita</h3>
                <p className="text-gray-600">
                  Como foi o resultado da visita agendada para <span className="font-medium text-bradesco-blue">{selectedEvento?.titulo}</span>?
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {/* Card: Visita Realizada */}
                <div 
                  onClick={() => handleVisitaRealizadaResponse(true)}
                  className="group cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-700 text-lg">Visita Realizada</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Visita realizada com sucesso
                      </p>
                    </div>
                    <div className="text-xs text-green-500 font-medium">
                      Clique para adicionar parecer →
                    </div>
                  </div>
                </div>

                {/* Card: Visita Não Realizada */}
                <div 
                  onClick={() => handleVisitaRealizadaResponse(false)}
                  className="group cursor-pointer bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 hover:border-red-400 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 text-lg">Visita Não Realizada</h4>
                      <p className="text-sm text-red-600 mt-1">
                        A visita não pôde ser concluída
                      </p>
                    </div>
                    <div className="text-xs text-red-500 font-medium">
                      Clique para opções de reagendamento →
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  💡 Dica: Se a visita foi parcialmente realizada, selecione "Realizada" e adicione detalhes no parecer
                </p>
              </div>
            </div>
          )}

          {/* Etapa 2: Tratativa normal */}
          {tratativaStep === 'tratativa' && (
            <div className="space-y-4">
              {isProspeccaoMode && (
                <div className="space-y-4 pt-4 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="numCnpjs" className="text-sm font-medium block">
                      Quantas empresas foram visitadas?
                    </Label>
                    <div className="flex items-center">
                      <div className="flex items-center border rounded-md overflow-hidden shadow-sm">
                        <button
                          type="button"
                          className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border-r focus:outline-none transition-colors"
                          onClick={() => {
                            if (numCnpjs > 1) {
                              const newNum = numCnpjs - 1;
                              setNumCnpjs(newNum);
                              setCnpjValues(prev => prev.slice(0, newNum));
                            }
                          }}
                          disabled={numCnpjs <= 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                        
                        <input
                          id="numCnpjs"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="20"
                          value={numCnpjs}
                          onFocus={e => e.target.select()}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            let num = parseInt(rawValue);
                            
                            if (isNaN(num) || num < 1) num = 1;
                            if (num > 20) num = 20;
                            
                            setNumCnpjs(num);
                            
                            const newCnpjValues = [...cnpjValues];
                            const newCnpjStatus = [...cnpjProspectStatus];
                            if (num > newCnpjValues.length) {
                              while (newCnpjValues.length < num) {
                                newCnpjValues.push('');
                                newCnpjStatus.push(false);
                              }
                            } else if (num < newCnpjValues.length) {
                              newCnpjValues.length = num;
                              newCnpjStatus.length = num;
                            }
                            setCnpjValues(newCnpjValues);
                            setCnpjProspectStatus(newCnpjStatus);
                          }}
                          className="w-14 border-0 text-center focus:ring-0 focus:outline-none"
                        />
                        
                        <button
                          type="button"
                          className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border-l focus:outline-none transition-colors"
                          onClick={() => {
                            if (numCnpjs < 20) {
                              const newNum = numCnpjs + 1;
                              setNumCnpjs(newNum);
                              setCnpjValues(prev => [...prev, '']);
                            }
                          }}
                          disabled={numCnpjs >= 20}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      </div>
                      
                      <span className="ml-3 text-gray-600">
                        {numCnpjs} {numCnpjs === 1 ? 'empresa' : 'empresas'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
                    <h3 className="text-sm font-medium mb-3 text-blue-800 flex items-center">
                      <Building2 className="mr-1.5 text-blue-600 h-4 w-4" />
                      Informe os CNPJs das empresas visitadas:
                    </h3>
                    
                    <div className="space-y-3">
                      {Array.from({ length: numCnpjs }).map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-7 h-7 flex items-center justify-center bg-bradesco-blue rounded-full text-white text-xs font-medium shadow-sm">
                            {index + 1}
                          </div>
                          <Input
                            placeholder="XX.XXX.XXX/XXXX-XX"
                            value={cnpjValues[index] || ''}
                            onChange={(e) => handleCnpjChange(index, e.target.value)}
                            className={`flex-1 ${
                              cnpjValues[index] && !isValidCnpj(cnpjValues[index]) 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                : ''
                            }`}
                          />
                          <Button
                            type="button"
                            variant={cnpjProspectStatus[index] ? "default" : "outline"}
                            className={`min-w-[120px] ${
                              cnpjProspectStatus[index] 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'hover:bg-red-50 hover:text-red-600'
                            }`}
                            onClick={() => handleProspectStatusChange(index)}
                          >
                            Prospectado: {cnpjProspectStatus[index] ? 'Sim' : 'Não'}
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {cnpjValues.some(cnpj => cnpj && !isValidCnpj(cnpj)) && (
                      <div className="flex items-center text-sm text-red-500 mt-3 bg-red-50 p-2 rounded border border-red-200">
                        <AlertCircle className="mr-1.5 h-4 w-4" />
                        Um ou mais CNPJs estão incompletos ou inválidos.
                      </div>
                    )}
                    
                    {cnpjValues.filter(cnpj => cnpj).length === 0 && (
                      <div className="flex items-center text-sm text-amber-600 mt-3 bg-amber-50 p-2 rounded border border-amber-200">
                        <AlertCircle className="mr-1.5 h-4 w-4" />
                        Informe pelo menos um CNPJ para continuar.
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="py-4">
                <Label htmlFor="parecer" className="text-sm font-medium mb-2 block">
                  {isProspeccaoMode 
                    ? "Informações adicionais sobre a prospecção (opcional):" 
                    : "Parecer / Tratativa:"}
                </Label>
                <Textarea
                  id="parecer"
                  className="min-h-[120px]"
                  placeholder={
                    isProspeccaoMode 
                      ? "Detalhes adicionais sobre as visitas realizadas..."
                      : "Digite seu parecer ou tratativa sobre este evento..."
                  }
                  value={parecerText}
                  onChange={(e) => setParecerText(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Etapa 3: Reagendamento */}
          {tratativaStep === 'reagendamento' && (
            <div className="space-y-6 py-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Visita não realizada</span>
                </div>
                <p className="text-sm text-amber-700">
                  Como a visita não pôde ser realizada, você pode reagendá-la para uma nova data.
                </p>
              </div>

              <div className="text-center">
                <p className="text-lg font-medium text-gray-700 mb-4">
                  Deseja reagendar esta visita?
                </p>
                
                <div className="flex justify-center space-x-4 mb-6">
                  <Button
                    onClick={() => handleReagendamentoResponse(true)}
                    className="bg-bradesco-blue hover:bg-blue-700 text-white px-8 py-3"
                  >
                    <CalendarReagendIcon className="h-5 w-5 mr-2" />
                    Sim, reagendar
                  </Button>
                  <Button
                    onClick={() => handleReagendamentoResponse(false)}
                    variant="outline"
                    className="px-8 py-3"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Não, apenas registrar
                  </Button>
                </div>
              </div>

              {desejaReagendar && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nova data para reagendamento</Label>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={novaDataReagendamento ? format(novaDataReagendamento, "dd/MM/yyyy") : ""}
                          onClick={() => setCalendarReagendamentoOpen("start")}
                          readOnly
                          placeholder="Data inicial"
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={novaDataFimReagendamento ? format(novaDataFimReagendamento, "dd/MM/yyyy") : ""}
                          onClick={() => setCalendarReagendamentoOpen("end")}
                          readOnly
                          placeholder="Data final"
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    {dateReagendamentoError && (
                      <p className="text-sm text-red-500">{dateReagendamentoError}</p>
                    )}
                  </div>
                  
                  {calendarReagendamentoOpen && (
                    <div className="bg-white border rounded-md shadow-md p-4">
                      <Calendar
                        mode="range"
                        selected={selectedRangeReagendamento}
                        onSelect={(range) => {
                          setSelectedRangeReagendamento(range);
                          if (range?.from) {
                            setNovaDataReagendamento(range.from);
                            setNovaDataFimReagendamento(range.to || range.from);
                          }
                          if (range?.from && range?.to) {
                            setCalendarReagendamentoOpen(null);
                          }
                        }}
                        className="rounded-md border"
                        locale={ptBR}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsParecerDialogOpen(false);
              // O reset será feito pelo onOpenChange do Dialog
            }}>
              Cancelar
            </Button>
            
            {tratativaStep === 'tratativa' && (
              <Button 
                onClick={handleSalvarParecer} 
                className="bg-bradesco-blue"
                disabled={isProspeccaoMode && (cnpjValues.some(cnpj => cnpj && !isValidCnpj(cnpj)) || cnpjValues.filter(cnpj => cnpj).length === 0)}
              >
                {selectedEvento?.tratativa && selectedEvento.tratativa.trim() !== '' 
                  ? "Atualizar Parecer" 
                  : "Salvar Parecer"}
              </Button>
            )}
            
            {tratativaStep === 'reagendamento' && desejaReagendar && (
              <Button 
                onClick={handleReagendarEvento} 
                className="bg-bradesco-blue"
                disabled={!novaDataReagendamento || !novaDataFimReagendamento}
              >
                Confirmar Reagendamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default AgendaPage;
