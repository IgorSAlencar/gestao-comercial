// src/types.ts

export interface DadosLoja {
    chaveLoja: string;
    cnpj: string;
    nomeLoja: string;
    mesM3: number;
    mesM2: number;
    mesM1: number;
    mesM0: number;
    situacao: "ativa" | "bloqueada" | "em processo de encerramento";
    dataUltTrxContabil: Date;
    dataUltTrxNegocio: Date;
    dataBloqueio?: Date;
    dataInauguracao: Date;
    agencia: string;
    telefoneLoja: string;
    nomeContato: string;
    gerenciaRegional: string;
    diretoriaRegional: string;
    tendencia: "queda" | "atencao" | "estavel" | "comecando";
    endereco?: string;
    nomePdv?: string;
    multiplicadorResponsavel?: string;
    dataCertificacao?: Date;
    situacaoTablet?: "Instalado" | "Retirado" | "S.Tablet";
    produtosHabilitados?: {
      consignado: boolean;
      microsseguro: boolean;
      lime: boolean;
    };
    motivoBloqueio?: string;
  }
  
  export interface DadosEstrategia {
    titulo: string;
    visaoGeral: string;
    dadosAnaliticos?: DadosLoja[];
  }
  
  export interface FiltrosLoja {
    chaveLoja: string;
    cnpj: string;
    nomeLoja: string;
    situacao: string;
    agencia: string;
    gerenciaRegional: string;
    diretoriaRegional: string;
    tendencia: string;
  }
  