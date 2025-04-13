import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: number;
  date: Date;
  title: string;
  description: string;
}

const AgendaPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Mock events for demonstration
    const mockEvents: Event[] = [
      { id: 1, date: new Date(), title: "Reunião com Cliente A", description: "Discussão sobre o projeto X" },
      { id: 2, date: new Date(new Date().setDate(new Date().getDate() + 2)), title: "Treinamento da Equipe", description: "Atualização sobre novas tecnologias" },
    ];
    setEvents(mockEvents);
  }, []);

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
  };

  const filteredEvents = events.filter(event =>
    format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Agenda</h1>
      <p className="text-muted-foreground mb-6">
        Visualize seus compromissos e atividades agendadas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalendarComponent events={events} onSelectDay={handleSelectDay} />
        <div>
          <h2 className="text-xl font-semibold mb-3">
            Compromissos de {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </h2>
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <Card key={event.id} className="mb-2">
                <CardContent>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhum compromisso para este dia.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarComponent = ({ events, onSelectDay }: { events: Event[]; onSelectDay: (date: Date) => void }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formatMonthName = (date: Date) => {
    return format(date, 'MMMM', { locale: ptBR });
  };

  const formatWeekdayName = (date: Date) => {
    return format(date, 'EEEEE', { locale: ptBR });
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) {
            setSelectedDate(date);
            onSelectDay(date);
          }
        }}
        className="mx-auto"
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
        }}
        labels={{
          months: [...Array(12).keys()].map(m => formatMonthName(new Date(2021, m, 1))),
          weekdays: [...Array(7).keys()].map(d => formatWeekdayName(new Date(2021, 0, d + 2)))
        }}
      />
    </div>
  );
};

export default AgendaPage;
