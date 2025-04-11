
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

interface EventsTableProps {
  events: Event[];
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddFeedback: (eventId: string) => void;
  isManagerView?: boolean;
}

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

  const filteredEvents = events
    .filter((event) => {
      const status = getEventStatus(event);
      const matchesStatus = statusFilter === null || status === statusFilter;

      const matchesCategory = categoryFilter === null || event.subcategory === categoryFilter;
      
      const matchesSupervisor = supervisorFilter === null || event.supervisorName === supervisorFilter;
      
      const eventLocation = event.municipio ? `${event.municipio}${event.uf ? `, ${event.uf}` : ''}` : '';
      const matchesLocation = locationFilter === null || eventLocation === locationFilter;

      return matchesStatus && matchesCategory && matchesSupervisor && matchesLocation;
    })
    .sort((a, b) => {
      return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
    });

  const clearAllFilters = () => {
    setStatusFilter(null);
    setCategoryFilter(null);
    setSupervisorFilter(null);
    setLocationFilter(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-3 w-full">
          <div className="w-full sm:w-auto">
            <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
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
            <Select value={categoryFilter || ""} onValueChange={(value) => setCategoryFilter(value || null)}>
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
            <Select value={locationFilter || ""} onValueChange={(value) => setLocationFilter(value || null)}>
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
          
          {isManagerView && (
            <div className="w-full sm:w-auto">
              <Select value={supervisorFilter || ""} onValueChange={(value) => setSupervisorFilter(value || null)}>
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
          
          {(statusFilter || categoryFilter || supervisorFilter || locationFilter) && (
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
              <TableHead className="w-[200px]">Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              {isManagerView && <TableHead>Supervisor</TableHead>}
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isManagerView ? 6 : 5}
                  className="h-32 text-center text-gray-500"
                >
                  Nenhum evento encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
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
            Total: {filteredEvents.length} de {events.length} eventos
          </TableCaption>
        </Table>
      </div>
    </div>
  );
};

export default EventsTable;
