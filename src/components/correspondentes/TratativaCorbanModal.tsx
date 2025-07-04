import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  User, 
  Building2, 
  MessageSquarePlus,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Correspondente {
  id: string;
  CHAVE_LOJA: string;
  CNPJ: string;
  NOME: string;
  nr_pacb: string;
  diretoria?: string;
  gerencia?: string;
  agencia?: string;
  pa?: string;
  status?: 'ativo' | 'inativo';
}

interface TratativaCorbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correspondente: Correspondente;
}

interface TratativaFormData {
  data_visita: Date;
  tipo_contato: string;
  objetivo_visita: string;
  status_correspondente: string;
  volume_estimado: string;
  produtos_interesse: string[];
  observacoes: string;
  proximos_passos: string;
  data_proximo_contato: Date | null;
  resultado: string;
}

export function TratativaCorbanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  correspondente 
}: TratativaCorbanModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TratativaFormData>({
    data_visita: new Date(),
    tipo_contato: '',
    objetivo_visita: '',
    status_correspondente: '',
    volume_estimado: '',
    produtos_interesse: [],
    observacoes: '',
    proximos_passos: '',
    data_proximo_contato: null,
    resultado: ''
  });

  const tiposContato = [
    { value: 'visita_presencial', label: 'Visita Presencial' },
    { value: 'videochamada', label: 'Videochamada' },
    { value: 'ligacao', label: 'Ligação Telefônica' },
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];

  const objetivosVisita = [
    { value: 'prospeccao', label: 'Prospecção Inicial' },
    { value: 'apresentacao_produtos', label: 'Apresentação de Produtos' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'acompanhamento', label: 'Acompanhamento' },
    { value: 'suporte_tecnico', label: 'Suporte Técnico' },
    { value: 'treinamento', label: 'Treinamento' },
    { value: 'relacionamento', label: 'Relacionamento' }
  ];

  const statusCorrespondente = [
    { value: 'muito_interessado', label: 'Muito Interessado' },
    { value: 'interessado', label: 'Interessado' },
    { value: 'neutro', label: 'Neutro' },
    { value: 'resistente', label: 'Resistente' },
    { value: 'sem_interesse', label: 'Sem Interesse' }
  ];

  const produtosBancarios = [
    { value: 'conta_corrente', label: 'Conta Corrente' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'emprestimo_pessoal', label: 'Empréstimo Pessoal' },
    { value: 'financiamento', label: 'Financiamento' },
    { value: 'consorcio', label: 'Consórcio' },
    { value: 'investimentos', label: 'Investimentos' },
    { value: 'seguros', label: 'Seguros' },
    { value: 'previdencia', label: 'Previdência' }
  ];

  const resultadoTratativa = [
    { value: 'muito_positivo', label: 'Muito Positivo', color: 'text-green-600' },
    { value: 'positivo', label: 'Positivo', color: 'text-green-500' },
    { value: 'neutro', label: 'Neutro', color: 'text-yellow-600' },
    { value: 'negativo', label: 'Negativo', color: 'text-red-500' },
    { value: 'muito_negativo', label: 'Muito Negativo', color: 'text-red-600' }
  ];

  const handleProdutoToggle = (produto: string) => {
    setFormData(prev => ({
      ...prev,
      produtos_interesse: prev.produtos_interesse.includes(produto)
        ? prev.produtos_interesse.filter(p => p !== produto)
        : [...prev.produtos_interesse, produto]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Aqui seria feita a chamada para a API
      console.log('Dados da tratativa:', formData);
      
      // Simulação de API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Sucesso!',
        description: 'Tratativa registrada com sucesso',
        variant: 'default',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tratativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a tratativa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'muito_positivo':
      case 'positivo':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'neutro':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'negativo':
      case 'muito_negativo':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <MessageSquarePlus className="h-6 w-6 text-blue-600" />
            </div>
            Nova Tratativa com Correspondente
          </DialogTitle>
          
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-semibold text-gray-800">Correspondente:</span> {correspondente.NOME}</p>
              <p><span className="font-semibold text-gray-800">CNPJ:</span> {correspondente.CNPJ}</p>
              <p><span className="font-semibold text-gray-800">Chave Loja:</span> {correspondente.CHAVE_LOJA}</p>
              <p><span className="font-semibold text-gray-800">Nr PACB:</span> {correspondente.nr_pacb}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Seção 1: Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                Informações da Tratativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_visita">Data da Visita/Contato *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !formData.data_visita && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_visita ? format(formData.data_visita, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_visita}
                        onSelect={(date) => setFormData(prev => ({ ...prev, data_visita: date || new Date() }))}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="tipo_contato">Tipo de Contato *</Label>
                  <Select 
                    value={formData.tipo_contato} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_contato: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o tipo de contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposContato.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="objetivo_visita">Objetivo da Visita *</Label>
                  <Select 
                    value={formData.objetivo_visita} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, objetivo_visita: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {objetivosVisita.map((objetivo) => (
                        <SelectItem key={objetivo.value} value={objetivo.value}>
                          {objetivo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="volume_estimado">Volume Estimado (R$)</Label>
                  <Input
                    id="volume_estimado"
                    type="text"
                    placeholder="Ex: 100.000"
                    value={formData.volume_estimado}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume_estimado: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Produtos de Interesse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Produtos de Interesse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {produtosBancarios.map((produto) => (
                  <div
                    key={produto.value}
                    className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                      formData.produtos_interesse.includes(produto.value)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                    onClick={() => handleProdutoToggle(produto.value)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.produtos_interesse.includes(produto.value)}
                      onChange={() => handleProdutoToggle(produto.value)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{produto.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Avaliação e Resultado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Avaliação e Resultado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status do Correspondente *</Label>
                <RadioGroup 
                  value={formData.status_correspondente} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status_correspondente: value }))}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2"
                >
                  {statusCorrespondente.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={status.value} id={status.value} />
                      <Label htmlFor={status.value} className="cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Resultado da Tratativa *</Label>
                <RadioGroup 
                  value={formData.resultado} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, resultado: value }))}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"
                >
                  {resultadoTratativa.map((resultado) => (
                    <div key={resultado.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={resultado.value} id={resultado.value} />
                      <Label htmlFor={resultado.value} className={cn("cursor-pointer flex items-center gap-2", resultado.color)}>
                        {getStatusIcon(resultado.value)}
                        {resultado.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Seção 4: Observações e Próximos Passos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Observações e Acompanhamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="observacoes">Observações da Visita</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Descreva os principais pontos discutidos, reações do correspondente, informações relevantes..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="proximos_passos">Próximos Passos</Label>
                <Textarea
                  id="proximos_passos"
                  placeholder="Defina as ações que serão tomadas após esta visita..."
                  value={formData.proximos_passos}
                  onChange={(e) => setFormData(prev => ({ ...prev, proximos_passos: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="data_proximo_contato">Data do Próximo Contato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !formData.data_proximo_contato && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.data_proximo_contato 
                        ? format(formData.data_proximo_contato, "dd/MM/yyyy", { locale: ptBR }) 
                        : "Selecione a data (opcional)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.data_proximo_contato || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, data_proximo_contato: date || null }))}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="border-t border-gray-100 pt-4 mt-8">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !formData.data_visita || !formData.tipo_contato || !formData.objetivo_visita || !formData.status_correspondente || !formData.resultado}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              'Salvar Tratativa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 