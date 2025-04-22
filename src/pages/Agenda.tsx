import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, MessageSquare, Filter, Users, ListFilter, PanelsTopLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

const AgendaPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isParecerDialogOpen, setIsParecerDialogOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [parecerText, setParecerText] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState<"start" | "end" | null>(null);
  const [dateError, setDateError] = useState<string>("");
  
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

  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors', user?.id],
    queryFn: () => {
      if (isAdmin && user?.id) {
        return userApi.getAllUsers();
      } 
      else if ((isManager || isCoordinator) && user?.id) {
        return userApi.getSupervisors(user.id);
      }
      return Promise.resolve([]);
    },
    enabled: !!(user?.id && (isManager || isCoordinator || isAdmin)),
  });

  const { data: eventos = [], isLoading, error } = useQuery({
    queryKey: ['events', selectedSupervisor],
    queryFn: () => eventApi.getEvents(
      undefined, 
      selectedSupervisor || undefined
    ),
    enabled: !!user?.id,
  });

  const createEventMutation = useMutation({
    mutationFn: eventApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Evento adicionado",
        description: "O evento foi adicionado à agenda com sucesso!",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar evento",
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
      toast({
        title: "Parecer adicionado",
        description: "O parecer foi adicionado ao evento com sucesso!",
      });
      setIsParecerDialogOpen(false);
      setCurrentEventId(null);
      setParecerText("");
    },
    onError: (error: Error) => {
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
  };

  const handleSalvarEvento = () => {
    if (!novoEvento.titulo || !novoEvento.location) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    const eventData = {
      ...novoEvento,
      supervisorId: (isManager || isCoordinator || isAdmin) && selectedSupervisor ? selectedSupervisor : user?.id
    };
    
    if (editingEvent) {
      updateEventMutation.mutate({ 
        eventId: editingEvent, 
        data: eventData 
      });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleAbrirParecerDialog = (id: string) => {
    const evento = eventos.find(evento => evento.id === id);
    if (evento) {
      setParecerText(evento.tratativa || "");
      setCurrentEventId(id);
      setIsParecerDialogOpen(true);
    }
  };

  const handleSalvarParecer = () => {
    if (!currentEventId) return;
    updateFeedbackMutation.mutate({ 
      eventId: currentEventId, 
      tratativa: parecerText 
    });
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
    
    // Filtro por tipo de evento
    const matchesFilter = !selectedFilter || (
      selectedFilter === "operacional" && evento.location === "Visitas Operacionais" ||
      selectedFilter === "negociacao" && evento.location === "Visitas de Negociação" ||
      selectedFilter === "prospeccao" && evento.location === "Prospecção" ||
      selectedFilter === "outros" && evento.location === "Outros"
    );
    
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
    if (value === "all") {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(value);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agenda de Atividades</h1>
        
        <div className="flex space-x-2">
          {(isManager || isCoordinator || isAdmin) && (
            <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar por Usuário</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Filtrar por Usuário</DrawerTitle>
                  <DrawerDescription>
                    Selecione um usuário para visualizar sua agenda
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4">
                  <div className="grid gap-4">
                    {supervisors.map((supervisor) => (
                      <div 
                        key={supervisor.id} 
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedSupervisor === supervisor.id ? 'bg-bradesco-blue text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSupervisor(supervisor.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{supervisor.name}</p>
                            <p className="text-sm opacity-70">{supervisor.role.charAt(0).toUpperCase() + supervisor.role.slice(1)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedSupervisor(null)}
                      className="mt-2"
                    >
                      Ver todos os usuários
                    </Button>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Fechar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-bradesco-blue">
                <Plus className="h-4 w-4 mr-2" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Editar evento" : "Adicionar novo evento"}</DialogTitle>
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
                    <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-lg mt-1 p-2 focus:outline-none">
                      <SelectItem value="Prospecção" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                        Prospecção
                      </SelectItem>
                      <SelectItem value="Visitas Operacionais" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                        Visitas Operacionais
                      </SelectItem>
                      <SelectItem value="Visitas de Negociação" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                        Visitas de Negociação
                      </SelectItem>
                      <SelectItem value="Outros" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                        Outros
                      </SelectItem>
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
                      <SelectContent className="bg-white border border-gray-300 rounded-lg shadow-lg mt-1 p-2 focus:outline-none">
                        {novoEvento.location === "Prospecção" && (
                          <>
                            <SelectItem value="Prospecção Habitual" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Prospecção Habitual
                            </SelectItem>
                            <SelectItem value="Prospecção em Praça Presença" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Prospecção em Praça Presença
                            </SelectItem>
                          </>
                        )}

                        {novoEvento.location === "Visitas Operacionais" && (
                          <>
                            <SelectItem value="Treinamento" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Treinamento
                            </SelectItem>
                            <SelectItem value="Apoio Operacional" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Apoio Operacional
                            </SelectItem>
                            <SelectItem value="Incentivo e Engajamento" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Incentivo e Engajamento
                            </SelectItem>
                          </>
                        )}
                        {novoEvento.location === "Visitas de Negociação" && (
                          <>
                            <SelectItem value="Alinhamento com AG/PA" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Alinhamento com AG/PA
                            </SelectItem>
                            <SelectItem value="Proposta Comercial" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200">
                              Proposta Comercial
                            </SelectItem>
                          </>
                        )}
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agencia_pa_number">Número da Agência/PA</Label>
                      <Input
                        id="agencia_pa_number"
                        type="text"
                        value={novoEvento.agencia_pa_number || ""}
                        onChange={(e) =>
                          setNovoEvento({ ...novoEvento, agencia_pa_number: e.target.value })
                        }
                        placeholder="Ex: 12345"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_pa"
                        checked={novoEvento.is_pa || false}
                        onChange={(e) =>
                          setNovoEvento({ ...novoEvento, is_pa: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="is_pa" className="text-sm text-gray-700">
                        Marque se for um PA
                      </Label>
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
              Visualizando agenda de: {
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
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4" /> 
                      Usuários
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
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleFilterChange("all")}>
                      Todas as visitas
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleFilterChange("operacional")}>
                      Visitas operacionais
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleFilterChange("negociacao")}>
                      Visitas de negociação
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleFilterChange("prospeccao")}>
                      Prospecção
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleFilterChange("outros")}>
                      Outros eventos
                    </DropdownMenuItem>
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
                    {selectedSupervisor 
                      ? `Nenhum evento agendado para ${supervisors.find(s => s.id === selectedSupervisor)?.name || "este usuário"} nesta data.`
                      : "Nenhum evento agendado para esta data."
                    }
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
                            
                            {evento.tratativa && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium text-gray-700">Parecer / Tratativa:</p>
                                <p className="text-sm text-gray-600">{evento.tratativa}</p>
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

      <Dialog open={isParecerDialogOpen} onOpenChange={setIsParecerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Parecer/Tratativa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="min-h-[120px]"
              placeholder="Digite seu parecer ou tratativa sobre este evento..."
              value={parecerText}
              onChange={(e) => setParecerText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsParecerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarParecer} className="bg-bradesco-blue">
              Salvar Parecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaPage;
