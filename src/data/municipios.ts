import cidades from './cidades.json';

export interface Municipio {
  nome: string;
  uf: string;
}

// Processa os dados do JSON para o formato que precisamos
export const municipios: Municipio[] = cidades.flatMap(estado => 
  estado.cidades.map(cidade => ({
    nome: cidade.nome,
    uf: estado.uf
  }))
);

export const estados = cidades.map(estado => ({
  sigla: estado.uf,
  nome: estado.nome
})); 