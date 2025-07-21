import pandas as pd
from faker import Faker
import random
import uuid
from datetime import datetime
import pyodbc

# Conexão com o SQL Server
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


# Atualizando conexão para o banco DATAWAREHOUSE
database = 'DATAWAREHOUSE'

conn_str = f"""
    DRIVER={{ODBC Driver 17 for SQL Server}};
    SERVER={server};
    DATABASE={database};
    UID={username};
    PWD={password};
    TrustServerCertificate=yes;
"""

# Conectar ao banco
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Criar a tabela
create_table_sql = """
IF OBJECT_ID('TB_ESTR_CONTAS', 'U') IS NOT NULL
    DROP TABLE TB_ESTR_CONTAS;

CREATE TABLE TB_ESTR_CONTAS (
    CHAVE_LOJA INT PRIMARY KEY,
    DT_ULT_AB_CONTA DATE,
    MES_M3 INT,
    MES_M2 INT,
    MES_M1 INT,
    MES_M0 INT
);
"""

cursor.execute(create_table_sql)
conn.commit()

# Gerar dados fictícios
fake = Faker()
num_registros = 2500    
dados = []

# Gerar chaves únicas para evitar violação de PRIMARY KEY
chaves_unicas = random.sample(range(10000, 999999), num_registros)

for i in range(num_registros):
    chave_loja = chaves_unicas[i]
    dt_ult_ab_conta = fake.date_between(start_date='-1y', end_date='today')
    mes_m3 = random.randint(0, 50)
    mes_m2 = random.randint(0, 50)
    mes_m1 = random.randint(0, 50)
    mes_m0 = random.randint(0, 50)
    
    dados.append((chave_loja, dt_ult_ab_conta, mes_m3, mes_m2, mes_m1, mes_m0))

# Inserir os dados
insert_sql = """
INSERT INTO TB_ESTR_CONTAS (CHAVE_LOJA, DT_ULT_AB_CONTA, MES_M3, MES_M2, MES_M1, MES_M0)
VALUES (?, ?, ?, ?, ?, ?)
"""

for linha in dados:
    cursor.execute(insert_sql, linha)

conn.commit()
cursor.close()
conn.close()

print("✅ Tabela TB_ESTR_CONTAS criada e populada com sucesso!")
