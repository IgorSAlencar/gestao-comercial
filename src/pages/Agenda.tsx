
import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: Date;
  horario: string;
  tipo: "visita" | "reuniao" | "outro";
  tratativa?: string;
}

const eventosIniciais: Evento[] = [
  {
    id: "1",
    titulo: "Visita à Loja ABC",
    descricao: "Verificação das operações e reunião com gerente.",
    data: new Date(),
    horario: "09:00",
    tipo: "visita",
  },
  {
    id: "2",
    titulo: "Treinamento da Equipe",
    descricao: "Apresentação das novas estratégias comerciais.",
    data: new Date(),
    horario: "14:00",
    tipo: "reuniao",
  },
];

const AgendaPage = () => {
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciais);
  const [date, setDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isParecerDialogOpen, setIsParecerDialogOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [parecerText, setParecerText] = useState("");
  const [novoEvento, setNovoEvento] = useState<Omit<Evento, "id">>({
    titulo: "",
    descricao: "",
    data: new Date(),
    horario: "",
    tipo: "visita",
  });
  
  const { toast } = useToast();

  const eventosDoDia = eventos.filter(
    (evento) => format(evento.data, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );
  
  const handleSalvarEvento = () => {
    if (!novoEvento.titulo || !novoEvento.horario) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e horário do evento",
        variant: "destructive",
      });
      return;
    }
    
    const novoId = Math.random().toString(36).substring(7);
    setEventos([...eventos, { ...novoEvento, id: novoId }]);
    
    toast({
      title: "Evento adicionado",
      description: "O evento foi adicionado à sua agenda com sucesso!",
    });
    
    setNovoEvento({
      titulo: "",
      descricao: "",
      data: new Date(),
      horario: "",
      tipo: "visita",
    });
    
    setIsDialogOpen(false);
  };

  const handleExcluirEvento = (id: string) => {
    const novosEventos = eventos.filter(evento => evento.id !== id);
    setEventos(novosEventos);
    
    toast({
      title: "Evento excluído",
      description: "O evento foi removido da sua agenda com sucesso!",
    });
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
    
    const novosEventos = eventos.map(evento => {
      if (evento.id === currentEventId) {
        return { ...evento, tratativa: parecerText };
      }
      return evento;
    });
    
    setEventos(novosEventos);
    
    toast({
      title: "Parecer adicionado",
      description: "O parecer foi adicionado ao evento com sucesso!",
    });
    
    setIsParecerDialogOpen(false);
    setCurrentEventId(null);
    setParecerText("");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agenda de Atividades</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-bradesco-blue">
              <Plus className="h-4 w-4 mr-2" /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar novo evento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Título</label>
                <Input
                  className="col-span-3"
                  value={novoEvento.titulo}
                  onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Data</label>
                <div className="col-span-3">
                  <Input
                    type="date"
                    value={format(novoEvento.data, "yyyy-MM-dd")}
                    onChange={(e) => setNovoEvento({ ...novoEvento, data: new Date(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Horário</label>
                <Input
                  className="col-span-3"
                  type="time"
                  value={novoEvento.horario}
                  onChange={(e) => setNovoEvento({ ...novoEvento, horario: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Tipo</label>
                <select
                  className="col-span-3 p-2 border rounded-md"
                  value={novoEvento.tipo}
                  onChange={(e) => setNovoEvento({ 
                    ...novoEvento, 
                    tipo: e.target.value as "visita" | "reuniao" | "outro" 
                  })}
                >
                  <option value="visita">Visita</option>
                  <option value="reuniao">Reunião</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="text-right text-sm">Descrição</label>
                <Textarea
                  className="col-span-3"
                  value={novoEvento.descricao}
                  onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarEvento} className="bg-bradesco-blue">
                Salvar Evento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border pointer-events-auto"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              Eventos de {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventosDoDia.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                Nenhum evento agendado para esta data.
              </div>
            ) : (
              <div className="space-y-4">
                {eventosDoDia.map((evento) => (
                  <div
                    key={evento.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h3 className="font-medium">{evento.titulo}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{evento.horario}</span>
                          <span className="mx-2">•</span>
                          <span className="capitalize">{evento.tipo}</span>
                        </div>
                        {evento.descricao && (
                          <p className="mt-2 text-sm text-gray-600">{evento.descricao}</p>
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
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAbrirParecerDialog(evento.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Parecer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleExcluirEvento(evento.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
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

      {/* Dialog para adicionar parecer/tratativa */}
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
