import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableStatus,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarIcon,
  ChevronDown,
  EyeIcon,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit2,
  X,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface EventsTableProps {
  events: Event[];
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddFeedback: (eventId: string) => void;
  isManagerView?: boolean;
}

type SortField = 'titulo' | 'dataInicio' | 'dataFim' | 'location' | 'subcategory';
type SortOrder = 'asc' | 'desc';

const EventsTable = ({
  events,
  onEditEvent,
  onDeleteEvent,
  onAddFeedback,
  isManagerView = false,
}: EventsTableProps) => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [supervisorFilter, setSupervisorFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('dataInicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const uniqueSupervisors = Array.from(new Set(events.map(e => e.supervisorName).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(events.map(e => e.location).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(events.map(e => e.subcategory).filter(Boolean)));
  const uniqueMunicipios = Array.from(new Set(events.map(e => e.municipio ? `${e.municipio}${e.uf ? `, ${e.uf}` : ''}` : null).filter(Boolean)));

  const getEventStatus = (event: Event): 'pendente' | 'realizar' | 'tratada' => {
    if (event.tratativa && event.tratativa.trim() !== "") {
      return "tratada";
    }
    
    const startDate = new Date(event.dataInicio);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate >= today) {
      return "realizar";
    }
    
    return "pendente";
  };

  const isEventInDateRange = (event: Event): boolean => {
    if (!dateRange) return true;
    
    const eventStartDate = new Date(event.dataInicio);
    const eventEndDate = new Date(event.dataFim);
    
    // Reset time component for comparison
    eventStartDate.setHours(0, 0, 0, 0);
    eventEndDate.setHours(23, 59, 59, 999);
    
    const rangeStart = dateRange.from;
    const rangeEnd = dateRange.to || dateRange.from;
    
    if (!rangeStart) return true;
    
    // Check if event overlaps with the selected range
    // Event starts before range ends AND event ends after range starts
    return (
      eventStartDate <= rangeEnd && 
      eventEndDate >= rangeStart
    );
  };

  const filteredEvents = events
    .filter((event) => {
      const status = getEventStatus(event);
      const matchesStatus = statusFilter === null || status === statusFilter;

      const matchesCategory = categoryFilter === null || event.subcategory === categoryFilter;
      
      const matchesSupervisor = supervisorFilter === null || event.supervisorName === supervisorFilter;
      
      const eventLocation = event.municipio ? `${event.municipio}${event.uf ? `, ${event.uf}` : ''}` : '';
      const matchesLocation = locationFilter === null || eventLocation === locationFilter;

      const matchesDateRange = isEventInDateRange(event);

      return matchesStatus && matchesCategory && matchesSupervisor && matchesLocation && matchesDateRange;
    })
    .sort((a, b) => {
      return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortField === 'dataInicio' || sortField === 'dataFim') {
      return sortOrder === 'asc' 
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }

    return sortOrder === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const clearAllFilters = () => {
    setStatusFilter(null);
    setCategoryFilter(null);
    setSupervisorFilter(null);
    setLocationFilter(null);
    setDateRange(undefined);
  };

  const formatDateString = () => {
    if (!dateRange?.from) return "Filtrar por data";
    
    if (!dateRange.to) {
      return format(dateRange.from, "dd/MM/yyyy");
    }
    
    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-3 w-full">
          <div className="w-full sm:w-auto">
            <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="realizar">A realizar</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="tratada">Tratadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select value={categoryFilter || ""} onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select value={locationFilter || ""} onValueChange={(value) => setLocationFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Município/UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os municípios</SelectItem>
                {uniqueMunicipios.map((municipio) => (
                  <SelectItem key={municipio} value={municipio}>
                    {municipio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left",
                    dateRange && "text-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{formatDateString()}</span>
                  {dateRange && (
                    <X 
                      className="ml-auto h-4 w-4 opacity-50 hover:opacity-100" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateRange(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto bg-background shadow-none w-full")}
                />
                <div className="p-3 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {dateRange?.from && !dateRange?.to && "Selecione a data final"}
                    {dateRange?.from && dateRange?.to && `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`}
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setDateFilterOpen(false)}
                    className="ml-auto"
                  >
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {isManagerView && (
            <div className="w-full sm:w-auto">
              <Select value={supervisorFilter || ""} onValueChange={(value) => setSupervisorFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os supervisores</SelectItem>
                  {uniqueSupervisors.map((supervisor) => (
                    <SelectItem key={supervisor} value={supervisor}>
                      {supervisor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {(statusFilter || categoryFilter || supervisorFilter || locationFilter || dateRange) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={clearAllFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleSort('titulo')}
                >
                  Evento
                  {getSortIcon('titulo')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleSort('dataInicio')}
                >
                  Data
                  {getSortIcon('dataInicio')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleSort('dataFim')}
                >
                  Data
                  {getSortIcon('dataFim')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleSort('location')}
                >
                  Local
                  {getSortIcon('location')}
                </Button>
              </TableHead>
              {isManagerView && <TableHead>Supervisor</TableHead>}
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isManagerView ? 6 : 5}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhum evento encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              sortedEvents.map((event) => {
                const status = getEventStatus(event);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.titulo}
                      {event.subcategory && (
                        <div className="text-xs text-gray-500 mt-1">{event.subcategory}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span>
                          {format(
                            new Date(event.dataInicio), 
                            "dd/MM/yyyy", 
                            { locale: ptBR }
                          )}
                          {new Date(event.dataInicio).getTime() !== new Date(event.dataFim).getTime() && (
                            <> - {format(new Date(event.dataFim), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span>
                          {format(
                            new Date(event.dataInicio), 
                            "dd/MM/yyyy", 
                            { locale: ptBR }
                          )}
                          {new Date(event.dataInicio).getTime() !== new Date(event.dataFim).getTime() && (
                            <> - {format(new Date(event.dataFim), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.location || "-"}
                      {event.municipio && event.uf && (
                        <div className="text-xs text-gray-500 mt-1">
                          {event.municipio}, {event.uf}
                        </div>
                      )}
                    </TableCell>
                    {isManagerView && (
                      <TableCell>
                        {event.supervisorName || "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      <TableStatus status={status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => onEditEvent(event.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => onAddFeedback(event.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Adicionar parecer</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600 cursor-pointer"
                            onClick={() => onDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableCaption className="px-4">
            Total: {sortedEvents.length} de {events.length} eventos
          </TableCaption>
        </Table>
      </div>
    </div>
  );
};

export default EventsTable;
