
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
import { Input } from "@/components/ui/input";
import { Event } from "@/services/api";

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
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Função para determinar o status do evento
  const getEventStatus = (event: Event): 'pendente' | 'realizar' | 'tratada' => {
    // Se tem tratativa preenchida, está tratada
    if (event.tratativa && event.tratativa.trim() !== "") {
      return "tratada";
    }
    
    // Se a data de início é futura, é "a realizar"
    const startDate = new Date(event.dataInicio);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza para o início do dia
    
    if (startDate >= today) {
      return "realizar";
    }
    
    // Se já passou a data e não tem tratativa, está pendente
    return "pendente";
  };

  // Filtra os eventos
  const filteredEvents = events
    .filter((event) => {
      // Filtro de busca
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        searchText === "" ||
        event.titulo.toLowerCase().includes(searchLower) ||
        (event.location && event.location.toLowerCase().includes(searchLower)) ||
        (event.municipio && event.municipio.toLowerCase().includes(searchLower)) ||
        (event.supervisorName && event.supervisorName.toLowerCase().includes(searchLower));

      // Filtro de status
      const status = getEventStatus(event);
      const matchesStatus = statusFilter === null || status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Ordena por data de início, mais próxima primeiro
      return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
    });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto max-w-sm">
          <Input
            type="search"
            placeholder="Buscar eventos..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "realizar" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("realizar")}
            className="flex items-center gap-1"
          >
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            A realizar
          </Button>
          <Button
            variant={statusFilter === "pendente" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pendente")}
            className="flex items-center gap-1"
          >
            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
            Pendentes
          </Button>
          <Button
            variant={statusFilter === "tratada" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("tratada")}
            className="flex items-center gap-1"
          >
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Tratadas
          </Button>
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
