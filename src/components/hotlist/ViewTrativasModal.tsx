import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { hotListApi, Tratativa } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Calendar, User, Clock, FileText, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TratativaModal } from './TratativaModal';

interface ViewTrativasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hotlistItem: {
    id: string;
    CNPJ: string;
    NOME_LOJA: string;
  };
}

export function ViewTrativasModal({ isOpen, onClose, onSuccess, hotlistItem }: ViewTrativasModalProps) {
  const [tratativas, setTrativas] = useState<Tratativa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchTratativas = async () => {
    if (!hotlistItem.id) return;
    
    setIsLoading(true);
    try {
      const data = await hotListApi.getTratativas(hotlistItem.id);
      setTrativas(data);
    } catch (error) {
      console.error('Erro ao carregar tratativas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de tratativas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTratativas();
    }
  }, [isOpen, hotlistItem.id]);

  const handleAddTratativa = () => {
    setEditModalOpen(true);
  };

  const handleTratativaSuccess = () => {
    fetchTratativas(); // Recarrega a lista de tratativas
    onSuccess(); // Atualiza a tabela principal
  };

  const getPerfilLabel = (perfil: number) => {
    return perfil === 1 ? 'Sim' : 'Não';
  };

  const getPropostaLabel = (proposta: number | null) => {
    if (proposta === null) return 'N/A';
    return proposta === 1 ? 'Sim' : 'Não';
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'tratada':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Histórico de Tratativas
            </DialogTitle>
            
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold text-gray-800">CNPJ:</span> {hotlistItem.CNPJ}</p>
                <p><span className="font-semibold text-gray-800">Estabelecimento:</span> {hotlistItem.NOME_LOJA}</p>
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
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="relative mb-6">
                  {/* Círculo de fundo decorativo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-24 h-24 -z-10"></div>
                  <div className="flex items-center justify-center w-24 h-24">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                </div>
                
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Histórico em Branco
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Este lead ainda não possui tratativas registradas. 
                    <br />
                    <span className="text-sm text-gray-500">
                      Adicione a primeira tratativa para começar o acompanhamento.
                    </span>
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleAddTratativa} 
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Adicionar primeira tratativa
                    </Button>
                    
                    <p className="text-xs text-gray-400 mt-3">
                      💡 Registre visitas, contatos e resultados para manter o histórico atualizado
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
                          <div className="flex items-center gap-3">
                            <Badge className={getSituacaoColor(tratativa.situacao)}>
                              {tratativa.situacao === 'tratada' ? 'Tratada' : 'Pendente'}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="h-4 w-4" />
                              {tratativa.user_name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {format(new Date(tratativa.data_tratativa), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 text-gray-900">Informações da Visita</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">Data da visita:</span>
                                <span>{format(new Date(tratativa.data_visita), 'dd/MM/yyyy', { locale: ptBR })}</span>
                              </div>
                              <div>
                                <span className="font-medium">Tem perfil comercial:</span>
                                <Badge variant="outline" className="ml-2">
                                  {getPerfilLabel(tratativa.tem_perfil_comercial)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 text-gray-900">Resultado</h4>
                            <div className="space-y-2 text-sm">
                              {tratativa.tem_perfil_comercial === 1 && (
                                <div>
                                  <span className="font-medium">Aceitou proposta:</span>
                                  <Badge variant="outline" className="ml-2">
                                    {getPropostaLabel(tratativa.aceitou_proposta)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {(tratativa.motivo_sem_perfil || tratativa.motivo_nao_efetivacao) && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 text-gray-900">Observações</h4>
                            {tratativa.motivo_sem_perfil && (
                              <div className="mb-2">
                                <span className="font-medium text-sm">Motivo sem perfil comercial:</span>
                                <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">{tratativa.motivo_sem_perfil}</p>
                              </div>
                            )}
                            {tratativa.motivo_nao_efetivacao && (
                              <div>
                                <span className="font-medium text-sm">Motivo da não efetivação:</span>
                                <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">{tratativa.motivo_nao_efetivacao}</p>
                              </div>
                            )}
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
        <TratativaModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleTratativaSuccess}
          hotlistItem={hotlistItem}
        />
      )}
    </>
  );
} 