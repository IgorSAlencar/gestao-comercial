
import React, { useState } from "react";
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
  ClipboardList, 
  MapPin, 
  Tool, 
  CheckSquare, 
  Bell, 
  Activity, 
  List, 
  AlignLeft,
  AlertTriangle,
  TrendingDown,
  CircleAlert,
  AlertOctagon,
  BarChart2,
  Users 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DashboardCard = ({ title, children, className = "" }) => (
  <Card className={`h-full ${className}`}>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const TaskItem = ({ text, done = false }) => (
  <div className="flex items-center gap-2 py-1.5">
    <div className={`h-5 w-5 rounded-sm flex items-center justify-center ${done ? 'bg-green-500' : 'border border-gray-300'}`}>
      {done && <CheckSquare className="h-4 w-4 text-white" />}
    </div>
    <span className={done ? 'line-through text-gray-500' : ''}>{text}</span>
  </div>
);

const AlertItem = ({ icon, text, color }) => (
  <div className={`flex items-center gap-2 p-2 rounded-md mb-2 bg-${color}-50 border border-${color}-200`}>
    {icon}
    <span className={`text-${color}-800 text-sm`}>{text}</span>
  </div>
);

const StatCard = ({ icon, label, value, color = "blue" }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border">
    <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-${color}-100 text-${color}-500`}>
      {icon}
    </div>
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  </div>
);

const QuickAccessButton = ({ icon, label, onClick }) => (
  <Button 
    variant="outline" 
    className="h-24 w-full flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Button>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, isManager, isCoordinator, isSupervisor, isAdmin } = useAuth();
  
  // Mock data - in a real app, this would come from API calls
  const mockData = {
    completedTasks: 7,
    pendingTasks: 3, 
    todayEvents: 4,
    urgentItems: 2,
    storeStatus: {
      active: 23,
      alert: 5,
      blocked: 2
    },
    weeklyProduction: [65, 72, 68, 80, 74, 90],
    teamEngagement: 78,
    alerts: [
      {
        type: "production",
        text: "Loja Centro - Queda de 30% na produção de crédito",
        color: "amber"
      },
      {
        type: "visit",
        text: "Correspondente Vila Nova - Sem visita há 15 dias",
        color: "yellow" 
      },
      {
        type: "compliance", 
        text: "Alerta de Compliance - Posto Jardins",
        color: "red"
      }
    ]
  };
  
  const navigateTo = (path: string) => {
    navigate(path);
  };
  
  // Adjust dashboard based on user role
  const roleName = user?.role === 'gerente' ? 'Gerente' : 
                   user?.role === 'coordenador' ? 'Coordenador' : 
                   user?.role === 'supervisor' ? 'Supervisor' : 'Administrador';
  
  const welcomeMessage = isAdmin ? 'Bem-vindo ao painel administrativo' :
                         `Bem-vindo ao seu painel de gestão, ${user?.name || roleName}`;

  return (
    <div className="container mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{welcomeMessage}</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Row 1: Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<CheckSquare className="h-5 w-5" />}
          label="Tarefas Concluídas"
          value={`${mockData.completedTasks}/${mockData.completedTasks + mockData.pendingTasks}`}
          color="green"
        />
        <StatCard 
          icon={<Calendar className="h-5 w-5" />}
          label="Agendas do Dia"
          value={mockData.todayEvents}
          color="blue"
        />
        <StatCard 
          icon={<Bell className="h-5 w-5" />}
          label="Pendências Urgentes"
          value={mockData.urgentItems}
          color="red"
        />
        <StatCard 
          icon={<Activity className="h-5 w-5" />}
          label="Lojas Ativas"
          value={`${mockData.storeStatus.active - mockData.storeStatus.alert - mockData.storeStatus.blocked}/${mockData.storeStatus.active}`}
          color="purple"
        />
      </div>

      {/* Row 2: Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Column 1: To-do List */}
        <div className="md:col-span-1 space-y-6">
          <DashboardCard title="Lista de Tarefas">
            <div className="space-y-1">
              <TaskItem text="Visitar Correspondente Jardins" done={true} />
              <TaskItem text="Revisar relatório semanal" done={true} />
              <TaskItem text="Reunião com equipe comercial" done={true} />
              <TaskItem text="Contatar loja com baixa produção" />
              <TaskItem text="Preparar apresentação mensal" />
              <TaskItem text="Atualizar sistema de metas" />
            </div>
            <div className="mt-4 pt-2 border-t">
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <AlignLeft className="h-4 w-4" />
                <span>Anotações Pessoais</span>
              </div>
              <textarea 
                className="w-full border rounded p-2 text-sm"
                rows={3}
                placeholder="Adicione suas anotações aqui..."
              />
            </div>
          </DashboardCard>
          
          <DashboardCard title="Ações Sugeridas">
            <div className="space-y-2">
              <div className="p-2 rounded border-l-4 border-blue-500 bg-blue-50">
                Visitar lojas com produção abaixo de 70% da meta
              </div>
              <div className="p-2 rounded border-l-4 border-amber-500 bg-amber-50">
                Correspondentes sem contato há mais de 10 dias
              </div>
              <div className="p-2 rounded border-l-4 border-green-500 bg-green-50">
                Realizar feedback para equipe sobre resultados da semana
              </div>
            </div>
          </DashboardCard>
        </div>
        
        {/* Column 2: Charts & Alerts */}
        <div className="md:col-span-1 space-y-6">
          <DashboardCard title="Indicadores de Performance">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Produção Semanal</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="flex h-8 gap-1">
                  {mockData.weeklyProduction.map((value, i) => (
                    <div 
                      key={i}
                      className="flex-1 rounded bg-blue-500" 
                      style={{height: `${value}%`}}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Engajamento da Equipe</span>
                  <span className="text-sm font-medium">{mockData.teamEngagement}%</span>
                </div>
                <Progress value={mockData.teamEngagement} className="h-2" />
              </div>
            </div>
          </DashboardCard>
          
          <DashboardCard title="Alertas e Destaques">
            <div className="space-y-3">
              <AlertItem 
                icon={<TrendingDown className="h-4 w-4 text-amber-500" />}
                text="Loja Centro - Queda de 30% na produção de crédito"
                color="amber"
              />
              <AlertItem 
                icon={<CircleAlert className="h-4 w-4 text-yellow-500" />}
                text="Correspondente Vila Nova - Sem visita há 15 dias"
                color="yellow"
              />
              <AlertItem 
                icon={<AlertOctagon className="h-4 w-4 text-red-500" />}
                text="Alerta de Compliance - Posto Jardins"
                color="red"
              />
            </div>
          </DashboardCard>
        </div>
        
        {/* Column 3: Quick Access */}
        <div className="md:col-span-1 space-y-6">
          <DashboardCard title="Acesso Rápido">
            <div className="grid grid-cols-2 gap-4">
              <QuickAccessButton 
                icon={<Calendar className="h-6 w-6" />}
                label="Agenda"
                onClick={() => navigateTo('/agenda')}
              />
              <QuickAccessButton 
                icon={<ClipboardList className="h-6 w-6" />}
                label="Hotlist"
                onClick={() => navigateTo('/hotlist')}
              />
              <QuickAccessButton 
                icon={<MapPin className="h-6 w-6" />}
                label="Prospecção"
                onClick={() => navigateTo('/oportunidades')}
              />
              <QuickAccessButton 
                icon={<Tool className="h-6 w-6" />}
                label="Pós-venda"
                onClick={() => navigateTo('/correspondentes-bloqueados')}
              />
            </div>
          </DashboardCard>
          
          <DashboardCard title="Status das Lojas">
            <div className="space-y-4">
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Ativas</span>
                </div>
                <span className="font-medium">{mockData.storeStatus.active - mockData.storeStatus.alert - mockData.storeStatus.blocked}</span>
              </div>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Em alerta</span>
                </div>
                <span className="font-medium">{mockData.storeStatus.alert}</span>
              </div>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Bloqueadas</span>
                </div>
                <span className="font-medium">{mockData.storeStatus.blocked}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => navigateTo('/correspondentes-bloqueados')}
              >
                Ver detalhes
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div>
      
      {/* Admin panel conditional rendering */}
      {isAdmin && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Painel Administrativo</CardTitle>
            <CardDescription>Acesso a funções administrativas do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => navigateTo('/usuarios')} className="w-full">
                <Users className="mr-2 h-4 w-4" /> Gerenciar Usuários
              </Button>
              <Button onClick={() => navigateTo('/configuracoes')} className="w-full">
                Configurações do Sistema
              </Button>
              <Button onClick={() => navigateTo('/relatorios')} className="w-full">
                Relatórios Avançados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
