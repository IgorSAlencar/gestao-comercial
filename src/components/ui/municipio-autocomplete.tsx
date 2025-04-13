import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { estados } from '@/data/municipios';

interface MunicipioAutocompleteProps {
  value: { municipio: string; uf: string };
  onChange: (value: { municipio: string; uf: string }) => void;
}

export function MunicipioAutocomplete({ value, onChange }: MunicipioAutocompleteProps) {
  const formatMunicipio = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleMunicipioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMunicipio(e.target.value);
    onChange({ municipio: formatted, uf: value.uf });
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Input
          placeholder="Digite o nome do município"
          value={value.municipio}
          onChange={handleMunicipioChange}
          className="w-full"
        />
      </div>

      <div className="w-[80px]">
        <Select
          value={value.uf}
          onValueChange={(uf) => {
            onChange({ municipio: value.municipio, uf });
          }}
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