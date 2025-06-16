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

const tratativaSchema = z.object({
  descricao: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres').nonempty('A descrição é obrigatória'),
  situacao: z.enum(['realizada', 'pendente'], {
    required_error: 'A situação é obrigatória',
  }),
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
      descricao: '',
      situacao: 'realizada',
    },
  });

  const onSubmit = async (data: TratativaFormData) => {
    try {
      await hotListApi.registrarTratativa({
        hotlist_id: hotlistItem.id,
        descricao: data.descricao,
        situacao: data.situacao,
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
      <DialogContent className="sm:max-w-[500px]">
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
              name="situacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação da Tratativa</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="realizada" id="realizada" />
                        <label htmlFor="realizada" className="text-sm font-medium">
                          Realizada
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pendente" id="pendente" />
                        <label htmlFor="pendente" className="text-sm font-medium">
                          Pendente
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
              name="descricao"
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