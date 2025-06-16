-- Inserindo dados para o supervisor Ana Costa
INSERT INTO TESTE..HOTLIST (
    supervisor_id, CNPJ, NOME_LOJA, LOCALIZACAO, AGENCIA, 
    MERCADO, PRACA_PRESENCA, situacao, DIRETORIA_REGIONAL, 
    GERENCIA_REGIONAL, PA, GERENTE_PJ
) VALUES (
    '13651188-7289-4C4B-A509-1A2AD65B486F',
    '12.345.678/0001-99',
    'Supermercado Central',
    'São Paulo - SP',
    '0001',
    'Supermercado',
    'SIM',
    'pendente',
    'DR São Paulo',
    'GR Centro',
    'PA 001',
    'João Silva'
);

-- Inserindo dados para o supervisor João Silva
INSERT INTO TESTE..HOTLIST (
    supervisor_id, CNPJ, NOME_LOJA, LOCALIZACAO, AGENCIA, 
    MERCADO, PRACA_PRESENCA, situacao, DIRETORIA_REGIONAL, 
    GERENCIA_REGIONAL, PA, GERENTE_PJ
) VALUES (
    '8ABD1646-FEC3-4AD3-B130-5D4A961365DB',
    '23.456.789/0001-88',
    'Mercado do Bairro',
    'São Paulo - SP',
    '0002',
    'Mercado',
    'NAO',
    'realizar',
    'DR São Paulo',
    'GR Sul',
    'PA 002',
    'Maria Santos'
); 