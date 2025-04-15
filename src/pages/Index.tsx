import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  BarChart2,
  Users,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Phone,
  Briefcase,
  CalendarDays,
  MapPin,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import CardsAcaoDiariaContas from "@/components/AcaoDiariaContas";
import { acaoDiariaApi, AcaoDiariaContas, eventApi, Event } from "@/services/api";
import { format, isPast, isToday, parseISO, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const navigate = useNavigate();
  const { user, isManager, isCoordinator, isSupervisor, isAdmin } = useAuth();
  
  const [acoesPendentes, setAcoesPendentes] = useState<AcaoDiariaContas[]>([]);
  const [alertas, setAlertas] = useState([]);
  const [eventosHoje, setEventosHoje] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    totalAcoes: 0,
    concluidas: 0,
    pendentes: 0,
    prioridadeAlta: 0,
    contasAbertasSemana: 0,
    contasAbertasMes: 0
  });
  
  // Função para carregar ações pendentes e eventos
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar ações diárias
        const acoes = await acaoDiariaApi.getAcoesDiarias();
        setAcoesPendentes(acoes.filter(acao => acao.situacao !== "concluido"));
        
        // Carregar eventos do dia atual
        const dataHoje = format(new Date(), 'yyyy-MM-dd');
        const eventos = await eventApi.getEvents(dataHoje);
        setEventosHoje(eventos);
        
        // Simular estatísticas - em produção, estas viriam da API
        setEstatisticas({
          totalAcoes: acoes.length,
          concluidas: acoes.filter(acao => acao.situacao === "concluido").length,
          pendentes: acoes.filter(acao => acao.situacao !== "concluido").length,
          prioridadeAlta: acoes.filter(acao => acao.prioridade === "alta").length,
          contasAbertasSemana: Math.floor(Math.random() * 30) + 10,
          contasAbertasMes: Math.floor(Math.random() * 120) + 50
        });
        
        // Simular alertas - em produção, estes viriam da API
        setAlertas([
          {
            id: 1,
            tipo: "comercial",
            titulo: "Oportunidade de venda",
            descricao: "Loja Jardins com potencial para abertura de 15 novas contas",
            prazo: new Date(Date.now() + 86400000 * 2),
            prioridade: "alta"
          },
          {
            id: 2,
            tipo: "contato",
            titulo: "Retorno pendente",
            descricao: "Correspondente Centro solicitou contato sobre linha de crédito",
            prazo: new Date(Date.now() + 86400000),
            prioridade: "media"
          },
          {
            id: 3,
            tipo: "visita",
            titulo: "Visita programada",
            descricao: "Agendar visita ao Posto Vila Nova - sem contato há 15 dias",
            prazo: new Date(Date.now() + 86400000 * 5),
            prioridade: "baixa"
          }
        ]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, []);
  
  // Função para formatar data
  const formatarData = (data) => {
    return format(new Date(data), "dd/MM/yyyy", {locale: ptBR});
  };
  
  // Função para formatar horário
  const formatarHorario = (data) => {
    return format(new Date(data), "HH:mm", {locale: ptBR});
  };
  
  // Verificar se um evento já passou
  const eventoPassado = (evento: Event) => {
    return isPast(new Date(evento.dataFim));
  };
  
  // Verificar se um evento tem tratativa
  const temTratativa = (evento: Event) => {
    return evento.tratativa && evento.tratativa.trim() !== '';
  };
  
  // Função para navegar para as diferentes telas
  const navegarPara = (caminho) => {
    navigate(caminho);
  };
  
  // Função para navegar para um evento específico
  const navegarParaEvento = (eventoId: string) => {
    navigate(`/agenda?evento=${eventoId}`);
  };
  
  // Determinar saudação baseada na hora do dia
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  
  return (
    <div className="container mx-auto pb-12 space-y-6">
      {/* Cabeçalho com saudação personalizada */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{saudacao}, {user?.name || ""}!</h1>
        <p className="text-gray-500">
          {format(new Date(), "'Hoje é' EEEE, d 'de' MMMM", {locale: ptBR})}
        </p>
      </div>
      
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-600">Ações Pendentes</p>
                <h3 className="text-2xl font-bold">{estatisticas.pendentes}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress className="h-1 mt-4" value={estatisticas.pendentes > 0 ? (estatisticas.concluidas / estatisticas.totalAcoes) * 100 : 100} />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-600">Contas Abertas (Mês)</p>
                <h3 className="text-2xl font-bold">{estatisticas.contasAbertasMes}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">+{estatisticas.contasAbertasSemana} esta semana</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-amber-600">Prioridade Alta</p>
                <h3 className="text-2xl font-bold">{estatisticas.prioridadeAlta}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Bell className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-600">Requer atenção imediata</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-purple-600">Taxa de Conclusão</p>
                <h3 className="text-2xl font-bold">
                  {estatisticas.totalAcoes > 0 
                    ? Math.round((estatisticas.concluidas / estatisticas.totalAcoes) * 100) 
                    : 0}%
                </h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress className="h-1 mt-4" value={estatisticas.totalAcoes > 0 ? (estatisticas.concluidas / estatisticas.totalAcoes) * 100 : 0} />
          </CardContent>
        </Card>
      </div>
      
      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Ações Diárias e Agenda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenda do Dia */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg text-indigo-800">Agenda de Hoje</CardTitle>
                  <CardDescription>Seus compromissos e visitas agendadas</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                  onClick={() => navegarPara('/agenda')}
                >
                  Ver Completa <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse space-y-3 w-full">
                    <div className="h-12 bg-indigo-100 rounded-md"></div>
                    <div className="h-12 bg-indigo-100 rounded-md"></div>
                  </div>
                </div>
              ) : eventosHoje.length > 0 ? (
                <div className="space-y-3">
                  {eventosHoje.map((evento) => (
                    <div 
                      key={evento.id} 
                      className={`p-3 rounded-md border-l-4 ${
                        eventoPassado(evento) && !temTratativa(evento) ? 'border-l-red-500 bg-red-50' : 
                        eventoPassado(evento) && temTratativa(evento) ? 'border-l-green-500 bg-green-50' : 
                        'border-l-indigo-500 bg-indigo-50'
                      } cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={() => navegarParaEvento(evento.id)}
                    >
                      <div className="flex justify-between">
                        <div className="font-medium">{evento.titulo}</div>
                        <div className="text-sm font-medium">
                          {formatarHorario(evento.dataInicio)} - {formatarHorario(evento.dataFim)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{evento.location || "Sem local definido"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{temTratativa(evento) ? "Com tratativa" : "Sem tratativa"}</span>
                        </div>
                      </div>
                      {eventoPassado(evento) && !temTratativa(evento) && (
                        <div className="mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded inline-block">
                          Evento finalizado sem tratativa
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
                  <p className="text-gray-500">Não há eventos agendados para hoje</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => navegarPara('/agenda')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Adicionar Evento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Ações Diárias */}
          <CardsAcaoDiariaContas />
          
          {/* Links para Estratégias Comerciais */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Estratégias Comerciais</CardTitle>
              <CardDescription>Acesse os produtos prioritários para atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline"
                  className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  onClick={() => navegarPara('/estrategia/abertura-conta')}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Abertura de Contas
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-green-200 bg-green-50 hover:bg-green-100"
                  onClick={() => navegarPara('/estrategia/credito')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Crédito
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-purple-200 bg-purple-50 hover:bg-purple-100"
                  onClick={() => navegarPara('/estrategia/seguro')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Seguros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Coluna 2: Alertas e Acionamentos */}
        <div>
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg text-amber-800">Alertas Comerciais</CardTitle>
              <CardDescription>Casos que necessitam sua atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertas.map(alerta => (
                  <Card key={alerta.id} className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{alerta.titulo}</h4>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          alerta.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                          alerta.prioridade === 'media' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alerta.prioridade === 'alta' ? 'Alta' :
                           alerta.prioridade === 'media' ? 'Média' : 'Baixa'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alerta.descricao}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          Prazo: {formatarData(alerta.prazo)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Tratar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {alertas.length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum alerta pendente no momento</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-amber-200 hover:bg-amber-50"
                onClick={() => navegarPara('/alertas')}
              >
                Ver todos os alertas
              </Button>
            </CardFooter>
          </Card>
          
          {/* Acesso Rápido */}
          <Card className="mt-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg text-purple-800">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 hover:bg-purple-50"
                  onClick={() => navegarPara('/agenda')}
                >
                  <Calendar className="mr-2 h-4 w-4 text-purple-600" />
                  Agenda
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 hover:bg-purple-50"
                  onClick={() => navegarPara('/hotlist')}
                >
                  <Phone className="mr-2 h-4 w-4 text-purple-600" />
                  Hotlist
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-purple-200 hover:bg-purple-50"
                  onClick={() => navegarPara('/estrategia-comercial')}
                >
                  <BarChart2 className="mr-2 h-4 w-4 text-purple-600" />
                  Estratégia Comercial
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Painel do Gerente (condicional) */}
          {isManager && (
            <Card className="mt-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Painel Gerencial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Performance da Equipe</p>
                      <p className="text-sm text-gray-500">Mês Atual</p>
                    </div>
                    <div className="text-lg font-semibold text-green-600">78%</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium">Ações Pendentes</p>
                      <p className="text-sm text-gray-500">Equipe</p>
                    </div>
                    <div className="text-lg font-semibold text-amber-600">12</div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => navegarPara('/relatorios')}
                >
                  Relatórios Gerenciais
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
