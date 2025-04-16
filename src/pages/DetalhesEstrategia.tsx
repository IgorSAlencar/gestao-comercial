
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// Importando os componentes das estratégias
import EstrategiaAberturaConta from "@/components/estrategia/EstrategiaAberturaConta";
import EstrategiaCredito from "@/components/estrategia/EstrategiaCredito";
import EstrategiaSeguro from "@/components/estrategia/EstrategiaSeguro";
import EstrategiaPontosAtivos from "@/components/estrategia/EstrategiaPontosAtivos";
import EstrategiaPontosNegocio from "@/components/estrategia/EstrategiaPontosNegocio";
import EstrategiaPontosBloqueados from "@/components/estrategia/EstrategiaPontosBloqueados";

// Mock de dados para teste
import dadosAberturaConta from "@/data/mock/abertura-conta.json";
import dadosCredito from "@/data/mock/credito.json";
import dadosSeguro from "@/data/mock/seguro.json";
import dadosPontosAtivos from "@/data/mock/pontos-ativos.json";
import dadosPontosNegocio from "@/data/mock/pontos-negocio.json";
import dadosPontosBloqueados from "@/data/mock/pontos-bloqueados.json";

const DetalhesEstrategia: React.FC = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Em produção, substituir pelo código abaixo para buscar do backend
        /*
        const response = await api.get(`/estrategia/${tipo}`);
        setDados(response.data);
        */

        // Usando dados mockados para desenvolvimento
        setTimeout(() => {
          switch (tipo) {
            case "abertura-conta":
              setDados(dadosAberturaConta);
              break;
            case "credito":
              setDados(dadosCredito);
              break;
            case "seguro":
              setDados(dadosSeguro);
              break;
            case "pontos-ativos":
              setDados(dadosPontosAtivos);
              break;
            case "pontos-realizando-negocio":
              setDados(dadosPontosNegocio);
              break;
            case "pontos-bloqueados":
              setDados(dadosPontosBloqueados);
              break;
            default:
              setDados(null);
          }
          setLoading(false);
        }, 800); // Simulando tempo de carregamento
      } catch (error) {
        console.error("Erro ao carregar dados da estratégia:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados da estratégia. Tente novamente mais tarde.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    carregarDados();
  }, [tipo, toast]);

  const getTitulo = () => {
    switch (tipo) {
      case "abertura-conta":
        return "Estratégia de Abertura de Contas";
      case "credito":
        return "Estratégia de Produtos de Crédito";
      case "seguro":
        return "Estratégia de Seguros";
      case "pontos-ativos":
        return "Estratégia de Pontos Ativos";
      case "pontos-realizando-negocio":
        return "Estratégia de Pontos Realizando Negócios";
      case "pontos-bloqueados":
        return "Estratégia de Pontos Bloqueados";
      default:
        return "Estratégia";
    }
  };

  const renderizarEstrategia = () => {
    switch (tipo) {
      case "abertura-conta":
        return <EstrategiaAberturaConta dados={dados} loading={loading} />;
      case "credito":
        return <EstrategiaCredito dados={dados} loading={loading} />;
      case "seguro":
        return <EstrategiaSeguro dados={dados} loading={loading} />;
      case "pontos-ativos":
        return <EstrategiaPontosAtivos dados={dados} loading={loading} />;
      case "pontos-realizando-negocio":
        return <EstrategiaPontosNegocio dados={dados} loading={loading} />;
      case "pontos-bloqueados":
        return <EstrategiaPontosBloqueados dados={dados} loading={loading} />;
      default:
        return <div className="text-center py-10">Estratégia não encontrada</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{getTitulo()}</h1>
      {renderizarEstrategia()}
    </div>
  );
};

export default DetalhesEstrategia;
