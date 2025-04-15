import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, AlertTriangle } from "lucide-react";
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
        title: "Erro",
        description: "Não foi possível carregar as ações diárias",
        variant: "destructive",
      });
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
  
  // Função de formatação de data
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", {locale: ptBR});
  };
  
  if (loading) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-blue-800">Ação Diária</CardTitle>
              <p className="text-sm text-blue-600 mt-1">Carregando...</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-pulse h-4 w-3/4 bg-blue-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (acoesDiarias.length === 0) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-blue-800">Ação Diária</CardTitle>
              <p className="text-sm text-blue-600 mt-1">Correspondentes que necessitam atenção</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-6 px-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-blue-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma ação diária pendente</p>
            </div>
          </div>
          
          {/* Botão para mostrar equipe (apenas para gerentes/coordenadores) */}
          {isManager && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={handleVerEquipe}
              >
                <FileText className="mr-2 h-4 w-4" />
                Demonstrativo da Equipe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Se tiver ações pendentes, exibir a primeira
  const acaoPrincipal = acoesDiarias[0];
  
  return (
    <>
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-blue-800">Ação Diária</CardTitle>
              <p className="text-sm text-blue-600 mt-1">Loja que necessita atenção hoje</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {acaoPrincipal.prioridade === "alta" ? "Prioridade Alta" : 
               acaoPrincipal.prioridade === "media" ? "Prioridade Média" : "Hoje"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-800">{acaoPrincipal.nomeLoja}</h4>
                <p className="text-sm text-gray-600">Chave: {acaoPrincipal.chaveLoja} - Ag: {acaoPrincipal.agencia}</p>
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                {acaoPrincipal.situacao === "pendente" ? "Pendente" : 
                 acaoPrincipal.situacao === "em_andamento" ? "Em Andamento" : "Concluído"}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Contas Legado:</span> {acaoPrincipal.qtdContasLegado}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Contas Plataforma:</span> {acaoPrincipal.qtdContasPlataforma}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Contato:</span> {acaoPrincipal.contato}
              </p>
              {acaoPrincipal.dataLimite && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Data Limite:</span> {formatDate(acaoPrincipal.dataLimite)}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-between">
            {isManager && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={handleVerEquipe}
              >
                <FileText className="mr-2 h-4 w-4" />
                Demonstrativo da Equipe
              </Button>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 ml-auto"
              onClick={() => handleIniciarTratativa(acaoPrincipal)}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Iniciar Tratativa
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
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Loja: {acaoSelecionada.nomeLoja}</p>
                <p className="text-sm">Chave: {acaoSelecionada.chaveLoja}</p>
                <p className="text-sm">
                  Contas Legado: {acaoSelecionada.qtdContasLegado} | 
                  Contas Plataforma: {acaoSelecionada.qtdContasPlataforma}
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