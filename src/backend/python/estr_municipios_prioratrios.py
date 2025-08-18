import pyodbc
import random
from faker import Faker

# ====== CONEXÃO (banco TESTE) ======
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

conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# ====== CRIAR TABELA SE NÃO EXISTIR ======
cursor.execute("""
IF OBJECT_ID('TESTE..MUNICIPIOS_PRIORITARIOS','U') IS NULL
BEGIN
    CREATE TABLE TESTE..MUNICIPIOS_PRIORITARIOS (
        CD_MUNIC        INT         NOT NULL PRIMARY KEY,  -- código IBGE (7 dígitos)
        MUNICIPIO       NVARCHAR(100) NOT NULL,
        UF              CHAR(2)     NOT NULL,
        CHAVE_SUP       INT         NOT NULL,
        CHAVE_COORD     INT         NOT NULL,
        CHAVE_GERENTE   INT         NOT NULL
    );
END;
""")
conn.commit()

# (Opcional) limpar antes de inserir
cursor.execute("TRUNCATE TABLE TESTE..MUNICIPIOS_PRIORITARIOS;")
conn.commit()

# ====== GERAR DADOS FICTÍCIOS ======
fake = Faker('pt_BR')

# Prefixos oficiais do IBGE por UF (2 primeiros dígitos do código de município)
ibge_prefix_por_uf = {
    'RO': 11, 'AC': 12, 'AM': 13, 'RR': 14, 'PA': 15, 'AP': 16, 'TO': 17,
    'MA': 21, 'PI': 22, 'CE': 23, 'RN': 24, 'PB': 25, 'PE': 26, 'AL': 27, 'SE': 28, 'BA': 29,
    'MG': 31, 'ES': 32, 'RJ': 33, 'SP': 35,
    'PR': 41, 'SC': 42, 'RS': 43,
    'MS': 50, 'MT': 51, 'GO': 52, 'DF': 53
}
ufs = list(ibge_prefix_por_uf.keys())

def gerar_cd_municipio(uf, usados):
    """Gera um código IBGE de 7 dígitos compatível com a UF, evitando duplicatas."""
    prefixo = ibge_prefix_por_uf[uf]  # ex.: 35 para SP
    while True:
        # últimos 5 dígitos: 00001..89999 (evita 00000)
        sufixo = random.randint(1, 89999)
        cd = prefixo * 100000 + sufixo  # formará algo como 35xxxxx
        if cd not in usados:
            usados.add(cd)
            return cd

linhas = []
cds_usados = set()

CHAVE_SUP = 40002
CHAVE_COORD = 30001
CHAVE_GERENTE = 20001

for _ in range(20):
    uf = random.choice(ufs)
    cd_munic = gerar_cd_municipio(uf, cds_usados)

    # Nome fictício de município (mistura city + sufixos comuns)
    base = fake.city()
    # Evita nomes muito curtos/repetidos – apenas para variar:
    sufixos = [" do Norte", " do Sul", " de Baixo", " das Pedras", " do Vale", " dos Campos", ""]
    municipio = (base + random.choice(sufixos)).strip()

    linhas.append((
        cd_munic,
        municipio,
        uf,
        CHAVE_SUP,
        CHAVE_COORD,
        CHAVE_GERENTE
    ))

# ====== INSERIR EM LOTE ======
cursor.fast_executemany = True
cursor.executemany("""
    INSERT INTO TESTE..MUNICIPIOS_PRIORITARIOS
        (CD_MUNIC, MUNICIPIO, UF, CHAVE_SUP, CHAVE_COORD, CHAVE_GERENTE)
    VALUES (?, ?, ?, ?, ?, ?);
""", linhas)
conn.commit()

print("OK: criados 20 registros em TESTE..MUNICIPIOS_PRIORITARIOS.")

cursor.close()
conn.close()




import pyodbc
import random
from datetime import datetime, timedelta
import uuid

# ====== CONEXÃO (banco TESTE) ======
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

conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# ====== CRIAR TABELA (SEM FK) ======
cursor.execute("""
IF OBJECT_ID('TESTE..MUNICIPIOS_PRIORITARIOS_TRATATIVAS','U') IS NULL
BEGIN
    CREATE TABLE TESTE..MUNICIPIOS_PRIORITARIOS_TRATATIVAS (
        ID_TRATATIVA              UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
        USER_ID                   UNIQUEIDENTIFIER NULL,         -- pode ficar vazio
        [USER]                    NVARCHAR(100)    NULL,         -- ex: João Silva
        CD_MUNIC                  INT              NOT NULL,     -- referência lógica
        DATA_TRATATIVA            DATETIME         NULL,
        DATA_VISITA               DATETIME         NULL,
        CNPJ                      CHAR(14)         NULL,         -- números sem máscara
        SEM_CNPJ                  BIT              NULL,         -- 1 se não houver CNPJ
        NOME_LOJA                 NVARCHAR(200)    NULL,         -- só quando SEM_CNPJ = 1
        RAMO_ATIVIDADE_REFERENCIA NVARCHAR(3)      NULL,         -- 'Sim'/'Não'
        HOUVE_INTERESSE           NVARCHAR(3)      NULL,         -- 'Sim'/'Não'
        CONTRATO_ENVIADO          NVARCHAR(3)      NULL,         -- 'Sim'/'Não'
        OBSERVACAO                NVARCHAR(MAX)    NULL
    );
END;
""")
conn.commit()

# ====== BUSCAR MUNICÍPIOS BASE ======
cursor.execute("SELECT CD_MUNIC, MUNICIPIO, UF FROM TESTE..MUNICIPIOS_PRIORITARIOS;")
municipios = cursor.fetchall()

if not municipios:
    raise RuntimeError("Nenhum município encontrado em TESTE..MUNICIPIOS_PRIORITARIOS. "
                       "Crie/popule a base de municípios antes de inserir tratativas.")

# ====== FUNÇÕES AUXILIARES ======
def gerar_cnpj_numerico():
    # CNPJ fictício simples (14 dígitos) — sem cálculo de DV
    return ''.join(str(random.randint(0, 9)) for _ in range(14))

def escolha_sim_nao(p=0.6):
    # Mais chance de "Sim"
    return "Sim" if random.random() < p else "Não"

def data_aleatoria_nos_ultimos_dias(max_dias=30):
    delta = random.randint(0, max_dias)
    d = datetime.now() - timedelta(days=delta)
    # horário simples no meio do dia
    return d.replace(hour=random.randint(9, 17), minute=random.choice([0, 15, 30, 45]), second=0, microsecond=0)

# ====== PREPARAR 20 REGISTROS ======
random.shuffle(municipios)
registros = []
qtd = min(20, len(municipios))

for i in range(qtd):
    cd_munic, municipio, uf = municipios[i]

    # 50% dos casos sem CNPJ
    sem_cnpj = 1 if random.random() < 0.5 else 0

    if sem_cnpj == 1:
        cnpj = None
        nome_loja = random.choice([
            "Mercearia São José", "Padaria Pão Quente", "Lojão do Centro",
            "Armarinhos Estrela", "Casa do Norte", "Empório do Vale",
            "Bazar Dois Irmãos", "Mini Mercado Primavera"
        ])
    else:
        cnpj = gerar_cnpj_numerico()
        nome_loja = None

    # Datas coerentes: tratativa anterior ou igual à visita
    data_tratativa = data_aleatoria_nos_ultimos_dias(30)
    # 70% dos casos têm visita; quando tem, visita é >= tratativa
    if random.random() < 0.7:
        dias_depois = random.randint(0, 10)
        data_visita = data_tratativa + timedelta(days=dias_depois)
        # às vezes sem visita marcada ainda
    else:
        data_visita = None

    # Campos Sim/Não
    ramo_ref = escolha_sim_nao(0.5)
    houve_interesse = escolha_sim_nao(0.55)
    contrato_enviado = "Sim" if (houve_interesse == "Sim" and random.random() < 0.7) else "Não"

    # USER_ID pode ser nulo ou um exemplo de GUID
    user_id = None if random.random() < 0.4 else uuid.UUID("8ABD1646-FEC3-4AD3-B130-5D4A961365DB")
    user_nome = "João Silva"

    observacao = random.choice([
        "Contato realizado por telefone. Aguardando retorno.",
        "Visita produtiva. Demanda por maquininha e antecipação.",
        "Sem interesse no momento. Reavaliar em 60 dias.",
        "Solicitar material de apoio e proposta revisada.",
        "Ponto com bom fluxo. Possível implantação mês que vem.",
        "Solicitou esclarecimentos sobre taxas e prazo de repasse.",
        "Cliente pediu simulação para comparar com concorrente.",
        "Sem CNPJ, mas loja em operação — avaliar MEI."
    ])

    registros.append((
        user_id,                 # USER_ID
        user_nome,               # USER
        cd_munic,                # CD_MUNIC
        data_tratativa,          # DATA_TRATATIVA
        data_visita,             # DATA_VISITA
        cnpj,                    # CNPJ
        sem_cnpj,                # SEM_CNPJ
        nome_loja,               # NOME_LOJA
        ramo_ref,                # RAMO_ATIVIDADE_REFERENCIA
        houve_interesse,         # HOUVE_INTERESSE
        contrato_enviado,        # CONTRATO_ENVIADO
        observacao               # OBSERVACAO
    ))

# ====== INSERIR EM LOTE ======
cursor.fast_executemany = True
cursor.executemany("""
    INSERT INTO TESTE..MUNICIPIOS_PRIORITARIOS_TRATATIVAS
        (USER_ID, [USER], CD_MUNIC, DATA_TRATATIVA, DATA_VISITA, CNPJ, SEM_CNPJ,
         NOME_LOJA, RAMO_ATIVIDADE_REFERENCIA, HOUVE_INTERESSE, CONTRATO_ENVIADO, OBSERVACAO)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
""", registros)
conn.commit()

print(f"OK: inseridas {len(registros)} tratativas em TESTE..MUNICIPIOS_PRIORITARIOS_TRATATIVAS.")

cursor.close()
conn.close()
