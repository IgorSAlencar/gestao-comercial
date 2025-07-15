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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileDown,
  Download,
  FileSpreadsheet
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as XLSX from 'xlsx';

interface EventsTableProps {
  events: Event[];
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddFeedback: (eventId: string) => void;
  isManagerView?: boolean;
}

type SortField = 'titulo' | 'dataInicio' | 'dataFim' | 'location' | 'subcategory' | 'supervisorName' | 'status';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    if (sortField !== field) return null;
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

  // Calculando os eventos para a página atual
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationControls = () => {
    const pageButtons = [];
    
    // Botão para primeira página
    pageButtons.push(
      <Button
        key="first"
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">Primeira página</span>
      </Button>
    );
    
    // Botão para página anterior
    pageButtons.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>
    );
    
    // Determinar quais números de página mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar startPage se não tivermos 5 páginas para exibir
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Adicionar botões de número
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className="w-8 h-8 p-0"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Botão para próxima página
    pageButtons.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima página</span>
      </Button>
    );
    
    // Botão para última página
    pageButtons.push(
      <Button
        key="last"
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => handlePageChange(totalPages)}
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Última página</span>
      </Button>
    );
    
    return pageButtons;
  };

  const exportarParaExcel = () => {
    // Preparar os dados para exportação
    const dadosParaExportar = sortedEvents.map(event => ({
      'Título': event.titulo,
      'Subcategoria': event.subcategory || '',
      'Descrição/Motivo': event.other_description || '',
      'Data Início': format(new Date(event.dataInicio), "dd/MM/yyyy", { locale: ptBR }),
      'Data Fim': format(new Date(event.dataFim), "dd/MM/yyyy", { locale: ptBR }),
      'Local': event.location || '',
      'Município': event.municipio || '',
      'UF': event.uf || '',
      'Agência/PA': event.agencia_pa_number || '',
      'É PA': event.is_pa ? 'Sim' : 'Não',
      'Status': getEventStatus(event),
      'Parecer/Tratativa': event.tratativa || '',
      'Supervisor': event.supervisorName || '',
      'Criado por': (event.createdById && event.createdById !== event.supervisorId) ? event.createdByName || '' : '',
    }));

    // Criar uma nova planilha
    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eventos");

    // Gerar o arquivo Excel
    XLSX.writeFile(wb, `Eventos_Agenda_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
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
              <div className="relative">
                {dateRange && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                    <button
                      type="button"
                      className="h-6 w-6 flex items-center justify-center hover:text-red-500 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDateRange(undefined);
                        setDateFilterOpen(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left group",
                      dateRange && "text-foreground pr-8"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate max-w-[240px] inline-block">{formatDateString()}</span>
                  </Button>
                </PopoverTrigger>
              </div>
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
                    {dateRange?.from && dateRange?.to && `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`}
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
                  onClick={exportarParaExcel}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar dados para Excel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {(statusFilter || categoryFilter || supervisorFilter || locationFilter || dateRange) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:ml-0"
              onClick={clearAllFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%] py-3">
                <div className="flex w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-gray-100"
                    onClick={() => handleSort('titulo')}
                  >
                    Título
                    {getSortIcon('titulo')}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="w-[20%] text-center py-3">
                <div className="flex justify-center w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-gray-100"
                    onClick={() => handleSort('dataInicio')}
                  >
                    Data
                    {getSortIcon('dataInicio')}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="w-[25%] text-center py-3">
                <div className="flex justify-center w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-gray-100"
                    onClick={() => handleSort('location')}
                  >
                    Local
                    {getSortIcon('location')}
                  </Button>
                </div>
              </TableHead>
              {isManagerView && (
                <TableHead className="w-[12%] text-center py-3">
                  <div className="flex justify-center w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 hover:bg-gray-100"
                      onClick={() => handleSort('supervisorName')}
                    >
                      Supervisor
                      {getSortIcon('supervisorName')}
                    </Button>
                  </div>
                </TableHead>
              )}
              <TableHead className="w-[8%] text-center py-3">
                <div className="flex justify-center w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="w-[10%] text-right py-3">
                <div className="flex justify-end w-full">Ações</div>
              </TableHead>
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
              currentEvents.map((event) => {
                const status = getEventStatus(event);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium w-[25%] align-middle py-3">
                      <div className="truncate">
                        {event.titulo}
                        {event.subcategory && (
                          <div className="text-xs text-gray-500 mt-1 truncate">{event.subcategory}</div>
                        )}
                        {event.other_description && (
                          <div className="text-xs text-gray-600 mt-1 truncate">
                            <span className="font-medium">Motivo:</span> {event.other_description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[20%] align-middle py-3">
                      <div className="flex items-center gap-1.5 justify-center">
                        <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
                    <TableCell className="text-center w-[25%] align-middle py-3">
                      <div className="flex flex-col items-center justify-center">
                        <span className="truncate max-w-full">{event.location || "-"}</span>
                        {event.municipio && event.uf && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-full">
                            {event.municipio}, {event.uf}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {isManagerView && (
                      <TableCell className="text-center w-[12%] align-middle py-3">
                        <div className="flex flex-col items-center justify-center">
                          <span>{event.supervisorName || "-"}</span>
                          {event.createdById && event.createdById !== event.supervisorId && event.createdByName && (
                            <div className="text-xs text-gray-500 mt-1">
                              Criado por: {event.createdByName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-center w-[8%] align-middle py-3">
                      <div className="flex justify-center">
                        <TableStatus status={status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right w-[10%] align-middle py-3">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => onEditEvent(event.id)}
                              >
                                <span className="sr-only">Editar</span>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                onClick={() => onAddFeedback(event.id)}
                              >
                                <span className="sr-only">Adicionar parecer</span>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adicionar parecer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => onDeleteEvent(event.id)}
                              >
                                <span className="sr-only">Excluir</span>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableCaption className="px-4 py-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span>
                Mostrando {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, sortedEvents.length)} de {sortedEvents.length} eventos
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {renderPaginationControls()}
                </div>
              )}
            </div>
          </TableCaption>
        </Table>
      </div>
    </div>
  );
};

export default EventsTable;
