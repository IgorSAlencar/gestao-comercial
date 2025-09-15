import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { hotListApi, TratativaPontosAtivosRequest } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const tratativaSchema = z.object({
  data_contato: z.date({
    required_error: "A data do contato é obrigatória",
  }),
  foi_tratado: z.enum(['sim', 'nao'], {
    required_error: "Informe se foi tratado",
  }),
  descricao_tratativa: z.string().min(1, "A descrição da tratativa é obrigatória"),
  quando_volta_operar: z.date({
    required_error: "A data de quando volta a operar é obrigatória",
  }),
});

type TratativaFormData = z.infer<typeof tratativaSchema>;

interface TratativaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pontoAtivo: {
    chaveLoja: string;
    nomeLoja: string;
  };
}

export function TratativaModal({ isOpen, onClose, onSuccess, pontoAtivo }: TratativaModalProps) {
  const { user } = useAuth();
  
  const form = useForm<TratativaFormData>({
    resolver: zodResolver(tratativaSchema),
    defaultValues: {
      data_contato: new Date(),
      foi_tratado: undefined,
      descricao_tratativa: "",
      quando_volta_operar: undefined,
    },
  });

  const foiTratado = form.watch('foi_tratado');

  const onSubmit = async (data: TratativaFormData) => {
    try {
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado',
          variant: 'destructive',
        });
        return;
      }

      const tratativaRequest: TratativaPontosAtivosRequest = {
        chave_loja: pontoAtivo.chaveLoja,
        usuario_id: user.funcional || user.name || 'unknown',
        nome_usuario: user.name || 'Usuário não identificado',
        data_contato: data.data_contato,
        foi_tratado: data.foi_tratado,
        descricao_tratativa: data.descricao_tratativa,
        quando_volta_operar: data.quando_volta_operar,
        situacao: 'tratada' as const,
        tipo: 'pontos-ativos' as const
      };

      await hotListApi.registrarTratarivaPontosAtivos(tratativaRequest);

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
            <p><span className="font-medium">Chave da Loja:</span> {pontoAtivo.chaveLoja}</p>
            <p><span className="font-medium">Estabelecimento:</span> {pontoAtivo.nomeLoja}</p>
            <p><span className="font-medium">Usuário:</span> {user?.name || 'Não identificado'}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="data_contato"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Contato</FormLabel>
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
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const compareDate = new Date(date);
                          compareDate.setHours(0, 0, 0, 0);
                          return compareDate > today || date < new Date("1900-01-01");
                        }}
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
              name="foi_tratado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foi tratado?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="foi-tratado-sim" />
                        <label htmlFor="foi-tratado-sim" className="text-sm font-medium">
                          Sim
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="foi-tratado-nao" />
                        <label htmlFor="foi-tratado-nao" className="text-sm font-medium">
                          Não
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao_tratativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Tratativa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a tratativa realizada..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quando_volta_operar"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Quando volta a operar?</FormLabel>
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
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const compareDate = new Date(date);
                          compareDate.setHours(0, 0, 0, 0);
                          return compareDate < today || date < new Date("1900-01-01");
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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