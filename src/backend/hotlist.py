import pandas as pd
import random
import uuid
from faker import Faker
import pyodbc

# Inicialização
fake = Faker('pt_BR')
Faker.seed(42)
random.seed(42)

num_linhas = 20
supervisor_id = '8ABD1646-FEC3-4AD3-B130-5D4A961365DB'

situacoes = ['pendente', 'realizar', 'tratada', 'bloqueada']
mercados = ['Mercado', 'Padaria', 'Açougue', 'Lanchonete']
presencas = ['SIM', 'NAO']
diretorias = ['DR São Paulo', 'DR Rio de Janeiro', 'DR Sul', 'DR Nordeste']
gerencias = ['GR Norte', 'GR Sul', 'GR Central']
agencias = [f'{i:04d}' for i in range(1, 51)]
gerentes = [fake.name() for _ in range(10)]

# Geração de dados
dados = []

for _ in range(num_linhas):
    dados.append((
        str(uuid.uuid4()).upper(),
        supervisor_id,
        fake.cnpj(),
        f"{random.choice(mercados)} {fake.first_name()}",
        f"{fake.city()} - {fake.estado_sigla()}",
        random.choice(agencias),
        random.choice(mercados),
        random.choice(presencas),
        random.choice(situacoes),
        random.choice(diretorias),
        random.choice(gerencias),
        f"PA {random.randint(1, 999):03d}",
        random.choice(gerentes)
    ))

# Nomes das colunas
colunas = [
    "id", "supervisor_id", "CNPJ", "NOME_LOJA", "LOCALIZACAO",
    "AGENCIA", "MERCADO", "PRACA_PRESENCA", "situacao",
    "DIRETORIA_REGIONAL", "GERENCIA_REGIONAL", "PA", "GERENTE_PJ"
]

# Conexão com SQL Server
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

# Inserção
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

sql = f"""
    INSERT INTO HOTLIST (
        {', '.join(colunas)}
    )
    VALUES ({', '.join(['?' for _ in colunas])})
"""

for registro in dados:
    cursor.execute(sql, registro)

conn.commit()
cursor.close()
conn.close()

print("✅ Dados gerados e inseridos com sucesso na tabela TESTETESTE..HOTLIST!")
