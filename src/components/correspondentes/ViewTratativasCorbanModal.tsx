import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  Plus, 
  Building2,
  MessageSquare,
  TrendingUp,
  Eye,
  Phone,
  Video,
  Mail,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TratativaCorbanModal } from './TratativaCorbanModal';
import { cn } from '@/lib/utils';
import { 
  Correspondente, 
  TratativaCorban,
  TIPOS_CONTATO,
  OBJETIVOS_VISITA,
  STATUS_CORRESPONDENTE,
  RESULTADO_TRATATIVA,
  PRODUTOS_BANCARIOS
} from '@/shared/types/correspondente';

interface ViewTratativasCorbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correspondente: Correspondente;
}

export function ViewTratativasCorbanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  correspondente 
}: ViewTratativasCorbanModalProps) {
  const [tratativas, setTrativas] = useState<TratativaCorban[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Dados mock para desenvolvimento
  const mockTratativas: TratativaCorban[] = [
    {
      id: '1',
      correspondente_id: correspondente.id,
      data_visita: '2024-01-15',
      tipo_contato: 'visita_presencial',
      objetivo_visita: 'prospeccao',
      status_correspondente: 'muito_interessado',
      volume_estimado: '150000',
      produtos_interesse: ['conta_corrente', 'cartao_credito', 'emprestimo_pessoal'],
      observacoes: 'Correspondente muito receptivo. Demonstrou interesse em ampliar carteira de produtos. Mencionou dificuldades com banco atual.',
      proximos_passos: 'Enviar proposta formal com condições especiais. Agendar nova reunião para apresentação detalhada dos produtos.',
      data_proximo_contato: '2024-02-01',
      resultado: 'muito_positivo',
      user_id: 'user1',
      user_name: 'João Silva',
      created_at: '2024-01-15T09:30:00Z',
      updated_at: '2024-01-15T09:30:00Z'
    },
    {
      id: '2',
      correspondente_id: correspondente.id,
      data_visita: '2024-01-10',
      tipo_contato: 'videochamada',
      objetivo_visita: 'apresentacao_produtos',
      status_correspondente: 'interessado',
      volume_estimado: '80000',
      produtos_interesse: ['investimentos', 'seguros'],
      observacoes: 'Apresentação dos produtos de investimento. Cliente interessado mas quer analisar melhor as taxas.',
      proximos_passos: 'Enviar tabela comparativa de taxas e rendimentos.',
      data_proximo_contato: '2024-01-25',
      resultado: 'positivo',
      user_id: 'user2',
      user_name: 'Maria Santos',
      created_at: '2024-01-10T14:15:00Z',
      updated_at: '2024-01-10T14:15:00Z'
    }
  ];

  const fetchTratativas = async () => {
    if (!correspondente.id) return;
    
    setIsLoading(true);
    try {
      // Simula carregamento da API
      setTimeout(() => {
        setTrativas(mockTratativas);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao carregar tratativas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de tratativas',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTratativas();
    }
  }, [isOpen, correspondente.id]);

  const handleAddTratativa = () => {
    setEditModalOpen(true);
  };

  const handleTratativaSuccess = () => {
    fetchTratativas(); // Recarrega a lista de tratativas
    onSuccess(); // Atualiza a tabela principal
  };

  const getTipoContatoIcon = (tipo: string) => {
    switch (tipo) {
      case 'visita_presencial':
        return <Building2 className="h-4 w-4" />;
      case 'videochamada':
        return <Video className="h-4 w-4" />;
      case 'ligacao':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTipoContatoLabel = (tipo: string) => {
    const item = TIPOS_CONTATO.find(t => t.value === tipo);
    return item?.label || tipo;
  };

  const getObjetivoLabel = (objetivo: string) => {
    const item = OBJETIVOS_VISITA.find(o => o.value === objetivo);
    return item?.label || objetivo;
  };

  const getStatusLabel = (status: string) => {
    const item = STATUS_CORRESPONDENTE.find(s => s.value === status);
    return item?.label || status;
  };

  const getResultadoLabel = (resultado: string) => {
    const item = RESULTADO_TRATATIVA.find(r => r.value === resultado);
    return item?.label || resultado;
  };

  const getResultadoColor = (resultado: string) => {
    const item = RESULTADO_TRATATIVA.find(r => r.value === resultado);
    return item?.color || 'text-gray-600';
  };

  const getProdutosLabels = (produtos: string[]) => {
    return produtos.map(produto => {
      const item = PRODUTOS_BANCARIOS.find(p => p.value === produto);
      return item?.label || produto;
    });
  };

  const formatCurrency = (value?: string) => {
    if (!value) return 'N/A';
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(
          "sm:max-w-[900px]",
          tratativas.length > 0 ? "max-h-[85vh] overflow-y-auto" : "overflow-visible"
        )}>
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Histórico de Tratativas - Correspondente
            </DialogTitle>
            
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="space-y-1">
                  <p><span className="font-semibold text-gray-800">Correspondente:</span> {correspondente.NOME}</p>
                  <p><span className="font-semibold text-gray-800">CNPJ:</span> {correspondente.CNPJ}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="font-semibold text-gray-800">Chave Loja:</span> {correspondente.CHAVE_LOJA}</p>
                  <p><span className="font-semibold text-gray-800">Nr PACB:</span> {correspondente.nr_pacb}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-gray-500">Carregando tratativas...</p>
                </div>
              </div>
            ) : tratativas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-20 h-20 -z-10"></div>
                  <div className="flex items-center justify-center w-20 h-20">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma Tratativa Registrada
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Este correspondente ainda não possui tratativas registradas.
                    <br />
                    <span className="text-sm text-gray-500">
                      Inicie o acompanhamento registrando a primeira tratativa.
                    </span>
                  </p>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={handleAddTratativa} 
                      size="default"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar primeira tratativa
                    </Button>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Registre visitas, ligações e negociações para manter o histórico atualizado
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {tratativas.length} tratativa{tratativas.length !== 1 ? 's' : ''} registrada{tratativas.length !== 1 ? 's' : ''}
                  </h3>
                  <Button onClick={handleAddTratativa} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova tratativa
                  </Button>
                </div>

                <div className="space-y-4">
                  {tratativas.map((tratativa, index) => (
                    <Card key={tratativa.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getTipoContatoIcon(tratativa.tipo_contato)}
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {getTipoContatoLabel(tratativa.tipo_contato)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="h-4 w-4" />
                              {tratativa.user_name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {format(new Date(tratativa.data_visita), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                          
                          <Badge className={cn("font-medium", getResultadoColor(tratativa.resultado))}>
                            {getResultadoLabel(tratativa.resultado)}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3 text-gray-900 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Informações da Tratativa
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Objetivo:</span>
                                <Badge variant="outline" className="ml-2">
                                  {getObjetivoLabel(tratativa.objetivo_visita)}
                                </Badge>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Status do correspondente:</span>
                                <Badge variant="outline" className="ml-2">
                                  {getStatusLabel(tratativa.status_correspondente)}
                                </Badge>
                              </div>
                              {tratativa.volume_estimado && (
                                <div>
                                  <span className="font-medium text-gray-700">Volume estimado:</span>
                                  <span className="ml-2 font-mono text-green-600">
                                    {formatCurrency(tratativa.volume_estimado)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3 text-gray-900 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Produtos de Interesse
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {getProdutosLabels(tratativa.produtos_interesse).map((produto, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {produto}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {tratativa.observacoes && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 text-gray-900">Observações</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 leading-relaxed">
                              {tratativa.observacoes}
                            </p>
                          </div>
                        )}

                        {tratativa.proximos_passos && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 text-gray-900">Próximos Passos</h4>
                            <p className="text-sm text-gray-600 bg-blue-50 rounded p-3 leading-relaxed">
                              {tratativa.proximos_passos}
                            </p>
                          </div>
                        )}

                        {tratativa.data_proximo_contato && (
                          <div className="mt-4 flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-700">Próximo contato:</span>
                            <span className="text-blue-600 font-medium">
                              {format(new Date(tratativa.data_proximo_contato), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-gray-100 pt-4 mt-8">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2 hover:bg-gray-50"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar nova tratativa */}
      {editModalOpen && (
        <TratativaCorbanModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleTratativaSuccess}
          correspondente={correspondente}
        />
      )}
    </>
  );
} 