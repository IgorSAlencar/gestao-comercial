import pandas as pd
from faker import Faker
import random
import uuid
from datetime import datetime
import pyodbc

# Configurações de conexão
server = 'DESKTOP-G4V6794'
database = 'TESTE'
username = 'sa'
password = 'expresso'

conn_str = f"""
    DRIVER={{ODBC Driver 17 for SQL Server}};
    SERVER={server};
    DATABASE={database};
    UID={username};
    PWD={password};
    TrustServerCertificate=yes;
"""

# Setup do Faker
fake = Faker('pt_BR')
Faker.seed(42)

# IDs dos usuários
user_ids = [
    '8ABD1646-FEC3-4AD3-B130-5D4A961365DB',
    '13651188-7289-4C4B-A509-1A2AD65B486F'
]

# Parâmetros para geração
status_tablet = ['Instalado', 'Retirado', 'S.Tablet']
situacoes = ['ativa', 'bloqueada', 'em processo de encerramento']
tendencias = ['queda', 'atencao', 'estavel', 'comecando']
tipos_estrategia = ['abertura-conta', 'seguros', 'credito']

# Geração de dados
dados = []

for _ in range(20):
    user_id = random.choice(user_ids)
    chave_loja = f"LOJA{random.randint(100, 999)}"
    
    row = {
        'ID': str(uuid.uuid4()),
        'COD_DR': str(random.randint(1, 9)).zfill(2),
        'DIR_REGIONAL': f"Diretoria {fake.estado_abreviado()}",
        'COD_GR': f"{random.randint(10,99)}GR",
        'GER_REGIONAL': fake.name(),
        'LOCALIZACAO': fake.address().replace("\n", ", "),
        'CONTATO': fake.first_name(),
        'TELEFONE': fake.phone_number(),
        'DATA_CERTIFICACAO': fake.date_between('-2y', 'today'),
        'STATUS_TABLET': random.choice(status_tablet),
        'HABILITADO_CONSIGNADO': random.randint(0, 1),
        'HABILITADO_LIME': random.randint(0, 1),
        'HABILITADO_MICROSSEGURO': random.randint(0, 1),
        'COD_AG': str(random.randint(1000, 9999)),
        'NOME_AGENCIA': f"Agência {fake.city()}",
        'CHAVE_PAA': f"PAA{random.randint(100,999)}",
        'NOME_PAA': f"Ponto {fake.bairro()}",
        'SITUACAO': random.choice(situacoes),
        'ULT_TRX_CONTABIL': fake.date_between('-6m', 'today'),
        'ULT_TRX_NEGOCIO': fake.date_between('-3m', 'today'),
        'TENDENCIA': random.choice(tendencias),
        'CHAVE_LOJA': chave_loja,
        'CNPJ': fake.cnpj(),
        'NOME_LOJA': f"Loja {fake.first_name()}",
        'MES_M3': random.randint(0, 50),
        'MES_M2': random.randint(0, 50),
        'MES_M1': random.randint(0, 50),
        'MES_M0': random.randint(0, 50),
        'DATA_BLOQUEIO': None,
        'MOTIVO_BLOQUEIO': None,
        'DATA_INAUGURACAO': fake.date_between(start_date='-5y', end_date='-1y'),
        'CREATED_AT': datetime.now(),
        'UPDATED_AT': datetime.now(),
        'USER_ID': user_id,
        'MULTIPLICADOR_RESPONSAVEL': fake.name(),
        'NOME_PDV': f"PDV {fake.street_name()}",
        'TIPO_ESTRATEGIA': random.choice(tipos_estrategia)
    }
    dados.append(row)

# Conectar ao SQL Server
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Inserir os dados
for d in dados:
    cursor.execute("""
        INSERT INTO TESTE..OPORTUNIDADES_CONTAS (
            ID, COD_DR, DIR_REGIONAL, COD_GR, GER_REGIONAL, LOCALIZACAO, CONTATO, TELEFONE,
            DATA_CERTIFICACAO, STATUS_TABLET, HABILITADO_CONSIGNADO, HABILITADO_LIME, HABILITADO_MICROSSEGURO,
            COD_AG, NOME_AGENCIA, CHAVE_PAA, NOME_PAA, SITUACAO,
            ULT_TRX_CONTABIL, ULT_TRX_NEGOCIO, TENDENCIA, CHAVE_LOJA, CNPJ, NOME_LOJA,
            MES_M3, MES_M2, MES_M1, MES_M0,
            DATA_BLOQUEIO, MOTIVO_BLOQUEIO, DATA_INAUGURACAO,
            CREATED_AT, UPDATED_AT, USER_ID,
            MULTIPLICADOR_RESPONSAVEL, NOME_PDV, TIPO_ESTRATEGIA
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, list(d.values()))

conn.commit()
cursor.close()
conn.close()

print("✅ Dados inseridos com sucesso!")
