import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { hotListApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const tratativaSchema = z.object({
  data_visita: z.date({
    required_error: "A data da visita é obrigatória",
  }),
  tem_perfil_comercial: z.enum(['sim', 'nao'], {
    required_error: "Informe se tem perfil comercial",
  }),
  motivo_sem_perfil: z.string().optional().nullable(),
  aceitou_proposta: z.enum(['sim', 'nao']).optional().nullable(),
  motivo_nao_efetivacao: z.string().optional().nullable(),
}).refine((data) => {
  // Se não tem perfil comercial, motivo_sem_perfil é obrigatório
  if (data.tem_perfil_comercial === 'nao' && !data.motivo_sem_perfil) {
    return false;
  }
  // Se tem perfil comercial, aceitou_proposta é obrigatório
  if (data.tem_perfil_comercial === 'sim' && !data.aceitou_proposta) {
    return false;
  }
  // Se não aceitou proposta, motivo_nao_efetivacao é obrigatório
  if (data.aceitou_proposta === 'nao' && !data.motivo_nao_efetivacao) {
    return false;
  }
  return true;
}, {
  message: "Preencha todos os campos obrigatórios",
  path: ["motivo_sem_perfil"]
});

type TratativaFormData = z.infer<typeof tratativaSchema>;

interface TratativaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hotlistItem: {
    id: string;
    CNPJ: string;
    NOME_LOJA: string;
  };
}

export function TratativaModal({ isOpen, onClose, onSuccess, hotlistItem }: TratativaModalProps) {
  const form = useForm<TratativaFormData>({
    resolver: zodResolver(tratativaSchema),
    defaultValues: {
      data_visita: new Date(),
      tem_perfil_comercial: undefined,
      motivo_sem_perfil: null,
      aceitou_proposta: null,
      motivo_nao_efetivacao: null,
    },
  });

  const temPerfilComercial = form.watch('tem_perfil_comercial');
  const aceitouProposta = form.watch('aceitou_proposta');

  const onSubmit = async (data: TratativaFormData) => {
    try {
      await hotListApi.registrarTratativa({
        hotlist_id: hotlistItem.id,
        ...data,
        situacao: data.tem_perfil_comercial === 'sim' && data.aceitou_proposta === 'sim' ? 'realizada' : 'pendente'
      });

      toast({
        title: 'Sucesso',
        description: 'Tratativa registrada com sucesso',
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Erro ao registrar tratativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a tratativa',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Tratativa</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="text-sm text-gray-500">
            <p><span className="font-medium">CNPJ:</span> {hotlistItem.CNPJ}</p>
            <p><span className="font-medium">Estabelecimento:</span> {hotlistItem.NOME_LOJA}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="data_visita"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Visita</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tem_perfil_comercial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tem perfil comercial para ser correspondente?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="tem-perfil-sim" />
                        <label htmlFor="tem-perfil-sim" className="text-sm font-medium">
                          Sim
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="tem-perfil-nao" />
                        <label htmlFor="tem-perfil-nao" className="text-sm font-medium">
                          Não
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {temPerfilComercial === 'nao' && (
              <FormField
                control={form.control}
                name="motivo_sem_perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Por que não tem perfil comercial?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o motivo..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {temPerfilComercial === 'sim' && (
              <FormField
                control={form.control}
                name="aceitou_proposta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente aceitou proposta?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="aceitou-sim" />
                          <label htmlFor="aceitou-sim" className="text-sm font-medium">
                            Sim
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="aceitou-nao" />
                          <label htmlFor="aceitou-nao" className="text-sm font-medium">
                            Não
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {temPerfilComercial === 'sim' && aceitouProposta === 'nao' && (
              <FormField
                control={form.control}
                name="motivo_nao_efetivacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual o motivo da não efetivação?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o motivo..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Tratativa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 