import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, Loader2, MapPin, ChevronDown } from 'lucide-react';
import { estados } from '@/data/municipios';

interface MunicipioAutocompleteProps {
  value: { municipio: string; uf: string };
  onChange: (value: { municipio: string; uf: string }) => void;
}

interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao?: {
    id: number;
    nome: string;
    mesorregiao?: {
      id: number;
      nome: string;
    };
  };
}

export function MunicipioAutocomplete({ value, onChange }: MunicipioAutocompleteProps) {
  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
  const [filteredMunicipios, setFilteredMunicipios] = useState<MunicipioIBGE[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Função para buscar municípios da API do IBGE
  const fetchMunicipios = async (uf: string) => {
    if (!uf || uf.length !== 2) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Mapear sigla para código do IBGE
      const estadosCodigos: { [key: string]: number } = {
        'AC': 12, 'AL': 17, 'AP': 16, 'AM': 13, 'BA': 29, 'CE': 23, 'DF': 53, 'ES': 32,
        'GO': 52, 'MA': 21, 'MT': 51, 'MS': 50, 'MG': 31, 'PA': 15, 'PB': 25, 'PR': 41,
        'PE': 26, 'PI': 22, 'RJ': 33, 'RN': 24, 'RS': 43, 'RO': 11, 'RR': 14, 'SC': 42,
        'SP': 35, 'SE': 28, 'TO': 27
      };

      const codigoEstado = estadosCodigos[uf];
      if (!codigoEstado) {
        throw new Error('Código do estado não encontrado');
      }

      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${codigoEstado}/municipios`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar municípios');
      }
      
      const data: MunicipioIBGE[] = await response.json();
      
      // Ordenar municípios por nome
      const sortedMunicipios = data.sort((a, b) => a.nome.localeCompare(b.nome));
      
      setMunicipios(sortedMunicipios);
      setFilteredMunicipios(sortedMunicipios);
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      setError('Erro ao carregar municípios. Tente novamente.');
      setMunicipios([]);
      setFilteredMunicipios([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar municípios quando UF mudar
  useEffect(() => {
    if (value.uf) {
      fetchMunicipios(value.uf);
    } else {
      setMunicipios([]);
      setFilteredMunicipios([]);
    }
  }, [value.uf]);

  // Filtrar municípios baseado na busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMunicipios(municipios);
    } else {
      const filtered = municipios.filter(municipio =>
        municipio.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMunicipios(filtered);
    }
  }, [searchTerm, municipios]);

  // Atualizar o termo de busca quando o valor mudar externamente
  useEffect(() => {
    setSearchTerm(value.municipio);
  }, [value.municipio]);

  // Click fora para fechar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUfChange = (newUf: string) => {
    onChange({ municipio: '', uf: newUf });
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleMunicipioSelect = (municipio: MunicipioIBGE) => {
    console.log('✅ Selecionando município:', municipio.nome);
    onChange({ municipio: municipio.nome, uf: value.uf });
    setSearchTerm(municipio.nome);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onChange({ municipio: term, uf: value.uf });
    
    if (term.length > 0 && value.uf && municipios.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (value.uf && municipios.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative" ref={dropdownRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder={value.uf ? "Digite o nome do município" : "Selecione primeiro o UF"}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={!value.uf}
            className="w-full pr-10"
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Dropdown customizado */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="max-h-[300px] overflow-y-auto">
              {error ? (
                <div className="p-4 text-center text-red-500 text-sm">
                  {error}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-6"
                    onClick={() => fetchMunicipios(value.uf)}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando municípios...
                </div>
              ) : filteredMunicipios.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm 
                    ? `Nenhum município encontrado para "${searchTerm}"`
                    : value.uf 
                      ? "Nenhum município encontrado"
                      : "Selecione primeiro o UF"
                  }
                </div>
              ) : (
                <div className="py-1">
                  {filteredMunicipios.map((municipio) => (
                    <div
                      key={municipio.id}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMunicipioSelect(municipio);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 text-blue-600 ${
                          value.municipio === municipio.nome ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium text-gray-900">{municipio.nome}</span>
                        {municipio.microrregiao?.mesorregiao && (
                          <span className="text-xs text-gray-500">
                            {municipio.microrregiao.mesorregiao.nome}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-[80px]">
        <Select
          value={value.uf}
          onValueChange={handleUfChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <div className="max-h-[300px] overflow-auto">
              {estados.map((estado) => (
                <SelectItem
                  key={estado.sigla}
                  value={estado.sigla}
                >
                  {estado.sigla}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 