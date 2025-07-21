import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ChartBar, TrendingUp, AlertTriangle, TrendingDown, Activity, Plus, MoreHorizontal, Info, Search, Pin, Download, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableStatus } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import axios from 'axios';
import GraficoTendencia from "@/components/GraficoTendencia";
import { DadosLoja, DadosEstrategia, FiltrosLoja } from "@/shared/types/lead";
import { API_CONFIG } from "@/config/api.config";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { estrategiaComercialApi, DadosEstrategiaResponse } from "@/services/estrategiaComercialService";
import { formatDate, getRelativeMonths } from "@/utils/formatDate";

const dadosSimulados: Record<string, DadosEstrategia> = {
  "credito": {
    titulo: "Estratégia de Crédito",
    visaoGeral: "Aumentar a oferta de produtos de crédito para clientes com bom histórico financeiro.",
    dadosAnaliticos: [
      {
        chaveLoja: "5001",
        cnpj: "12.345.678/0001-99",
        nomeLoja: "Loja Centro",
        mesM3: 15,
        mesM2: 18,
        mesM1: 22,
        mesM0: 20,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-27"),
        dataInauguracao: new Date("2020-05-15"),
        agencia: "0001",
        codAgRelacionamento: "0001",
        agRelacionamento: "Agência Centro",
        telefoneLoja: "(11) 3456-7890",
        nomeContato: "João Silva",
        gerenciaRegional: "São Paulo Centro",
        diretoriaRegional: "Sudeste",
        tendencia: "estavel",
        endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP",
        nomePdv: "Centro SP",
        multiplicadorResponsavel: "Carlos Oliveira",
        dataCertificacao: new Date("2022-10-05"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: false
        }
      },
      {
        chaveLoja: "5002",
        cnpj: "23.456.789/0001-88",
        nomeLoja: "Loja Shopping Vila Olímpia",
        mesM3: 10,
        mesM2: 12,
        mesM1: 15,
        mesM0: 18,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-26"),
        dataUltTrxNegocio: new Date("2023-03-28"),
        dataInauguracao: new Date("2021-11-20"),
        agencia: "0002",
        codAgRelacionamento: "0002",
        agRelacionamento: "Agência Vila Olímpia",
        telefoneLoja: "(11) 3456-7891",
        nomeContato: "Maria Santos",
        gerenciaRegional: "São Paulo Zona Sul",
        diretoriaRegional: "Sudeste",
        tendencia: "comecando",
        endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP",
        nomePdv: "Vila Olímpia",
        multiplicadorResponsavel: "Ana Pereira",
        dataCertificacao: new Date("2022-09-15"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: false,
          lime: true
        }
      },
      {
        chaveLoja: "5003",
        cnpj: "34.567.890/0001-77",
        nomeLoja: "Loja Campinas Shopping",
        mesM3: 8,
        mesM2: 6,
        mesM1: 5,
        mesM0: 3,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-25"),
        dataInauguracao: new Date("2019-03-10"),
        agencia: "0015",
        codAgRelacionamento: "0015",
        agRelacionamento: "Agência Campinas",
        telefoneLoja: "(19) 3456-7892",
        nomeContato: "Pedro Almeida",
        gerenciaRegional: "Campinas",
        diretoriaRegional: "Interior SP",
        tendencia: "queda",
        endereco: "Campinas Shopping, Loja 67 - Campinas/SP",
        nomePdv: "Campinas Shop",
        multiplicadorResponsavel: "Roberto Costa",
        dataCertificacao: new Date("2022-11-20"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      },
      {
        chaveLoja: "5004",
        cnpj: "45.678.901/0001-66",
        nomeLoja: "Loja Rio Branco",
        mesM3: 5,
        mesM2: 7,
        mesM1: 9,
        mesM0: 11,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-01"),
        dataUltTrxNegocio: new Date("2023-03-01"),
        dataInauguracao: new Date("2018-06-05"),
        agencia: "0032",
        codAgRelacionamento: "0032",
        agRelacionamento: "Agência Rio Branco",
        telefoneLoja: "(21) 3456-7893",
        nomeContato: "Fernanda Lima",
        gerenciaRegional: "Rio de Janeiro Centro",
        diretoriaRegional: "Rio de Janeiro",
        tendencia: "comecando",
        endereco: "Av. Rio Branco, 156 - Centro, Rio de Janeiro/RJ",
        nomePdv: "Rio Branco",
        multiplicadorResponsavel: "Paulo Mendes",
        dataCertificacao: new Date("2021-05-10"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      },
      {
        chaveLoja: "5005",
        cnpj: "56.789.012/0001-55",
        nomeLoja: "Loja Salvador Shopping",
        mesM3: 12,
        mesM2: 8,
        mesM1: 6,
        mesM0: 4,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-10"),
        dataUltTrxNegocio: new Date("2023-03-15"),
        dataInauguracao: new Date("2017-09-22"),
        agencia: "0048",
        codAgRelacionamento: "0048",
        agRelacionamento: "Agência Salvador",
        telefoneLoja: "(71) 3456-7894",
        nomeContato: "Luciana Costa",
        gerenciaRegional: "Salvador",
        diretoriaRegional: "Nordeste",
        tendencia: "queda",
        endereco: "Salvador Shopping, Loja 33 - Salvador/BA",
        nomePdv: "Salvador Shop",
        multiplicadorResponsavel: "Marcos Vieira",
        dataCertificacao: new Date("2020-11-05"),
        situacaoTablet: "S.Tablet",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: false
        }
      }
    ]
  },
  "abertura-conta": {
    titulo: "Estratégia de Abertura de Contas",
    visaoGeral: "Cada ação no dia a dia fortalece sua gestão. Atue com estratégia e transforme desafios em resultados!",
    dadosAnaliticos: [
      {
        chaveLoja: "5001",
        cnpj: "12.345.678/0001-99",
        nomeLoja: "Loja Centro",
        mesM3: 12,
        mesM2: 10,
        mesM1: 15,
        mesM0: 14,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-27"),
        dataInauguracao: new Date("2020-05-15"),
        agencia: "0001",
        codAgRelacionamento: "0001",
        agRelacionamento: "Agência Centro",
        telefoneLoja: "(11) 3456-7890",
        nomeContato: "João Silva",
        gerenciaRegional: "São Paulo Centro",
        diretoriaRegional: "Sudeste",
        tendencia: "estavel",
        endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP",
        nomePdv: "Centro SP",
        multiplicadorResponsavel: "Carlos Oliveira",
        dataCertificacao: new Date("2022-10-05"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: false
        }
      },
      {
        chaveLoja: "5002",
        cnpj: "23.456.789/0001-88",
        nomeLoja: "Loja Shopping Vila Olímpia",
        mesM3: 8,
        mesM2: 6,
        mesM1: 4,
        mesM0: 5,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-26"),
        dataUltTrxNegocio: new Date("2023-03-28"),
        dataInauguracao: new Date("2021-11-20"),
        agencia: "0002",
        codAgRelacionamento: "0002",
        agRelacionamento: "Agência Vila Olímpia",
        telefoneLoja: "(11) 3456-7891",
        nomeContato: "Maria Santos",
        gerenciaRegional: "São Paulo Zona Sul",
        diretoriaRegional: "Sudeste",
        tendencia: "queda",
        endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP",
        nomePdv: "Vila Olímpia",
        multiplicadorResponsavel: "Ana Pereira",
        dataCertificacao: new Date("2022-09-15"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: false,
          lime: true
        }
      },
      {
        chaveLoja: "5003",
        cnpj: "34.567.890/0001-77",
        nomeLoja: "Loja Campinas Shopping",
        mesM3: 5,
        mesM2: 7,
        mesM1: 9,
        mesM0: 13,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-25"),
        dataInauguracao: new Date("2019-03-10"),
        agencia: "0015",
        codAgRelacionamento: "0015",
        agRelacionamento: "Agência Campinas",
        telefoneLoja: "(19) 3456-7892",
        nomeContato: "Pedro Almeida",
        gerenciaRegional: "Campinas",
        diretoriaRegional: "Interior SP",
        tendencia: "comecando",
        endereco: "Campinas Shopping, Loja 67 - Campinas/SP",
        nomePdv: "Campinas Shop",
        multiplicadorResponsavel: "Roberto Costa",
        dataCertificacao: new Date("2022-11-20"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      },
      {
        chaveLoja: "5004",
        cnpj: "45.678.901/0001-66",
        nomeLoja: "Loja Rio Branco",
        mesM3: 10,
        mesM2: 8,
        mesM1: 6,
        mesM0: 5,
        situacao: "bloqueada",
        dataUltTrxContabil: new Date("2023-03-01"),
        dataUltTrxNegocio: new Date("2023-03-01"),
        dataBloqueio: new Date("2023-03-02"),
        dataInauguracao: new Date("2018-06-05"),
        agencia: "0032",
        codAgRelacionamento: "0032",
        agRelacionamento: "Agência Rio Branco",
        telefoneLoja: "(21) 3456-7893",
        nomeContato: "Fernanda Lima",
        gerenciaRegional: "Rio de Janeiro Centro",
        diretoriaRegional: "Rio de Janeiro",
        tendencia: "queda",
        endereco: "Av. Rio Branco, 156 - Centro, Rio de Janeiro/RJ",
        nomePdv: "Rio Branco",
        multiplicadorResponsavel: "Paulo Mendes",
        dataCertificacao: new Date("2021-05-10"),
        situacaoTablet: "Retirado",
        produtosHabilitados: {
          consignado: false,
          microsseguro: false,
          lime: false
        },
        motivoBloqueio: "Bloqueio temporário devido a irregularidades na documentação. Necessário regularização com a gerência regional."
      },
      {
        chaveLoja: "5005",
        cnpj: "56.789.012/0001-55",
        nomeLoja: "Loja Salvador Shopping",
        mesM3: 7,
        mesM2: 7,
        mesM1: 8,
        mesM0: 6,
        situacao: "em processo de encerramento",
        dataUltTrxContabil: new Date("2023-03-10"),
        dataUltTrxNegocio: new Date("2023-03-15"),
        dataInauguracao: new Date("2017-09-22"),
        agencia: "0048",
        codAgRelacionamento: "0048",
        agRelacionamento: "Agência Salvador",
        telefoneLoja: "(71) 3456-7894",
        nomeContato: "Luciana Costa",
        gerenciaRegional: "Salvador",
        diretoriaRegional: "Nordeste",
        tendencia: "queda",
        endereco: "Salvador Shopping, Loja 33 - Salvador/BA",
        nomePdv: "Salvador Shop",
        multiplicadorResponsavel: "Marcos Vieira",
        dataCertificacao: new Date("2020-11-05"),
        situacaoTablet: "S.Tablet",
        produtosHabilitados: {
          consignado: false,
          microsseguro: true,
          lime: false
        }
      },
      {
        chaveLoja: "5006",
        cnpj: "67.890.123/0001-44",
        nomeLoja: "Loja Belo Horizonte",
        mesM3: 9,
        mesM2: 11,
        mesM1: 10,
        mesM0: 12,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-29"),
        dataUltTrxNegocio: new Date("2023-03-29"),
        dataInauguracao: new Date("2019-12-10"),
        agencia: "0056",
        codAgRelacionamento: "0056",
        agRelacionamento: "Agência Belo Horizonte",
        telefoneLoja: "(31) 3456-7895",
        nomeContato: "Ricardo Souza",
        gerenciaRegional: "Belo Horizonte",
        diretoriaRegional: "Minas Gerais",
        tendencia: "estavel",
        endereco: "Av. Afonso Pena, 1500 - Centro, Belo Horizonte/MG",
        nomePdv: "BH Centro",
        multiplicadorResponsavel: "Camila Rocha",
        dataCertificacao: new Date("2022-07-15"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      }
    ]
  },
  "seguro": {
    titulo: "Estratégia de Seguros",
    visaoGeral: "Ampliar carteira de seguros com foco em microsseguros e seguros residenciais.",
    dadosAnaliticos: [
      {
        chaveLoja: "5001",
        cnpj: "12.345.678/0001-99",
        nomeLoja: "Loja Centro",
        mesM3: 8,
        mesM2: 10,
        mesM1: 12,
        mesM0: 15,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-25"),
        dataUltTrxNegocio: new Date("2023-03-27"),
        dataInauguracao: new Date("2020-05-15"),
        agencia: "0001",
        codAgRelacionamento: "0001",
        agRelacionamento: "Agência Centro",
        telefoneLoja: "(11) 3456-7890",
        nomeContato: "João Silva",
        gerenciaRegional: "São Paulo Centro",
        diretoriaRegional: "Sudeste",
        tendencia: "comecando",
        endereco: "Av. Paulista, 1000 - Centro, São Paulo/SP",
        nomePdv: "Centro SP",
        multiplicadorResponsavel: "Carlos Oliveira",
        dataCertificacao: new Date("2022-10-05"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: false
        }
      },
      {
        chaveLoja: "5002",
        cnpj: "23.456.789/0001-88",
        nomeLoja: "Loja Shopping Vila Olímpia",
        mesM3: 7,
        mesM2: 9,
        mesM1: 11,
        mesM0: 14,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-26"),
        dataUltTrxNegocio: new Date("2023-03-28"),
        dataInauguracao: new Date("2021-11-20"),
        agencia: "0002",
        codAgRelacionamento: "0002",
        agRelacionamento: "Agência Vila Olímpia",
        telefoneLoja: "(11) 3456-7891",
        nomeContato: "Maria Santos",
        gerenciaRegional: "São Paulo Zona Sul",
        diretoriaRegional: "Sudeste",
        tendencia: "comecando",
        endereco: "Shopping Vila Olímpia, Loja 42 - São Paulo/SP",
        nomePdv: "Vila Olímpia",
        multiplicadorResponsavel: "Ana Pereira",
        dataCertificacao: new Date("2022-09-15"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      },
      {
        chaveLoja: "5003",
        cnpj: "34.567.890/0001-77",
        nomeLoja: "Loja Campinas Shopping",
        mesM3: 3,
        mesM2: 2,
        mesM1: 1,
        mesM0: 0,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-02-25"),
        dataUltTrxNegocio: new Date("2023-02-25"),
        dataInauguracao: new Date("2019-03-10"),
        agencia: "0015",
        codAgRelacionamento: "0015",
        agRelacionamento: "Agência Campinas",
        telefoneLoja: "(19) 3456-7892",
        nomeContato: "Pedro Almeida",
        gerenciaRegional: "Campinas",
        diretoriaRegional: "Interior SP",
        tendencia: "queda",
        endereco: "Campinas Shopping, Loja 67 - Campinas/SP",
        nomePdv: "Campinas Shop",
        multiplicadorResponsavel: "Roberto Costa",
        dataCertificacao: new Date("2022-11-20"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: false,
          lime: true
        }
      },
      {
        chaveLoja: "5004",
        cnpj: "45.678.901/0001-66",
        nomeLoja: "Loja Rio Branco",
        mesM3: 6,
        mesM2: 8,
        mesM1: 5,
        mesM0: 7,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-20"),
        dataUltTrxNegocio: new Date("2023-03-20"),
        dataInauguracao: new Date("2018-06-05"),
        agencia: "0032",
        codAgRelacionamento: "0032",
        agRelacionamento: "Agência Rio Branco",
        telefoneLoja: "(21) 3456-7893",
        nomeContato: "Fernanda Lima",
        gerenciaRegional: "Rio de Janeiro Centro",
        diretoriaRegional: "Rio de Janeiro",
        tendencia: "estavel",
        endereco: "Av. Rio Branco, 156 - Centro, Rio de Janeiro/RJ",
        nomePdv: "Rio Branco",
        multiplicadorResponsavel: "Paulo Mendes",
        dataCertificacao: new Date("2021-05-10"),
        situacaoTablet: "Instalado",
        produtosHabilitados: {
          consignado: true,
          microsseguro: true,
          lime: true
        }
      },
      {
        chaveLoja: "5005",
        cnpj: "56.789.012/0001-55",
        nomeLoja: "Loja Salvador Shopping",
        mesM3: 5,
        mesM2: 4,
        mesM1: 3,
        mesM0: 2,
        situacao: "ativa",
        dataUltTrxContabil: new Date("2023-03-10"),
        dataUltTrxNegocio: new Date("2023-03-15"),
        dataInauguracao: new Date("2017-09-22"),
        agencia: "0048",
        codAgRelacionamento: "0048",
        agRelacionamento: "Agência Salvador",
        telefoneLoja: "(71) 3456-7894",
        nomeContato: "Luciana Costa",
        gerenciaRegional: "Salvador",
        diretoriaRegional: "Nordeste",
        tendencia: "atencao",
        endereco: "Salvador Shopping, Loja 33 - Salvador/BA",
        nomePdv: "Salvador Shop",
        multiplicadorResponsavel: "Marcos Vieira",
        dataCertificacao: new Date("2020-11-05"),
        situacaoTablet: "S.Tablet",
        produtosHabilitados: {
          consignado: false,
          microsseguro: true,
          lime: false
        }
      }
    ]
  }
};

// Usar a configuração centralizada
const API_BASE_URL = API_CONFIG.baseUrl;

const ITEMS_PER_PAGE = 20;

const DetalhesEstrategia: React.FC = () => {
  const navigate = useNavigate();
  const { produto } = useParams<{ produto: string }>();
  const [dados, setDados] = useState<DadosEstrategia | null>(null);
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosLoja[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{
    coluna: keyof DadosLoja | null;
    direcao: 'asc' | 'desc';
  }>({ coluna: null, direcao: 'asc' });
  const { user, isManager } = useAuth();
  const [modalBloqueio, setModalBloqueio] = useState<{
    isOpen: boolean;
    loja: DadosLoja | null;
  }>({
    isOpen: false,
    loja: null
  });

  
  const [lojasMarcadas, setLojasMarcadas] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const form = useForm<FiltrosLoja>({
    defaultValues: {
      chaveLoja: "",
      cnpj: "",
      nomeLoja: "",
      situacao: [],
      agencia: "",
      gerenciaRegional: [],
      diretoriaRegional: [],
      tendencia: []
    }
  });

  const mesesFormatados = getRelativeMonths();

  // Função para verificar o status do servidor
  const checkServerStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      console.log('Status do servidor:', response.data);
      
      if (response.data.status === 'ok') {
        setConnectionStatus('connected');
        
        if (!response.data.tableExists) {
          console.error('Tabela oportunidades_contas não existe no banco de dados!');
          setError('A tabela oportunidades_contas não foi encontrada no banco de dados.');
          return false;
        }
        
        if (response.data.recordCount === 0) {
          console.warn('Nenhum registro encontrado na tabela oportunidades_contas para abertura-conta.');
          setError('Nenhum registro encontrado na tabela oportunidades_contas. Verifique se o script SQL foi executado.');
          return false;
        }
        
        return true;
      } else {
        setConnectionStatus('error');
        setError('Servidor disponível, mas reportou um erro.');
        return false;
      }
    } catch (err) {
      console.error('Erro ao verificar status do servidor:', err);
      setConnectionStatus('error');
      setError('Não foi possível conectar ao servidor. Verifique se o servidor está rodando na porta correta.');
      return false;
    }
  };

  // Função para carregar dados da estratégia usando a nova API
  const loadEstrategiaData = async () => {
    if (!produto || !user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar se o usuário tem chave definida
      if (!user.chave && user.role !== 'admin') {
        const errorMsg = `Usuário ${user.name} (${user.role}) não possui chave de hierarquia definida. 
        
Para corrigir:
1. Execute o script SQL: src/sql/fix_user_keys.sql
2. Verifique se o usuário tem chave na tabela TESTE..users
3. Faça logout e login novamente

Entre em contato com o administrador se o problema persistir.`;
        
        setError(errorMsg);
        setConnectionStatus('error');
        return;
      }
      
      // console.log(`Carregando dados da estratégia: ${produto}`);
      // console.log(`Usuário: ${user.name} (${user.role}) - Chave: ${user.chave}`);
      // console.log(`Dados completos do usuário:`, user);
      
      // Buscar dados da estratégia
      const response: DadosEstrategiaResponse = await estrategiaComercialApi.getEstrategia(produto);
      
      // console.log('Dados recebidos da API:', response);
      
      // Criar objeto de dados no formato esperado pelo componente
      const estrategiaData: DadosEstrategia = {
        titulo: getTituloEstrategia(produto),
        visaoGeral: getVisaoGeralEstrategia(produto),
        dadosAnaliticos: response.dadosAnaliticos || []
      };
      
      setDados(estrategiaData);
      setDadosFiltrados(response.dadosAnaliticos || []);
      setConnectionStatus('connected');
      
      // console.log(`✅ Estratégia carregada: ${response.totalLojas} lojas encontradas`);
      
    } catch (err: any) {
      console.error('Erro ao carregar estratégia:', err);
      
      let errorMessage = err.message || 'Erro ao carregar dados da estratégia';
      
      // Se for erro de rede ou servidor, adicionar informações úteis
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        errorMessage = `Erro de conexão com o servidor. 
        
Verifique:
1. Se o backend está rodando
2. Se as tabelas TB_ESTR_LOJAS e TB_ESTR_CONTAS existem
3. Execute: src/sql/check_tables_data.sql para verificar os dados
4. Execute os scripts Python para popular as tabelas`;
      }
      
      setError(errorMessage);
      setConnectionStatus('error');
      
      // Fallback para dados simulados
      if (produto && produto in dadosSimulados) {
        // console.log('🔄 Usando dados simulados como fallback');
        setDados(dadosSimulados[produto]);
        if (dadosSimulados[produto].dadosAnaliticos) {
          setDadosFiltrados(dadosSimulados[produto].dadosAnaliticos || []);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Funções auxiliares para obter título e visão geral
  const getTituloEstrategia = (produto: string): string => {
    const titulos: Record<string, string> = {
      'credito': 'Estratégia de Crédito',
      'abertura-conta': 'Estratégia de Abertura de Contas',
      'seguro': 'Estratégia de Seguros',
      'pontos-ativos': 'Estratégia de Pontos Ativos',
      'pontos-realizando-negocio': 'Estratégia de Pontos com Negócios',
      'pontos-bloqueados': 'Estratégia de Pontos Bloqueados'
    };
    return titulos[produto] || 'Estratégia Comercial';
  };

  const getVisaoGeralEstrategia = (produto: string): string => {
    const visaoGeral: Record<string, string> = {
      'credito': 'Aumentar a oferta de produtos de crédito para clientes com bom histórico financeiro.',
      'abertura-conta': 'Cada ação no dia a dia fortalece sua gestão. Atue com estratégia e transforme desafios em resultados!',
      'seguro': 'Ampliar carteira de seguros com foco em microsseguros e seguros residenciais.',
      'pontos-ativos': 'Monitoramento e estratégias para pontos ativos e sua performance comercial.',
      'pontos-realizando-negocio': 'Acompanhamento de pontos com transações ativas e estratégias de potencialização.',
      'pontos-bloqueados': 'Identificação e estratégias de desbloqueio de pontos comerciais inativos.'
    };
    return visaoGeral[produto] || 'Estratégia comercial focada no crescimento e performance.';
  };

  useEffect(() => {
    loadEstrategiaData();
  }, [produto, user]);

  const aplicarFiltros = (values: FiltrosLoja) => {
    if (!dados?.dadosAnaliticos) return;
    
    const filtrados = dados.dadosAnaliticos.filter(loja => {
      // Busca por texto em vários campos
      const searchTerm = values.nomeLoja.toLowerCase();
      if (searchTerm) {
        const matchesSearch = 
          loja.chaveLoja.toLowerCase().includes(searchTerm) ||
          loja.cnpj.toLowerCase().includes(searchTerm) ||
          loja.nomeLoja.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Filtros de array
      if (values.situacao.length > 0 && !values.situacao.includes(loja.situacao)) return false;
      if (values.gerenciaRegional.length > 0 && !values.gerenciaRegional.includes(loja.gerenciaRegional)) return false;
      if (values.diretoriaRegional.length > 0 && !values.diretoriaRegional.includes(loja.diretoriaRegional)) return false;
      if (values.tendencia.length > 0 && !values.tendencia.includes(loja.tendencia)) return false;
      
      return true;
    });
        
    setDadosFiltrados(filtrados);
    setCurrentPage(1); // Resetar para a primeira página quando aplicar filtros
  };

  const limparFiltros = () => {
    form.reset({
      chaveLoja: "",
      cnpj: "",
      nomeLoja: "",
      situacao: [],
      agencia: "",
      gerenciaRegional: [],
      diretoriaRegional: [],
      tendencia: []
    });
    if (dados?.dadosAnaliticos) {
      setDadosFiltrados(dados.dadosAnaliticos);
    }
    setCurrentPage(1); // Resetar para a primeira página quando limpar filtros
  };

  const handleOrdenacao = (coluna: keyof DadosLoja) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const dadosOrdenados = React.useMemo(() => {
    if (!ordenacao.coluna) return dadosFiltrados;

    return [...dadosFiltrados].sort((a, b) => {
      const valorA = a[ordenacao.coluna!];
      const valorB = b[ordenacao.coluna!];

      if (valorA === valorB) return 0;
      
      const comparacao = valorA < valorB ? -1 : 1;
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
  }, [dadosFiltrados, ordenacao]);

  const exportarParaExcel = () => {
    // Preparar os dados para exportação
    const dadosParaExportar = dadosOrdenados.map(loja => ({
      'Chave Loja': loja.chaveLoja,
      'CNPJ': loja.cnpj,
      'Nome Loja': loja.nomeLoja,
      'Agência': loja.agencia,
      [mesesFormatados.M3]: loja.mesM3,
      [mesesFormatados.M2]: loja.mesM2,
      [mesesFormatados.M1]: loja.mesM1,
      [mesesFormatados.M0]: loja.mesM0,
      'Situação': loja.situacao,
      'Últ. Contábil': formatDate(loja.dataUltTrxContabil),
      'Últ. Negócio': formatDate(loja.dataUltTrxNegocio),
      'Tendência': loja.tendencia,
      'Gerência Regional': loja.gerenciaRegional,
      'Diretoria Regional': loja.diretoriaRegional
    }));

    // Criar uma nova planilha
    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");

    // Gerar o arquivo Excel
    const nomeProduto = produto === "abertura-conta" ? "Abertura De Contas" : 
                        produto === "credito" ? "Crédito" : "Produto";
    XLSX.writeFile(wb, `Analítico BE (${nomeProduto}) - ${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const handleVoltar = () => {
    navigate('/estrategia-comercial');
  };

  const handleFilter = (values: any) => {
    // Garantir que todos os valores são arrays
    const filtros: FiltrosLoja = {
      ...values,
      situacao: Array.isArray(values.situacao) ? values.situacao : [],
      gerenciaRegional: Array.isArray(values.gerenciaRegional) ? values.gerenciaRegional : [],
      diretoriaRegional: Array.isArray(values.diretoriaRegional) ? values.diretoriaRegional : [],
      tendencia: Array.isArray(values.tendencia) ? values.tendencia : []
    };
    aplicarFiltros(filtros);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  // Mostramos uma mensagem específica baseada no status da conexão
  if (connectionStatus === 'error') {
    console.warn(`Erro de conexão: ${error}`);
    // Continuamos com os dados simulados, apenas adicionamos um aviso na tela
  }

  if (!dados) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Produto não encontrado ou dados indisponíveis.</p>
      </div>
    );
  }

  const renderTendenciaIcon = (tendencia: string) => {
    switch(tendencia) {
      case "queda":
        return <TrendingDown size={16} className="text-red-500" />;
      case "atencao":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "estavel":
        return <Activity size={16} className="text-blue-500" />;
      case "comecando":
        return <TrendingUp size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return "—";
    return format(date, "dd/MM/yyyy", {locale: ptBR});
  };
  
  const toggleLojaExpandida = (chaveLoja: string) => {
    if (lojaExpandida === chaveLoja) {
      setLojaExpandida(null);
    } else {
      setLojaExpandida(chaveLoja);
    }
  };

  const getOpcoesUnicas = (campo: keyof DadosLoja) => {
    if (!dados?.dadosAnaliticos) return [];
    return Array.from(new Set(dados.dadosAnaliticos.map(loja => loja[campo] as string))).filter(Boolean);
  };

  const situacoes = ["ativa", "bloqueada", "em processo de encerramento"];
  const gerenciasRegionais = getOpcoesUnicas("gerenciaRegional");
  const diretoriasRegionais = getOpcoesUnicas("diretoriaRegional");

  const toggleLojaMarcada = (chaveLoja: string) => {
    setLojasMarcadas(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(chaveLoja)) {
        novoSet.delete(chaveLoja);
      } else {
        novoSet.add(chaveLoja);
      }
      return novoSet;
    });
  };

  // Funções de paginação
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return dadosOrdenados.slice(startIndex, endIndex);
  };

  // Calcular o total de páginas
  const totalPages = Math.ceil(dadosFiltrados.length / ITEMS_PER_PAGE);

  // Navegar entre páginas
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setLojaExpandida(null); // Fecha qualquer loja expandida ao mudar de página
    }
  };

  const ComboboxFilter = ({ 
    name, 
    title, 
    options,
    valueKey = 'value',
    labelKey = 'label'
  }: { 
    name: keyof FiltrosLoja; 
    title: string; 
    options: any[];
    valueKey?: string;
    labelKey?: string;
  }) => {
    const values = form.watch(name) as string[];

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "justify-start text-left font-normal",
              values?.length > 0 && "border-primary/50"
            )}
          >
            <span className="truncate">
              {values?.length > 0 
                ? `${title} (${values.length})`
                : title}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option: any) => {
                const value = option[valueKey] || option;
                const label = option[labelKey] || option;
                return (
                  <CommandItem
                    key={value}
                    onSelect={() => {
                      const currentValues = form.getValues(name) as string[];
                      const newValues = currentValues.includes(value)
                        ? currentValues.filter(v => v !== value)
                        : [...currentValues, value];
                      form.setValue(name, newValues);
                      aplicarFiltros(form.getValues());
                    }}
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      values?.includes(value) ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {values?.includes(value) && "✓"}
                    </div>
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleVoltar}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{dados.titulo}</h1>
            <p className="text-gray-500">Estratégia Comercial - {user?.name}</p>
          </div>
        </div>

        {connectionStatus === 'error' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              <span className="font-medium">Aviso:</span>
              <span className="ml-2">{error || 'Usando dados de demonstração devido a um erro de conexão com o servidor.'}</span>
            </div>
            <p className="text-sm mt-1 ml-7">Para usar dados reais, verifique se o servidor está rodando e se o script SQL foi executado.</p>
          </div>
        )}

        {/* Grid Principal */}
        <div className="space-y-4">
          {/* Gráfico de Tendência */}
          <GraficoTendencia 
            dadosAnaliticos={dados.dadosAnaliticos} 
            onTendenciaClick={(tendencia) => {
              form.setValue('tendencia', [tendencia]);
              aplicarFiltros(form.getValues());
            }}
            onZeradosClick={() => {
              // Filtrar lojas que tinham produção em M1 mas zeraram em M0
              const lojasFiltradas = dados.dadosAnaliticos.filter(loja => 
                (loja.mesM1 || 0) > 0 && (loja.mesM0 || 0) === 0
              );
              setDadosFiltrados(lojasFiltradas);
              setCurrentPage(1);
              
              // Limpar outros filtros ativos
              form.reset({
                chaveLoja: "",
                cnpj: "",
                nomeLoja: "",
                situacao: [],
                agencia: "",
                gerenciaRegional: [],
                diretoriaRegional: [],
                tendencia: []
              });
            }}
          />

          <Tabs defaultValue="oportunidades">
            <TabsList className="mb-4">
              <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
              <TabsTrigger value="acoes">Correspondentes Marcados</TabsTrigger>
              {isManager && <TabsTrigger value="gerencial">Visão Gerencial</TabsTrigger>}
            </TabsList>

            <TabsContent value="oportunidades">
              {(produto === "abertura-conta" || produto === "credito" || produto === "seguro") && dados.dadosAnaliticos ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Quadro Analítico de Oportunidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 bg-gray-50 rounded-lg p-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFilter)} className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                              <Search size={16} />
                              Filtrar lojas
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportarParaExcel}
                              className="flex items-center gap-2"
                            >
                              <Download size={16} />
                              Exportar Excel
                            </Button>
                          </div>

                            <FormField
                              control={form.control}
                            name="nomeLoja"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                  <Input 
                                    placeholder="Buscar por Chave Loja, CNPJ ou Nome da Loja" 
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      aplicarFiltros(form.getValues());
                                    }}
                                  />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                          <div className="flex flex-wrap gap-2">
                            <ComboboxFilter
                              name="situacao"
                              title="Situação"
                              options={situacoes.map(s => ({
                                value: s,
                                label: s === "ativa" ? "Ativa" : 
                                       s === "bloqueada" ? "Bloqueada" : 
                                       "Em encerramento"
                              }))}
                              valueKey="value"
                              labelKey="label"
                            />
                            <ComboboxFilter
                              name="gerenciaRegional"
                              title="Gerência Regional"
                              options={gerenciasRegionais}
                            />
                            <ComboboxFilter
                              name="diretoriaRegional"
                              title="Diretoria Regional"
                              options={diretoriasRegionais}
                            />
                            <ComboboxFilter
                              name="tendencia"
                              title="Tendência"
                              options={["queda", "atencao", "estavel", "comecando"].map(t => ({
                                value: t,
                                label: t === "queda" ? "Queda" :
                                       t === "atencao" ? "Atenção" :
                                       t === "estavel" ? "Estável" :
                                       "Começando"
                              }))}
                              valueKey="value"
                              labelKey="label"
                            />
                          </div>

                          {Object.entries(form.getValues()).some(([_, value]) => 
                            Array.isArray(value) ? value.length > 0 : !!value
                          ) && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                            <Button 
                              type="button" 
                                variant="ghost" 
                                size="sm"
                              onClick={limparFiltros}
                            >
                                Limpar filtros
                            </Button>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(form.getValues()).map(([key, values]) => {
                                  if (!Array.isArray(values) || values.length === 0) return null;
                                  return values.map((value: string) => {
                                    let label = value;
                                    if (key === 'situacao') {
                                      label = value === "ativa" ? "Ativa" : 
                                             value === "bloqueada" ? "Bloqueada" : 
                                             "Em encerramento";
                                    } else if (key === 'tendencia') {
                                      label = value === "queda" ? "Queda" :
                                             value === "atencao" ? "Atenção" :
                                             value === "estavel" ? "Estável" :
                                             "Começando";
                                    }

                                    return (
                                      <Badge 
                                        key={`${key}-${value}`}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => {
                                          const currentValues = form.getValues(key as keyof FiltrosLoja) as string[];
                                          form.setValue(
                                            key as keyof FiltrosLoja, 
                                            currentValues.filter(v => v !== value)
                                          );
                                          aplicarFiltros(form.getValues());
                                        }}
                                      >
                                        {label} ×
                                      </Badge>
                                    );
                                  });
                                })}
                          </div>
                            </div>
                          )}
                        </form>
                      </Form>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="w-[180px] cursor-pointer hover:bg-gray-100" 
                              onClick={() => handleOrdenacao('chaveLoja')}
                            >
                              <div className="flex items-center gap-1">
                                Chave Loja
                                {ordenacao.coluna === 'chaveLoja' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[250px] cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('nomeLoja')}
                            >
                              <div className="flex items-center gap-1">
                                Nome Loja
                                {ordenacao.coluna === 'nomeLoja' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="text-center" colSpan={4}>
                              <div className="mb-1">Qtd. Contas</div>
                              <div className="grid grid-cols-4 gap-2 text-xs font-normal">
                                <div 
                                  className="cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleOrdenacao('mesM3')}
                                >
                                  {mesesFormatados.M3} {ordenacao.coluna === 'mesM3' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                  className="cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleOrdenacao('mesM2')}
                                >
                                  {mesesFormatados.M2} {ordenacao.coluna === 'mesM2' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                  className="cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleOrdenacao('mesM1')}
                                >
                                  {mesesFormatados.M1} {ordenacao.coluna === 'mesM1' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                  className="cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleOrdenacao('mesM0')}
                                >
                                  {mesesFormatados.M0} {ordenacao.coluna === 'mesM0' && (ordenacao.direcao === 'asc' ? '↑' : '↓')}
                                </div>
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[100px] text-center cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('situacao')}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Situação
                                {ordenacao.coluna === 'situacao' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] text-center cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('dataUltTrxContabil')}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Últ. Contábil
                                {ordenacao.coluna === 'dataUltTrxContabil' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[120px] text-center cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('dataUltTrxNegocio')}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Últ. Negócio
                                {ordenacao.coluna === 'dataUltTrxNegocio' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[100px] text-center cursor-pointer hover:bg-gray-100"
                              onClick={() => handleOrdenacao('tendencia')}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Tendência
                                {ordenacao.coluna === 'tendencia' && (
                                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="w-[150px] text-center">
                              <div className="flex items-center justify-center">Ações</div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getCurrentPageData().map((loja) => (
                            <React.Fragment key={loja.chaveLoja}>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div>{loja.chaveLoja}</div>
                                  <div className="text-xs text-gray-500">{loja.cnpj}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{loja.nomeLoja}</div>
                                  <div className="text-xs text-gray-500">
                                    {loja.codAgRelacionamento} - {loja.agRelacionamento}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center p-2">{loja.mesM3}</TableCell>
                                <TableCell className="text-center p-2">{loja.mesM2}</TableCell>
                                <TableCell className="text-center p-2">{loja.mesM1}</TableCell>
                                <TableCell className="text-center p-2">{loja.mesM0}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    {loja.situacao === "ativa" ? (
                                      <TableStatus status="realizar" label="Ativa" />
                                    ) : loja.situacao === "bloqueada" ? (
                                      <div 
                                        className="cursor-pointer" 
                                        onClick={() => setModalBloqueio({ isOpen: true, loja })}
                                      >
                                        <TableStatus status="bloqueada" label="Bloqueada" />
                                      </div>
                                    ) : (
                                      <TableStatus status="pendente" label="Em encerramento" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{formatDate(loja.dataUltTrxContabil)}</TableCell>
                                <TableCell className="text-center">{formatDate(loja.dataUltTrxNegocio)}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center items-center">
                                    {renderTendenciaIcon(loja.tendencia)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      title="Ver detalhes"
                                      onClick={() => toggleLojaExpandida(loja.chaveLoja)}
                                      className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                                    >
                                      <Info size={16} className="text-blue-600" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      title="Adicionar tratativa"
                                      className="bg-green-50 border-green-200 hover:bg-green-100"
                                    >
                                      <Plus size={16} className="text-green-600" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      title={lojasMarcadas.has(loja.chaveLoja) ? "Desmarcar loja" : "Acompanhar Loja"}
                                      onClick={() => toggleLojaMarcada(loja.chaveLoja)}
                                      className={`${lojasMarcadas.has(loja.chaveLoja) ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                      <Pin size={16} className={lojasMarcadas.has(loja.chaveLoja) ? "text-purple-600" : "text-gray-600"} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {lojaExpandida === loja.chaveLoja && (
                                <TableRow className="bg-gray-50">
                                  <TableCell colSpan={10} className="py-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Informações da Loja</h4>
                                        <ul className="space-y-1.5">
                                          <li className="text-sm"><span className="font-medium">Localização:</span> {loja.endereco}</li>
                                          <li className="text-sm"><span className="font-medium">Contato:</span> {loja.nomePdv}</li>
                                          <li className="text-sm"><span className="font-medium">Telefone:</span> {loja.telefoneLoja}</li>
                                          <li className="text-sm"><span className="font-medium">Data Certificação:</span> {loja.dataCertificacao ? formatDate(loja.dataCertificacao) : '—'}</li>
                                          <li className="text-sm"><span className="font-medium">Situação Tablet:</span> {loja.situacaoTablet}</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Hierarquia</h4>
                                        <ul className="space-y-1.5">
                                          <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {loja.diretoriaRegional}</li>
                                          <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {loja.gerenciaRegional}</li>
                                          <li className="text-sm"><span className="font-medium">Multiplicador:</span> {loja.multiplicadorResponsavel}</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Produtos Habilitados</h4>
                                        <div className="flex flex-col space-y-2">
                                          <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.consignado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            Consignado
                                          </div>
                                          <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.microsseguro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            Microsseguro
                                          </div>
                                          <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.lime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            Lime
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Paginação */}
                      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                        <div>
                          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, dadosFiltrados.length)} de {dadosFiltrados.length} lojas
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="px-2">
                            Página {currentPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="acoes">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dadosOrdenados
                  .filter(loja => lojasMarcadas.has(loja.chaveLoja))
                  .map((loja) => (
                    <Card key={loja.chaveLoja} className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg text-purple-800">{loja.nomeLoja}</CardTitle>
                            <p className="text-sm text-purple-600">Chave: {loja.chaveLoja} - Ag: {loja.agencia}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => toggleLojaMarcada(loja.chaveLoja)}
                            className="bg-purple-50 border-purple-200 hover:bg-purple-100"
                          >
                            <Pin size={16} className="text-purple-600" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded-lg border border-purple-100">
                            <h4 className="text-sm font-medium text-purple-800 mb-2">Evolução de Contas</h4>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">{mesesFormatados.M3}</p>
                                <p className="text-lg font-semibold text-purple-800">{loja.mesM3}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">{mesesFormatados.M2}</p>
                                <p className="text-lg font-semibold text-purple-800">{loja.mesM2}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">{mesesFormatados.M1}</p>
                                <p className="text-lg font-semibold text-purple-800">{loja.mesM1}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">{mesesFormatados.M0}</p>
                                <p className="text-lg font-semibold text-purple-800">{loja.mesM0}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-purple-100">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Situação:</span> {loja.situacao}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Contato:</span> {loja.nomeContato}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Últ. Contábil:</span> {formatDate(loja.dataUltTrxContabil)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Últ. Negócio:</span> {formatDate(loja.dataUltTrxNegocio)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {lojaExpandida === loja.chaveLoja && (
                            <div className="bg-white p-3 rounded-lg border border-purple-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Informações da Loja</h4>
                                  <ul className="space-y-1.5">
                                    <li className="text-sm"><span className="font-medium">Localização:</span> {loja.endereco}</li>
                                    <li className="text-sm"><span className="font-medium">Contato:</span> {loja.nomePdv}</li>
                                    <li className="text-sm"><span className="font-medium">Telefone:</span> {loja.telefoneLoja}</li>
                                    <li className="text-sm"><span className="font-medium">Data Certificação:</span> {loja.dataCertificacao ? formatDate(loja.dataCertificacao) : '—'}</li>
                                    <li className="text-sm"><span className="font-medium">Situação Tablet:</span> {loja.situacaoTablet}</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Hierarquia</h4>
                                  <ul className="space-y-1.5">
                                    <li className="text-sm"><span className="font-medium">Diretoria Regional:</span> {loja.diretoriaRegional}</li>
                                    <li className="text-sm"><span className="font-medium">Gerência Regional:</span> {loja.gerenciaRegional}</li>
                                    <li className="text-sm"><span className="font-medium">Multiplicador:</span> {loja.multiplicadorResponsavel}</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Produtos Habilitados</h4>
                                  <div className="flex flex-col space-y-2">
                                    <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.consignado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      Consignado
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.microsseguro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      Microsseguro
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-xs ${loja.produtosHabilitados?.lime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      Lime
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                              onClick={() => toggleLojaExpandida(loja.chaveLoja)}
                            >
                              <Info size={16} className="text-blue-600 mr-2" />
                              {lojaExpandida === loja.chaveLoja ? "Ocultar Detalhes" : "Ver Detalhes"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-green-50 border-green-200 hover:bg-green-100"
                            >
                              <Plus size={16} className="text-green-600 mr-2" />
                              Adicionar Tratativa
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {dadosOrdenados.filter(loja => lojasMarcadas.has(loja.chaveLoja)).length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Pin size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum correspondente marcado</h3>
                    <p className="text-gray-500 mt-2">
                      Clique no ícone de alfinete nas lojas para marcá-las e acompanhar aqui.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {isManager && (
              <TabsContent value="gerencial">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Visão Consolidada da Equipe</h3>
                      <p>Esta seção contém informações gerenciais detalhadas sobre o desempenho da sua equipe neste produto.</p>
                      <p className="text-amber-600">Disponível apenas para coordenadores e gerentes.</p>
                      
                      <div className="py-4 px-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm italic text-center">
                          Dados detalhados de equipe seriam exibidos aqui em uma implementação completa.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Modal de Bloqueio */}
      <Dialog open={modalBloqueio.isOpen} onOpenChange={() => setModalBloqueio({ isOpen: false, loja: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Bloqueio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Loja</h4>
              <p className="text-sm text-gray-600">
                {modalBloqueio.loja?.nomeLoja} - {modalBloqueio.loja?.chaveLoja}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data do Bloqueio</h4>
              <p className="text-sm text-gray-600">
                {modalBloqueio.loja?.dataBloqueio ? formatDate(modalBloqueio.loja.dataBloqueio) : '—'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Motivo do Bloqueio</h4>
              <p className="text-sm text-gray-600">
                {modalBloqueio.loja?.motivoBloqueio || 'Motivo não especificado'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetalhesEstrategia;
