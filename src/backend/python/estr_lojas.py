import pandas as pd
from faker import Faker
import random
from datetime import datetime, timedelta
import pyodbc

# Conectar ao banco de dados
server = 'DESKTOP-G4V6794'
database = 'DATAWAREHOUSE'
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

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    # Criar a tabela TB_ESTR_LOJAS
    create_table_sql = """
    IF OBJECT_ID('TB_ESTR_LOJAS', 'U') IS NOT NULL
        DROP TABLE TB_ESTR_LOJAS;

    CREATE TABLE TB_ESTR_LOJAS (
        CHAVE_LOJA INT PRIMARY KEY,
        CNPJ VARCHAR(18),
        NOME_LOJA VARCHAR(255),
        DESC_SEGTO VARCHAR(50),
        COD_AG_RELACIONAMENTO INT,
        NR_PACB INT,
        AG_RELACIONAMENTO VARCHAR(255),
        CHAVE_PAA INT,
        NOME_PAA VARCHAR(255),
        DT_ENVIO_VAN DATE,
        DT_INAUGURACAO DATE,
        DT_INAUGURACAO_BACEN DATE,
        DT_ENCERRAMENTO_BACEN DATE,
        MOTIVO_ENCERRAMENTO VARCHAR(255),
        DT_RETIRADA_EQTO DATE,
        STATUS_TABLET VARCHAR(50),
        DT_IMPLANTACAO_TABLET DATE,
        DT_RETIRADA_TABLET DATE,
        GTE_RESP_LOJA VARCHAR(255),
        TELEFONE_PADRAO VARCHAR(20),
        DT_BLOQUEIO DATE,
        MOTIVO_BLOQUEIO VARCHAR(255),
        TIPO_POSTO VARCHAR(50),
        BE_AVANCADO BIT,
        BE_ORG_PAGADOR BIT,
        BE_PLATAFORMA BIT,
        ENDERECO VARCHAR(500),
        COD_IBGE INT,
        MUNICIPIO VARCHAR(255),
        UF CHAR(2),
        QUADRANTE VARCHAR(50),
        COD_MULT INT,
        MULTIPLICADOR VARCHAR(255),
        DIRE_REG INT,
        DIR_REGIONAL VARCHAR(255),
        COD_GER_REG INT,
        GER_REGIONAL VARCHAR(255),
        CHAVE_GERENCIA_AREA INT,
        DESC_GERENCIA_AREA VARCHAR(255),
        CHAVE_COORDENACAO INT,
        DESC_COORDENACAO VARCHAR(255),
        CHAVE_SUPERVISAO INT,
        DESC_SUPERVISAO VARCHAR(255),
        COD_ILHA INT,
        DESC_ILHA VARCHAR(255),
        NOME_ILHA VARCHAR(255),
        CHAVE_GERENCIA_NEGOCIO INT,
        DESC_GERENCIA_NEGOCIO VARCHAR(255),
        SITUACAO VARCHAR(50),
        DT_ULT_TRANSACAO DATE,
        HABILITADO_CONTA BIT,
        HABILITADO_MICRO BIT,
        HABILITADO_LIME BIT,
        HABILITADO_CONSIG BIT,
        SALDO_CX DECIMAL(15,2),
        LIMITE DECIMAL(15,2)
    );
    """

    cursor.execute(create_table_sql)
    conn.commit()
    print("✅ Tabela TB_ESTR_LOJAS criada com sucesso!")

    # Buscar CHAVE_LOJA da TB_ESTR_CONTAS
    try:
        cursor.execute("SELECT CHAVE_LOJA FROM TB_ESTR_CONTAS")
        chaves_loja = [row[0] for row in cursor.fetchall()]
        
        if not chaves_loja:
            print("⚠️ Nenhuma CHAVE_LOJA encontrada na TB_ESTR_CONTAS. Gerando chaves fictícias.")
            chaves_loja = random.sample(range(10000, 999999), 2500)
            
    except Exception as e:
        print(f"⚠️ Erro ao buscar dados da TB_ESTR_CONTAS: {e}")
        print("Gerando chaves fictícias...")
        chaves_loja = random.sample(range(10000, 999999), 2500)

    fake = Faker('pt_BR')
    segmentos = ['Mercado', 'Farmácia', 'Vestuário', 'Padaria', 'Posto']
    status_tablet_opcoes = ['RETIRADO', 'S/ TABLET', 'INSTALADO']
    tipo_posto_opcoes = ['TRADICIONAL']
    quadrantes = ['PRESENÇA', 'PA', 'AGÊNCIA']
    situacoes = ['ATIVA', 'BLOQUEADO', 'EM PROCESSO DE ENCERRAMENTO']
    
    # Municípios e UFs para diversificar os dados
    municipios_uf = [
        # São Paulo
        ('São Paulo', 'SP'), ('Campinas', 'SP'), ('Santos', 'SP'), ('Sorocaba', 'SP'), 
        ('Ribeirão Preto', 'SP'), ('Osasco', 'SP'), ('Santo André', 'SP'), ('São Bernardo do Campo', 'SP'),
        ('Guarulhos', 'SP'), ('Piracicaba', 'SP'), ('Jundiaí', 'SP'), ('Bauru', 'SP'),
        
        # Rio de Janeiro  
        ('Rio de Janeiro', 'RJ'), ('Niterói', 'RJ'), ('Nova Iguaçu', 'RJ'), ('Duque de Caxias', 'RJ'),
        ('Petrópolis', 'RJ'), ('Volta Redonda', 'RJ'), ('Campos dos Goytacazes', 'RJ'), ('Belford Roxo', 'RJ'),
        
        # Minas Gerais
        ('Belo Horizonte', 'MG'), ('Uberlândia', 'MG'), ('Contagem', 'MG'), ('Juiz de Fora', 'MG'),
        ('Betim', 'MG'), ('Montes Claros', 'MG'), ('Uberaba', 'MG'), ('Governador Valadares', 'MG'),
        
        # Bahia
        ('Salvador', 'BA'), ('Feira de Santana', 'BA'), ('Vitória da Conquista', 'BA'), ('Camaçari', 'BA'),
        ('Juazeiro', 'BA'), ('Lauro de Freitas', 'BA'), ('Ilhéus', 'BA'), ('Itabuna', 'BA'),
        
        # Paraná
        ('Curitiba', 'PR'), ('Londrina', 'PR'), ('Maringá', 'PR'), ('Ponta Grossa', 'PR'),
        ('Cascavel', 'PR'), ('São José dos Pinhais', 'PR'), ('Foz do Iguaçu', 'PR'), ('Colombo', 'PR'),
        
        # Rio Grande do Sul
        ('Porto Alegre', 'RS'), ('Caxias do Sul', 'RS'), ('Pelotas', 'RS'), ('Canoas', 'RS'),
        ('Santa Maria', 'RS'), ('Gravataí', 'RS'), ('Viamão', 'RS'), ('Novo Hamburgo', 'RS'),
        
        # Ceará
        ('Fortaleza', 'CE'), ('Caucaia', 'CE'), ('Juazeiro do Norte', 'CE'), ('Maracanaú', 'CE'),
        ('Sobral', 'CE'), ('Crato', 'CE'), ('Itapipoca', 'CE'), ('Maranguape', 'CE'),
        
        # Pernambuco
        ('Recife', 'PE'), ('Jaboatão dos Guararapes', 'PE'), ('Olinda', 'PE'), ('Caruaru', 'PE'),
        ('Petrolina', 'PE'), ('Paulista', 'PE'), ('Cabo de Santo Agostinho', 'PE'), ('Garanhuns', 'PE')
    ]

    # Estrutura hierárquica organizacional consistente
    hierarquia_organizacional = {
        # Diretoria SP INTERIOR
        10001: {
            'diretoria': 'SP INTERIOR',
            'gerencias': {
                20001: {
                    'desc': 'SAO PAULO',
                    'coordenacoes': {
                        30001: {
                            'desc': 'COORD LESTE',
                            'supervisoes': [
                                (40001, 'SUP LESTE'),
                                (40002, 'SUP OESTE')
                            ]
                        },
                        30002: {
                            'desc': 'COORD OESTE',
                            'supervisoes': [
                                (40003, 'SUP SUL')
                            ]
                        }
                    }
                }
            }
        },
        # Diretoria SUL
        10002: {
            'diretoria': 'SUL',
            'gerencias': {
                20002: {
                    'desc': 'SUL',
                    'coordenacoes': {
                        30003: {
                            'desc': 'COORD SUL',
                            'supervisoes': [
                                (40004, 'SUP SUL REGIAO')
                            ]
                        }
                    }
                }
            }
        },
        # Diretoria NORDESTE 1
        10003: {
            'diretoria': 'NORDESTE 1',
            'gerencias': {
                20003: {
                    'desc': 'NORDESTE 1',
                    'coordenacoes': {
                        30004: {
                            'desc': 'COORD NORDESTE',
                            'supervisoes': [
                                (40005, 'SUP NORDESTE A'),
                                (40006, 'SUP NORDESTE B')
                            ]
                        }
                    }
                }
            }
        }
    }

    dados = []
    
    # Criar todas as combinações hierárquicas válidas
    combinacoes_hierarquicas = []
    
    for chave_diretoria, data_diretoria in hierarquia_organizacional.items():
        for chave_gerencia, data_gerencia in data_diretoria['gerencias'].items():
            for chave_coordenacao, data_coordenacao in data_gerencia['coordenacoes'].items():
                for chave_supervisao, desc_supervisao in data_coordenacao['supervisoes']:
                    combinacoes_hierarquicas.append({
                        'diretoria_chave': chave_diretoria,
                        'diretoria_desc': data_diretoria['diretoria'],
                        'gerencia_chave': chave_gerencia,
                        'gerencia_desc': data_gerencia['desc'],
                        'coordenacao_chave': chave_coordenacao,
                        'coordenacao_desc': data_coordenacao['desc'],
                        'supervisao_chave': chave_supervisao,
                        'supervisao_desc': desc_supervisao
                    })
    
    print(f"🏗️ Criadas {len(combinacoes_hierarquicas)} combinações hierárquicas válidas")
    
    # Mostrar estrutura criada
    print("\n🏢 Estrutura Hierárquica Organizacional:")
    for combinacao in combinacoes_hierarquicas:
        print(f"   📋 {combinacao['diretoria_desc']} → {combinacao['gerencia_desc']} → {combinacao['coordenacao_desc']} → {combinacao['supervisao_desc']}")
    
    # Distribuir as lojas entre as combinações hierárquicas
    total_lojas = len(chaves_loja)
    lojas_por_combinacao = total_lojas // len(combinacoes_hierarquicas)
    
    hierarquias_distribuidas = []
    
    # Distribuir lojas para cada combinação hierárquica
    for combinacao in combinacoes_hierarquicas:
        hierarquias_distribuidas.extend([combinacao] * lojas_por_combinacao)
    
    # Distribuir lojas restantes aleatoriamente
    lojas_restantes = total_lojas - len(hierarquias_distribuidas)
    for _ in range(lojas_restantes):
        combinacao_aleatoria = random.choice(combinacoes_hierarquicas)
        hierarquias_distribuidas.append(combinacao_aleatoria)
    
    # Embaralhar a distribuição
    random.shuffle(hierarquias_distribuidas)
    
    print(f"📊 Distribuindo ~{lojas_por_combinacao} lojas por combinação hierárquica")

    for i, chave in enumerate(chaves_loja):
        dt_encerramento = fake.date_between(start_date='-6M', end_date='today') if random.random() < 0.1 else None
        motivo_encerramento = fake.sentence(nb_words=4) if dt_encerramento else None
        dt_bloqueio = fake.date_between(start_date='-3M', end_date='today') if random.random() < 0.1 else None
        motivo_bloqueio = fake.sentence(nb_words=5) if dt_bloqueio else None
        chave_paa = random.randint(1000, 9999) if random.random() < 0.6 else None
        nome_paa = fake.name() if chave_paa else None
        cod_mult = random.randint(1, 999) if random.random() < 0.6 else None
        desc_ilha = fake.word().capitalize() if random.random() < 0.4 else None
        nome_ilha = fake.name() if desc_ilha else None
        chave_ger_neg = random.randint(10000, 99999) if random.random() < 0.4 else None
        desc_ger_neg = fake.name() if chave_ger_neg else None
        dt_ult_transacao = fake.date_between(start_date='-2M', end_date='today') if random.random() < 0.8 else None
        
        # Usar hierarquia da distribuição equilibrada
        hierarquia = hierarquias_distribuidas[i]
        diretoria_chave = hierarquia['diretoria_chave']
        diretoria_desc = hierarquia['diretoria_desc']
        gerencia_area_chave = hierarquia['gerencia_chave']
        gerencia_area_desc = hierarquia['gerencia_desc']
        coordenacao_chave = hierarquia['coordenacao_chave']
        coordenacao_desc = hierarquia['coordenacao_desc']
        supervisao_chave = hierarquia['supervisao_chave']
        supervisao_desc = hierarquia['supervisao_desc']
        
        # Selecionar município e UF aleatório
        municipio, uf = random.choice(municipios_uf)
        
        dados.append((
            chave,
            fake.cnpj(),
            fake.company(),
            random.choice(segmentos),
            random.randint(1000, 9999),
            random.randint(1, 999) if random.random() < 0.7 else None,
            fake.city(),
            chave_paa,
            nome_paa,
            fake.date_between(start_date='-3y', end_date='today'),
            fake.date_between(start_date='-3y', end_date='today'),
            fake.date_between(start_date='-3y', end_date='today') if dt_encerramento else None,
            dt_encerramento,
            motivo_encerramento,
            fake.date_between(start_date='-1y', end_date='today'),
            random.choice(status_tablet_opcoes),
            fake.date_between(start_date='-3y', end_date='today'),
            fake.date_between(start_date='-1y', end_date='today'),
            fake.name(),
            fake.phone_number(),
            dt_bloqueio,
            motivo_bloqueio,
            'TRADICIONAL',
            1 if random.random() < 0.5 else 0,
            1 if random.random() < 0.5 else 0,
            1 if random.random() < 0.5 else 0,
            fake.address().replace("\n", " "),
            4100707,
            municipio,
            uf,
            random.choice(quadrantes),
            cod_mult,
            fake.name(),
            diretoria_chave,
            diretoria_desc,
            random.randint(1000, 9999),
            fake.city(),
            gerencia_area_chave,
            gerencia_area_desc,
            coordenacao_chave,
            coordenacao_desc,
            supervisao_chave,
            supervisao_desc,
            random.randint(10000, 99999) if random.random() < 0.6 else None,
            desc_ilha,
            nome_ilha,
            chave_ger_neg,
            desc_ger_neg,
            random.choice(situacoes),
            dt_ult_transacao,
            1 if random.random() < 0.8 else 0,
            1 if random.random() < 0.6 else 0,
            1 if random.random() < 0.7 else 0,
            1 if random.random() < 0.5 else 0,
            round(random.uniform(-1000, 10000), 2) if random.random() < 0.9 else None,
            round(random.uniform(-5000, 20000), 2) if random.random() < 0.9 else None
        ))

    # Inserir os dados no banco
    insert_sql = """
    INSERT INTO TB_ESTR_LOJAS (
        CHAVE_LOJA, CNPJ, NOME_LOJA, DESC_SEGTO, COD_AG_RELACIONAMENTO, NR_PACB, AG_RELACIONAMENTO,
        CHAVE_PAA, NOME_PAA, DT_ENVIO_VAN, DT_INAUGURACAO, DT_INAUGURACAO_BACEN, DT_ENCERRAMENTO_BACEN,
        MOTIVO_ENCERRAMENTO, DT_RETIRADA_EQTO, STATUS_TABLET, DT_IMPLANTACAO_TABLET, DT_RETIRADA_TABLET,
        GTE_RESP_LOJA, TELEFONE_PADRAO, DT_BLOQUEIO, MOTIVO_BLOQUEIO, TIPO_POSTO,
        BE_AVANCADO, BE_ORG_PAGADOR, BE_PLATAFORMA, ENDERECO, COD_IBGE, MUNICIPIO, UF, QUADRANTE,
        COD_MULT, MULTIPLICADOR, DIRE_REG, DIR_REGIONAL, COD_GER_REG, GER_REGIONAL,
        CHAVE_GERENCIA_AREA, DESC_GERENCIA_AREA, CHAVE_COORDENACAO, DESC_COORDENACAO,
        CHAVE_SUPERVISAO, DESC_SUPERVISAO, COD_ILHA, DESC_ILHA, NOME_ILHA,
        CHAVE_GERENCIA_NEGOCIO, DESC_GERENCIA_NEGOCIO, SITUACAO, DT_ULT_TRANSACAO,
        HABILITADO_CONTA, HABILITADO_MICRO, HABILITADO_LIME, HABILITADO_CONSIG,
        SALDO_CX, LIMITE
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    # Inserir os dados em lotes para melhor performance
    print(f"📊 Inserindo {len(dados)} registros na tabela TB_ESTR_LOJAS...")
    
    for i, linha in enumerate(dados):
        try:
            cursor.execute(insert_sql, linha)
            if (i + 1) % 500 == 0:  # Commit a cada 500 registros
                conn.commit()
                print(f"   ✅ {i + 1} registros inseridos...")
        except Exception as e:
            print(f"   ❌ Erro ao inserir registro {i + 1}: {e}")
            continue

    conn.commit()
    print(f"✅ Tabela TB_ESTR_LOJAS populada com sucesso! {len(dados)} registros inseridos.")

    # Exibir estatísticas
    cursor.execute("SELECT COUNT(*) FROM TB_ESTR_LOJAS")
    total_registros = cursor.fetchone()[0]
    print(f"📈 Total de registros na tabela: {total_registros}")

    cursor.execute("SELECT TOP 5 CHAVE_LOJA, NOME_LOJA, DESC_SEGTO, SITUACAO FROM TB_ESTR_LOJAS ORDER BY CHAVE_LOJA")
    amostra = cursor.fetchall()
    print("\n📋 Amostra dos primeiros 5 registros:")
    print("CHAVE_LOJA | NOME_LOJA | DESC_SEGTO | SITUACAO")
    print("-" * 60)
    for registro in amostra:
        print(f"{registro[0]} | {registro[1][:20]}... | {registro[2]} | {registro[3]}")
    
    # Exibir distribuição das hierarquias
    print("\n📊 Distribuição das Hierarquias:")
    
    # Diretorias
    cursor.execute("SELECT DIR_REGIONAL, COUNT(*) FROM TB_ESTR_LOJAS GROUP BY DIR_REGIONAL ORDER BY DIR_REGIONAL")
    diretorias_stats = cursor.fetchall()
    print("\n🏢 Diretorias:")
    for desc, count in diretorias_stats:
        print(f"   {desc}: {count} lojas")
    
    # Gerências de Área
    cursor.execute("SELECT DESC_GERENCIA_AREA, COUNT(*) FROM TB_ESTR_LOJAS GROUP BY DESC_GERENCIA_AREA ORDER BY DESC_GERENCIA_AREA")
    gerencias_stats = cursor.fetchall()
    print("\n🏢 Gerências de Área:")
    for desc, count in gerencias_stats:
        print(f"   {desc}: {count} lojas")
    
    # Coordenações
    cursor.execute("SELECT DESC_COORDENACAO, COUNT(*) FROM TB_ESTR_LOJAS GROUP BY DESC_COORDENACAO ORDER BY DESC_COORDENACAO")
    coordenacoes_stats = cursor.fetchall()
    print("\n🏢 Coordenações:")
    for desc, count in coordenacoes_stats:
        print(f"   {desc}: {count} lojas")
    
    # Supervisões
    cursor.execute("SELECT DESC_SUPERVISAO, COUNT(*) FROM TB_ESTR_LOJAS GROUP BY DESC_SUPERVISAO ORDER BY DESC_SUPERVISAO")
    supervisoes_stats = cursor.fetchall()
    print("\n🏢 Supervisões:")
    for desc, count in supervisoes_stats:
        print(f"   {desc}: {count} lojas")
    
    # Verificar hierarquia organizacional
    print("\n🔍 Verificação da Hierarquia Organizacional:")
    cursor.execute("""
        SELECT DISTINCT 
            DIRE_REG, DIR_REGIONAL, 
            CHAVE_GERENCIA_AREA, DESC_GERENCIA_AREA,
            CHAVE_COORDENACAO, DESC_COORDENACAO,
            CHAVE_SUPERVISAO, DESC_SUPERVISAO,
            COUNT(*) as QTD_LOJAS
        FROM TB_ESTR_LOJAS 
        GROUP BY DIRE_REG, DIR_REGIONAL, 
                 CHAVE_GERENCIA_AREA, DESC_GERENCIA_AREA,
                 CHAVE_COORDENACAO, DESC_COORDENACAO,
                 CHAVE_SUPERVISAO, DESC_SUPERVISAO
        ORDER BY DIRE_REG, CHAVE_GERENCIA_AREA, CHAVE_COORDENACAO, CHAVE_SUPERVISAO
    """)
    
    hierarquia_check = cursor.fetchall()
    print("Hierarquia Completa (Dir → Ger → Coord → Sup):")
    
    for row in hierarquia_check:
        dir_chave, dir_desc, ger_chave, ger_desc, coord_chave, coord_desc, sup_chave, sup_desc, qtd = row
        print(f"   📊 {qtd:4d} lojas: {dir_desc} ({dir_chave}) → {ger_desc} ({ger_chave}) → {coord_desc} ({coord_chave}) → {sup_desc} ({sup_chave})")
    
    # Verificar consistência da hierarquia
    print("\n✅ Verificação de Consistência:")
    
    # Verificar se cada coordenação pertence a apenas uma gerência
    cursor.execute("""
        SELECT CHAVE_COORDENACAO, DESC_COORDENACAO, COUNT(DISTINCT CHAVE_GERENCIA_AREA) as QTD_GERENCIAS
        FROM TB_ESTR_LOJAS 
        GROUP BY CHAVE_COORDENACAO, DESC_COORDENACAO
        HAVING COUNT(DISTINCT CHAVE_GERENCIA_AREA) > 1
    """)
    
    coord_inconsistente = cursor.fetchall()
    if coord_inconsistente:
        print("❌ Coordenações com múltiplas gerências (ERRO):")
        for coord_chave, coord_desc, qtd_ger in coord_inconsistente:
            print(f"   {coord_desc} ({coord_chave}) pertence a {qtd_ger} gerências")
    else:
        print("✅ Todas as coordenações pertencem a apenas 1 gerência")
    
    # Verificar se cada supervisão pertence a apenas uma coordenação
    cursor.execute("""
        SELECT CHAVE_SUPERVISAO, DESC_SUPERVISAO, COUNT(DISTINCT CHAVE_COORDENACAO) as QTD_COORDENACOES
        FROM TB_ESTR_LOJAS 
        GROUP BY CHAVE_SUPERVISAO, DESC_SUPERVISAO
        HAVING COUNT(DISTINCT CHAVE_COORDENACAO) > 1
    """)
    
    sup_inconsistente = cursor.fetchall()
    if sup_inconsistente:
        print("❌ Supervisões com múltiplas coordenações (ERRO):")
        for sup_chave, sup_desc, qtd_coord in sup_inconsistente:
            print(f"   {sup_desc} ({sup_chave}) pertence a {qtd_coord} coordenações")
    else:
        print("✅ Todas as supervisões pertencem a apenas 1 coordenação")

except Exception as e:
    print(f"❌ Erro durante a execução: {e}")
    
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
    print("\n🔐 Conexão com o banco fechada.")

