import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { Search, Plus, CheckCircle, AlertTriangle, MoreVertical, Copy, Edit, Trash2, User, Phone, Mail, MapPin, Clock, CheckSquare, XSquare, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/utils/formatDate";

interface AcaoDiaria {
  id: string;
  COD_AG: number;
  NOME_AG: string;
  CHAVE_LOJA: string;
  NOME_LOJA: string;
  TELEFONE: string;
  CONTATO: string;
  QTD_TOTAL_MES: number;
  QTD_PLATAFORMA_MES: number;
  QTD_LEGADO_MES: number;
  QTD_CONTAS_PLATAFORMA: number;
  QTD_CONTAS_LEGADO: number;
  SITUACAO: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada';
  DATA_CONCLUSAO: Date | null;
  CONTATADO: string | null;
  MOTIVO_NAO_CONTATADO: string | null;
  MOTIVO_NAO_USO_PLATAFORMA: string | null;
  DESCRIACAO_SITUACAO: string | null;
  TRATATIVA: string | null;
  USER_ID: string;
  DATA_LIMITE: Date;
  DATA_CRIACAO: Date;
  DATA_ATUALIZACAO: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const FormSchema = z.object({
  contatado: z.string().optional(),
  motivoNaoContatado: z.string().optional(),
  motivoNaoUsoPlataforma: z.string().optional(),
  descricaoSituacao: z.string().optional(),
  tratativa: z.string().min(10, {
    message: "A tratativa deve ter pelo menos 10 caracteres.",
  }),
  situacao: z.enum(['Pendente', 'Em Andamento', 'Concluída', 'Atrasada']).optional(),
  dataConclusao: z.date().optional(),
});

const AgendaPage: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [acoesDiarias, setAcoesDiarias] = useState<AcaoDiaria[]>([]);
  const [selectedAcao, setSelectedAcao] = useState<AcaoDiaria | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tratativa: "",
    },
  });

  const handleCardClick = (acao: AcaoDiaria) => {
    setSelectedAcao(acao);
    form.reset({
      tratativa: acao.TRATATIVA || '',
      contatado: acao.CONTATADO || '',
      motivoNaoContatado: acao.MOTIVO_NAO_CONTATADO || '',
      motivoNaoUsoPlataforma: acao.MOTIVO_NAO_USO_PLATAFORMA || '',
      descricaoSituacao: acao.DESCRIACAO_SITUACAO || '',
      situacao: acao.SITUACAO || 'Pendente',
      dataConclusao: acao.DATA_CONCLUSAO ? new Date(acao.DATA_CONCLUSAO) : undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditAcao = (acao: AcaoDiaria) => {
    setSelectedAcao(acao);
    form.reset({
      tratativa: acao.TRATATIVA || '',
      contatado: acao.CONTATADO || '',
      motivoNaoContatado: acao.MOTIVO_NAO_CONTATADO || '',
      motivoNaoUsoPlataforma: acao.MOTIVO_NAO_USO_PLATAFORMA || '',
      descricaoSituacao: acao.DESCRIACAO_SITUACAO || '',
      situacao: acao.SITUACAO || 'Pendente',
      dataConclusao: acao.DATA_CONCLUSAO ? new Date(acao.DATA_CONCLUSAO) : undefined,
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedAcao(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluída':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Atrasada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'Pendente';
      case 'Em Andamento':
        return 'Em Andamento';
      case 'Concluída':
        return 'Concluída';
      case 'Atrasada':
        return 'Atrasada';
      default:
        return status;
    }
  };

  useEffect(() => {
    const fetchAcoesDiarias = async () => {
      if (!date || !user) return;

      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd', { locale: ptBR });

      try {
        const response = await fetch(`http://localhost:3001/api/acoes-diarias?dataLimite=${formattedDate}&userId=${user.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAcoesDiarias(data);
      } catch (error) {
        console.error("Erro ao buscar ações diárias:", error);
        toast({
          title: "Erro ao buscar ações diárias!",
          description: "Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcoesDiarias();
  }, [date, user, toast]);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    if (!selectedAcao) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:3001/api/acoes-diarias/${selectedAcao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          dataConclusao: values.dataConclusao ? format(values.dataConclusao, 'yyyy-MM-dd', { locale: ptBR }) : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Atualiza o estado local com os novos valores
      setAcoesDiarias(prevAcoes =>
        prevAcoes.map(acao =>
          acao.id === selectedAcao.id
            ? { ...acao, ...values }
            : acao
        )
      );

      toast({
        title: "Ação diária atualizada com sucesso!",
        description: "As informações foram salvas.",
      });
    } catch (error) {
      console.error("Erro ao atualizar ação diária:", error);
      toast({
        title: "Erro ao atualizar ação diária!",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      closeEditDialog();
    }
  };

  const filteredAcoes = acoesDiarias.filter(acao => {
    const search = searchQuery.toLowerCase();
    return (
      acao.NOME_LOJA.toLowerCase().includes(search) ||
      acao.CHAVE_LOJA.toLowerCase().includes(search) ||
      acao.NOME_AG.toLowerCase().includes(search) ||
      acao.COD_AG.toString().includes(search)
    );
  });

  const totalAcoes = acoesDiarias.length;
  const acoesPendentes = acoesDiarias.filter(acao => acao.SITUACAO === 'Pendente').length;
  const acoesEmAndamento = acoesDiarias.filter(acao => acao.SITUACAO === 'Em Andamento').length;
  const acoesConcluidas = acoesDiarias.filter(acao => acao.SITUACAO === 'Concluída').length;
  const acoesAtrasadas = acoesDiarias.filter(acao => acao.SITUACAO === 'Atrasada').length;

  return (
    <div className="container mx-auto">
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Editar Ação Diária</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da ação diária. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="contatado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato realizado?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SIM">Sim</SelectItem>
                            <SelectItem value="NAO">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.getValues("contatado") === "NAO" && (
                  <div>
                    <FormField
                      control={form.control}
                      name="motivoNaoContatado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo para não ter contatado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CAIXA POSTAL">Caixa Postal</SelectItem>
                              <SelectItem value="LIGACAO REAGENDADA">Ligação Reagendada</SelectItem>
                              <SelectItem value="OUTRA">Outra</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div>
                  <FormField
                    control={form.control}
                    name="situacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Situação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                            <SelectItem value="Concluída">Concluída</SelectItem>
                            <SelectItem value="Atrasada">Atrasada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.getValues("situacao") === "Concluída" && (
                  <div>
                    <FormField
                      control={form.control}
                      name="dataConclusao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Conclusão</FormLabel>
                          <FormControl>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date('2023-01-01')}
                              style={{ width: '100%' }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div>
                  <FormField
                    control={form.control}
                    name="motivoNaoUsoPlataforma"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo para não uso da plataforma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Resistência em relação a Nova Plataforma">Resistência em relação a Nova Plataforma</SelectItem>
                            <SelectItem value="Dificuldades com a leitura da biometria facial">Dificuldades com a leitura da biometria facial</SelectItem>
                            <SelectItem value="Problemas com a conexão de internet">Problemas com a conexão de internet</SelectItem>
                            <SelectItem value="Problemas com o Corban Connect">Problemas com o Corban Connect</SelectItem>
                            <SelectItem value="Problemas durante a jornada">Problemas durante a jornada</SelectItem>
                            <SelectItem value="Outra">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="descricaoSituacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição da Situação</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="tratativa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tratativa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes da tratativa realizada"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descreva detalhadamente a tratativa realizada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-gray-500">Acompanhamento diário das ações - {user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Total de Ações</CardTitle>
                <AlertTriangle size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="bg-blue-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-semibold text-blue-800">{totalAcoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Ações Pendentes</CardTitle>
                <AlertTriangle size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                <div className="bg-amber-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-xl font-semibold text-amber-800">{acoesPendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Ações Em Andamento</CardTitle>
                <AlertTriangle size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="bg-blue-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-xl font-semibold text-blue-800">{acoesEmAndamento}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Ações Concluídas</CardTitle>
                <CheckCircle size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-xl font-semibold text-green-800">{acoesConcluidas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Ações Atrasadas</CardTitle>
                <XSquare size={24} className="text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                <div className="bg-red-100 p-2 rounded-full">
                  <XSquare className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Atrasadas</p>
                  <p className="text-xl font-semibold text-red-800">{acoesAtrasadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Ações Diárias</CardTitle>
            <Input
              type="search"
              placeholder="Buscar loja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={format(date || new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {format(date || new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border shadow"
                    disabled={(date) => date > new Date() || date < new Date('2023-01-01')}
                    labels={{
                      previousMonth: "Mês anterior",
                      nextMonth: "Próximo mês"
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isLoading ? (
              <div className="w-full flex justify-center">
                <Progress className="w-1/2" value={100} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-center">Data Limite</TableHead>
                      <TableHead className="text-center">Situação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAcoes.map((acao) => (
                      <TableRow key={acao.id}>
                        <TableCell className="font-medium">{acao.NOME_LOJA} ({acao.CHAVE_LOJA})</TableCell>
                        <TableCell>{acao.CONTATO}</TableCell>
                        <TableCell>{acao.TELEFONE}</TableCell>
                        <TableCell className="text-center">{formatDate(new Date(acao.DATA_LIMITE))}</TableCell>
                        <TableCell className="text-center">
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(acao.SITUACAO)}`}>
                            {getStatusLabel(acao.SITUACAO)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditAcao(acao)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCardClick(acao)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendaPage;
