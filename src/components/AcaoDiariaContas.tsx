import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { AcaoDiariaContas, acaoDiariaApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Component para mostrar um resumo da equipe para gerentes/coordenadores
const EquipeAcoesDiarias: React.FC<{ acoesDiarias: AcaoDiariaContas[] }> = ({ acoesDiarias }) => {
  const { subordinates } = useAuth();
  
  // Agrupar ações por userId
  const acoesPorUsuario = acoesDiarias.reduce((acc, acao) => {
    if (!acc[acao.userId]) {
      acc[acao.userId] = [];
    }
    acc[acao.userId].push(acao);
    return acc;
  }, {} as Record<string, AcaoDiariaContas[]>);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Resumo da Equipe</h3>
      
      <div className="space-y-2">
        {subordinates.map(subordinado => {
          const acoesSubordinado = acoesPorUsuario[subordinado.id] || [];
          const totalAcoes = acoesSubordinado.length;
          const acoesConcluidas = acoesSubordinado.filter(acao => acao.situacao === "concluido").length;
          
          return (
            <div key={subordinado.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="font-medium">{subordinado.name}</p>
                <p className="text-sm text-gray-500">Funcional: {subordinado.funcional}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs ${
                  totalAcoes === 0 ? 'bg-gray-100 text-gray-600' :
                  acoesConcluidas === totalAcoes ? 'bg-green-100 text-green-700' :
                  acoesConcluidas > 0 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {acoesConcluidas}/{totalAcoes} Respondidas
                </div>
              </div>
            </div>
          );
        })}
        
        {subordinates.length === 0 && (
          <p className="text-center text-gray-500 py-3">Nenhum subordinado encontrado</p>
        )}
      </div>
    </div>
  );
};

// Formulário para responder a uma ação diária
const FormularioResposta: React.FC<{ 
  acao: AcaoDiariaContas; 
  onClose: () => void;
  onSave: () => void;
}> = ({ acao, onClose, onSave }) => {
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!observacoes.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha as observações",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await acaoDiariaApi.atualizarAcaoDiaria(acao.id, {
        situacao: "concluido",
        observacoes,
        dataConclusao: new Date()
      });
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Ação concluída com sucesso!",
        });
        onSave();
        onClose();
      } else {
        toast({
          title: "Erro",
          description: result.message || "Falha ao concluir ação",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar sua resposta",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações / Ação Realizada</Label>
        <Textarea 
          id="observacoes" 
          value={observacoes} 
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Descreva a ação realizada ou observações..."
          rows={5}
          required
        />
      </div>
      
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Concluir Ação"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Componente principal dos cards de Ação Diária
const CardsAcaoDiariaContas: React.FC = () => {
  const navigate = useNavigate();
  const [acoesDiarias, setAcoesDiarias] = useState<AcaoDiariaContas[]>([]);
  const [acoesDiariasEquipe, setAcoesDiariasEquipe] = useState<AcaoDiariaContas[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalEquipeOpen, setModalEquipeOpen] = useState(false);
  const [acaoSelecionada, setAcaoSelecionada] = useState<AcaoDiariaContas | null>(null);
  
  const { user, isManager, isCoordinator } = useAuth();
  
  useEffect(() => {
    fetchAcoesDiarias();
  }, []);
  
  const fetchAcoesDiarias = async () => {
    setLoading(true);
    try {
      // Buscar ações do usuário atual
      const acoes = await acaoDiariaApi.getAcoesDiarias();
      setAcoesDiarias(acoes);
      
      // Se for gerente ou coordenador, buscar ações da equipe
      if (isManager) {
        const acoesEquipe = await acaoDiariaApi.getAcoesDiariasEquipe();
        setAcoesDiariasEquipe(acoesEquipe);
      }
    } catch (error) {
      console.error("Erro ao buscar ações diárias:", error);
      toast({
        title: "Usando dados simulados",
        description: "Não foi possível se conectar à API. Usando dados simulados para demonstração.",
        variant: "default",
      });
      
      // Dados simulados para demonstração
      const acoesMock: AcaoDiariaContas[] = [
        {
          id: "1",
          chaveLoja: "5001",
          nomeLoja: "Loja Centro",
          telefone: "(11) 3456-7890",
          contato: "João Silva",
          userId: user?.id || "1",
          qtdContasPlataforma: 2,
          qtdContasLegado: 5,
          qtdTotalMes: 12,
          qtdPlataformaMes: 4,
          qtdLegadoMes: 8,
          agencia: "0001",
          situacao: "pendente",
          descricaoSituacao: "5 contas abertas no sistema legado precisam ser migradas",
          dataLimite: new Date(Date.now() + 86400000 * 3),
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          prioridade: "alta",
          tipoAcao: "Migração de Contas",
          endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP"
        }
      ];
      
      // Utilizar os dados simulados
      setAcoesDiarias(acoesMock);
      
      if (isManager) {
        const acoesEquipeMock: AcaoDiariaContas[] = [
          {
            id: "2",
            chaveLoja: "5002",
            nomeLoja: "Loja Shopping Vila Olímpia",
            telefone: "(11) 3456-7891",
            contato: "Maria Santos",
            userId: "2",
            nomeUsuario: "Ana Silva",
            qtdContasPlataforma: 8,
            qtdContasLegado: 0,
            agencia: "0002",
            situacao: "em_andamento",
            descricaoSituacao: "Regularização de documentação pendente",
            dataLimite: new Date(Date.now() + 86400000 * 5),
            dataCriacao: new Date(),
            dataAtualizacao: new Date(),
            prioridade: "media",
            tipoAcao: "Regularização",
            endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP"
          }
        ];
        
        setAcoesDiariasEquipe(acoesEquipeMock);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleIniciarTratativa = (acao: AcaoDiariaContas) => {
    setAcaoSelecionada(acao);
    setDialogOpen(true);
  };
  
  const handleVerEquipe = () => {
    setModalEquipeOpen(true);
  };
  
  const navegarPara = (caminho: string) => {
    navigate(caminho);
  };
  
  // Função de formatação de data
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", {locale: ptBR});
  };
  
  if (loading) {
    return (
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-indigo-800">Ação Diária</CardTitle>
              <CardDescription>Correspondentes que necessitam atenção</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-indigo-600">Carregando ações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (acoesDiarias.length === 0) {
    return (
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-indigo-800">Ação Diária</CardTitle>
              <CardDescription>Correspondentes que necessitam atenção</CardDescription>
            </div>
            {isManager && (
              <Button 
                variant="ghost" 
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                onClick={handleVerEquipe}
              >
                Ver Equipe <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-6 px-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-indigo-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma ação diária pendente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Se tiver ações pendentes, exibir a primeira
  const acaoPrincipal = acoesDiarias[0];
  
  // Calcular totais
  const totalContas = acaoPrincipal.qtdContasLegado + acaoPrincipal.qtdContasPlataforma;
  const percentualPlataforma = totalContas > 0 
    ? Math.round((acaoPrincipal.qtdContasPlataforma / totalContas) * 100) 
    : 0;
  
  // Verificar se temos dados do mês
  const temDadosMes = 
    typeof acaoPrincipal.qtdTotalMes !== 'undefined' &&
    typeof acaoPrincipal.qtdPlataformaMes !== 'undefined' &&
    typeof acaoPrincipal.qtdLegadoMes !== 'undefined';
    
  // Calcular percentual do mês se tiver dados
  const percentualPlataformaMes = temDadosMes && acaoPrincipal.qtdTotalMes > 0
    ? Math.round((acaoPrincipal.qtdPlataformaMes / acaoPrincipal.qtdTotalMes) * 100)
    : 0;
  
  return (
    <>
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-indigo-800">Ação Diária</CardTitle>
              <CardDescription>Correspondentes que necessitam atenção</CardDescription>
            </div>
            {isManager && (
              <Button 
                variant="ghost" 
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                onClick={handleVerEquipe}
              >
                Ver Equipe <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-indigo-100">
            {/* Informações principais da loja */}
            <div className="mb-3">
              <h4 className="font-semibold text-lg mb-1">{acaoPrincipal.nomeLoja}</h4>
              <p className="text-gray-600">Chave: {acaoPrincipal.chaveLoja} - Ag: {acaoPrincipal.agencia}</p>
              <p className="text-gray-600">
                Telefone: {acaoPrincipal.telefone} ({acaoPrincipal.contato})
              </p>
            </div>
            
            {/* Totais de contas */}
            <div className="bg-gray-50 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 w-full">
                <div className="text-center p-2 bg-indigo-50 rounded-lg flex-1">
                  <p className="text-xs uppercase text-gray-500 font-medium">Total Contas</p>
                  <p className="text-xl font-bold text-indigo-700">{totalContas}</p>
                  {temDadosMes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mês: <span className="font-medium">{acaoPrincipal.qtdTotalMes}</span>
                    </p>
                  )}
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg flex-1">
                  <p className="text-xs uppercase text-gray-500 font-medium">Legado</p>
                  <p className="text-xl font-bold text-amber-700">{acaoPrincipal.qtdContasLegado}</p>
                  {temDadosMes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mês: <span className="font-medium">{acaoPrincipal.qtdLegadoMes}</span>
                    </p>
                  )}
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg flex-1">
                  <p className="text-xs uppercase text-gray-500 font-medium">Plataforma</p>
                  <p className="text-xl font-bold text-green-700">{acaoPrincipal.qtdContasPlataforma}</p>
                  {temDadosMes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mês: <span className="font-medium">{acaoPrincipal.qtdPlataformaMes}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center">
                <div className="relative h-20 w-20 rounded-full flex items-center justify-center bg-gray-100">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent 
                                border-t-green-500 border-r-green-500"
                       style={{ 
                         clipPath: `polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%)`, 
                         transform: `rotate(${percentualPlataforma * 3.6}deg)` 
                       }}>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent 
                                border-b-amber-500 border-l-amber-500"
                       style={{ 
                         clipPath: `polygon(0 0, 50% 0, 50% 100%, 0 100%)`, 
                         transform: `rotate(${percentualPlataforma * 3.6}deg)` 
                       }}>
                  </div>
                  <span className="text-lg font-bold">{percentualPlataforma}%</span>
                </div>
              </div>
            </div>
            
            {/* Compare mês corrente com mês anterior de forma minimalista */}
            {temDadosMes && (
              <div className="mt-3 flex items-center justify-between p-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Comparativo Mensal:</span> 
                  <span className="ml-1">{acaoPrincipal.qtdTotalMes} contas no mês</span>
                  <span className="inline-block mx-1">•</span>
                  <span className={percentualPlataformaMes > percentualPlataforma ? "text-green-600" : 
                           percentualPlataformaMes < percentualPlataforma ? "text-amber-600" : ""}>
                    {percentualPlataformaMes}% na plataforma
                  </span>
                </div>
                <div className="flex items-center">
                  {percentualPlataformaMes > percentualPlataforma ? (
                    <ArrowRight className="h-3 w-3 text-green-600 transform rotate-45" />
                  ) : percentualPlataformaMes < percentualPlataforma ? (
                    <ArrowRight className="h-3 w-3 text-amber-600 transform rotate-135" /> 
                  ) : (
                    <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              acaoPrincipal.situacao === "pendente" 
                ? "bg-amber-100 text-amber-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {acaoPrincipal.situacao === "pendente" ? "Pendente" : "Em Tratamento"}
            </div>
            
            {acaoPrincipal.dataLimite && (
              <div className="text-sm text-gray-600">
                Limite: {formatDate(acaoPrincipal.dataLimite)}
              </div>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => handleIniciarTratativa(acaoPrincipal)}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {acaoPrincipal.situacao === "pendente" ? "Iniciar Tratativa" : "Continuar"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog para responder uma ação diária */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Responder Ação Diária</DialogTitle>
          </DialogHeader>
          
          {acaoSelecionada && (
            <div className="py-4">
              <div className="mb-4 bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm font-medium">{acaoSelecionada.nomeLoja}</p>
                <p className="text-sm">Chave: {acaoSelecionada.chaveLoja} - Ag: {acaoSelecionada.agencia}</p>
                <p className="text-sm mt-2">
                  Total: {acaoSelecionada.qtdContasLegado + acaoSelecionada.qtdContasPlataforma} contas
                  <span className="mx-1">|</span>
                  Legado: {acaoSelecionada.qtdContasLegado}
                  <span className="mx-1">|</span>
                  Plataforma: {acaoSelecionada.qtdContasPlataforma}
                </p>
              </div>
              
              <FormularioResposta 
                acao={acaoSelecionada} 
                onClose={() => setDialogOpen(false)}
                onSave={fetchAcoesDiarias}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para visualizar demonstrativo da equipe */}
      <Dialog open={modalEquipeOpen} onOpenChange={setModalEquipeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Demonstrativo da Equipe</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <EquipeAcoesDiarias acoesDiarias={acoesDiariasEquipe} />
          </div>
          
          <DialogFooter>
            <Button onClick={() => setModalEquipeOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CardsAcaoDiariaContas; 