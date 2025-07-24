const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Função para determinar filtro de hierarquia baseado no usuário
function getHierarchyFilter(userRole, userChave) {
  switch (userRole) {
    case 'admin':
      return ''; // Admin vê tudo
    case 'gerente':
      return `WHERE l.CHAVE_GERENCIA_AREA = ${userChave}`;
    case 'coordenador':
      return `WHERE l.CHAVE_COORDENACAO = ${userChave}`;
    case 'supervisor':
      return `WHERE l.CHAVE_SUPERVISAO = ${userChave}`;
    default:
      return 'WHERE 1=0'; // Não autorizado
  }
}

// Endpoint para buscar lojas por hierarquia
router.post('/lojas', authenticateToken, async (req, res) => {
  const { produto, userChave, userRole } = req.body;
  
  try {
    await poolConnect;
    
    // Buscar chave do usuário autenticado
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query('SELECT chave, role FROM TESTE..users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const { chave: userChaveDB, role: userRoleDB } = userResult.recordset[0];
    
    // Validar se os dados enviados correspondem ao usuário autenticado
    if (userChaveDB !== userChave || userRoleDB !== userRole) {
      return res.status(403).json({ message: 'Dados de hierarquia inválidos' });
    }
    
    const hierarchyFilter = getHierarchyFilter(userRoleDB, userChaveDB);
    
    const query = `
      SELECT 
        l.CHAVE_LOJA,
        l.NOME_LOJA,
        l.CNPJ,
        l.SITUACAO,
        l.ENDERECO,
        l.TELEFONE_PADRAO,
        l.GTE_RESP_LOJA,
        l.DT_INAUGURACAO,
        l.STATUS_TABLET,
        l.HABILITADO_CONTA,
        l.HABILITADO_MICRO,
        l.HABILITADO_LIME,
        l.HABILITADO_CONSIG,
        l.DT_ULT_TRANSACAO,
        l.CHAVE_GERENCIA_AREA,
        l.DESC_GERENCIA_AREA,
        l.CHAVE_COORDENACAO,
        l.DESC_COORDENACAO,
        l.CHAVE_SUPERVISAO,
        l.DESC_SUPERVISAO,
        l.DIR_REGIONAL,
        l.GER_REGIONAL,
        l.AG_RELACIONAMENTO,
        l.COD_AG_RELACIONAMENTO
      FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
      ${hierarchyFilter}
      ORDER BY l.NOME_LOJA
    `;
    
    const result = await pool.request().query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ message: 'Erro ao buscar lojas' });
  }
});

// Endpoint para buscar dados específicos de um produto
router.post('/:produto', authenticateToken, async (req, res) => {
  const { produto } = req.params;
  const { chave_lojas } = req.body;
  
  try {
    await poolConnect;
    
    if (!chave_lojas || chave_lojas.length === 0) {
      return res.status(400).json({ message: 'Lista de chaves de lojas é obrigatória' });
    }
    
    let query = '';
    const chaveLojasList = chave_lojas.join(',');
    
    switch (produto) {
      case 'credito':
      case 'abertura-conta':
      case 'seguro':
        // Buscar dados da TB_ESTR_CONTAS
        query = `
          SELECT 
            c.CHAVE_LOJA,
            c.DT_ULT_AB_CONTA,
            c.MES_M3,
            c.MES_M2,
            c.MES_M1,
            c.MES_M0
          FROM DATAWAREHOUSE..TB_ESTR_CONTAS c
          WHERE c.CHAVE_LOJA IN (${chaveLojasList})
        `;
        break;
      
      case 'pontos-ativos':
      case 'pontos-realizando-negocio':
      case 'pontos-bloqueados':
        // Buscar dados específicos de pontos da TB_ESTR_LOJAS
        query = `
          SELECT 
            l.CHAVE_LOJA,
            l.SITUACAO,
            l.DT_ULT_TRANSACAO,
            l.SALDO_CX,
            l.LIMITE,
            l.HABILITADO_CONTA,
            l.HABILITADO_MICRO,
            l.HABILITADO_LIME,
            l.HABILITADO_CONSIG,
            l.DT_BLOQUEIO,
            l.MOTIVO_BLOQUEIO
          FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
          WHERE l.CHAVE_LOJA IN (${chaveLojasList})
        `;
        break;
      
      default:
        return res.status(400).json({ message: 'Produto não reconhecido' });
    }
    
    const result = await pool.request().query(query);
    res.json(result.recordset);
    
  } catch (error) {
    console.error(`Erro ao buscar dados de ${produto}:`, error);
    res.status(500).json({ message: `Erro ao buscar dados de ${produto}` });
  }
});

// Endpoint consolidado para buscar dados completos de uma estratégia
router.get('/:produto', authenticateToken, async (req, res) => {
  const { produto } = req.params;
  
  // console.log(`🔍 Buscando estratégia: ${produto} para usuário: ${req.userId}`);
  
  try {
    await poolConnect;
    
    // Buscar dados do usuário autenticado
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query('SELECT chave, role FROM TESTE..users WHERE id = @userId');
    
    // console.log(`📊 Resultado da busca do usuário:`, userResult.recordset);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const { chave: userChave, role: userRole } = userResult.recordset[0];
    
    // Se usuário não tem chave definida, retornar erro
    if (!userChave && userRole !== 'admin') {
      // console.error(`❌ Usuário sem chave: ${userRole} - ID: ${req.userId}`);
      return res.status(403).json({ 
        message: `Usuário ${userRole} não possui chave de hierarquia definida. Execute o script SQL para corrigir.`,
        details: {
          userId: req.userId,
          userRole: userRole,
          userChave: userChave
        }
      });
    }
    
    const hierarchyFilter = getHierarchyFilter(userRole, userChave);
    
    // Query principal para buscar lojas com dados do produto
    let query = '';
    
    switch (produto) {
      case 'credito':
      case 'abertura-conta':
      case 'seguro':
        query = `
          SELECT 
            l.CHAVE_LOJA,
            l.NOME_LOJA,
            l.CNPJ,
            l.SITUACAO,
            l.ENDERECO,
            l.TELEFONE_PADRAO,
            l.GTE_RESP_LOJA,
            l.DT_INAUGURACAO,
            l.STATUS_TABLET,
            l.HABILITADO_CONTA,
            l.HABILITADO_MICRO,
            l.HABILITADO_LIME,
            l.HABILITADO_CONSIG,
            l.DT_ULT_TRANSACAO,
            l.DESC_GERENCIA_AREA,
            l.DESC_COORDENACAO,
            l.DESC_SUPERVISAO,
            l.DIR_REGIONAL,
            l.GER_REGIONAL,
            l.AG_RELACIONAMENTO,
            l.COD_AG_RELACIONAMENTO,
            l.MUNICIPIO,
            l.UF,
            ISNULL(c.DT_ULT_AB_CONTA, l.DT_ULT_TRANSACAO) as DT_ULT_AB_CONTA,
            ISNULL(c.MES_M3, 0) as MES_M3,
            ISNULL(c.MES_M2, 0) as MES_M2,
            ISNULL(c.MES_M1, 0) as MES_M1,
            ISNULL(c.MES_M0, 0) as MES_M0
          FROM DATAWAREHOUSE..TB_ESTR_CONTAS c
          LEFT JOIN DATAWAREHOUSE..TB_ESTR_LOJAS l ON l.CHAVE_LOJA = c.CHAVE_LOJA
          ${hierarchyFilter}
          ORDER BY l.NOME_LOJA
        `;
        break;
      
      case 'pontos-ativos':
        query = `
          SELECT 
            l.CHAVE_LOJA,
            l.NOME_LOJA,
            l.CNPJ,
            l.SITUACAO,
            l.ENDERECO,
            l.TELEFONE_PADRAO,
            l.GTE_RESP_LOJA,
            l.DT_INAUGURACAO,
            l.STATUS_TABLET,
            l.HABILITADO_CONTA,
            l.HABILITADO_MICRO,
            l.HABILITADO_LIME,
            l.HABILITADO_CONSIG,
            l.DT_ULT_TRANSACAO,
            l.DESC_GERENCIA_AREA,
            l.DESC_COORDENACAO,
            l.DESC_SUPERVISAO,
            l.DIR_REGIONAL,
            l.GER_REGIONAL,
            l.AG_RELACIONAMENTO,
            l.COD_AG_RELACIONAMENTO,
            l.MUNICIPIO,
            l.UF,
            l.SALDO_CX,
            l.LIMITE
          FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
          ${hierarchyFilter}
          AND l.SITUACAO = 'ATIVA'
          ORDER BY l.NOME_LOJA
        `;
        break;
        
      case 'pontos-realizando-negocio':
        query = `
          SELECT 
            l.CHAVE_LOJA,
            l.NOME_LOJA,
            l.CNPJ,
            l.SITUACAO,
            l.ENDERECO,
            l.TELEFONE_PADRAO,
            l.GTE_RESP_LOJA,
            l.DT_INAUGURACAO,
            l.STATUS_TABLET,
            l.HABILITADO_CONTA,
            l.HABILITADO_MICRO,
            l.HABILITADO_LIME,
            l.HABILITADO_CONSIG,
            l.DT_ULT_TRANSACAO,
            l.DESC_GERENCIA_AREA,
            l.DESC_COORDENACAO,
            l.DESC_SUPERVISAO,
            l.DIR_REGIONAL,
            l.GER_REGIONAL,
            l.AG_RELACIONAMENTO,
            l.COD_AG_RELACIONAMENTO,
            l.MUNICIPIO,
            l.UF,
            l.SALDO_CX,
            l.LIMITE
          FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
          ${hierarchyFilter}
          AND l.DT_ULT_TRANSACAO >= DATEADD(month, -3, GETDATE())
          ORDER BY l.DT_ULT_TRANSACAO DESC
        `;
        break;
        
      case 'pontos-bloqueados':
        query = `
          SELECT 
            l.CHAVE_LOJA,
            l.NOME_LOJA,
            l.CNPJ,
            l.SITUACAO,
            l.ENDERECO,
            l.TELEFONE_PADRAO,
            l.GTE_RESP_LOJA,
            l.DT_INAUGURACAO,
            l.STATUS_TABLET,
            l.HABILITADO_CONTA,
            l.HABILITADO_MICRO,
            l.HABILITADO_LIME,
            l.HABILITADO_CONSIG,
            l.DT_ULT_TRANSACAO,
            l.DESC_GERENCIA_AREA,
            l.DESC_COORDENACAO,
            l.DESC_SUPERVISAO,
            l.DIR_REGIONAL,
            l.GER_REGIONAL,
            l.AG_RELACIONAMENTO,
            l.COD_AG_RELACIONAMENTO,
            l.MUNICIPIO,
            l.UF,
            l.DT_BLOQUEIO,
            l.MOTIVO_BLOQUEIO,
            l.SALDO_CX,
            l.LIMITE
          FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
          ${hierarchyFilter}
          AND l.SITUACAO = 'BLOQUEADO'
          ORDER BY l.DT_BLOQUEIO DESC
        `;
        break;
      
      default:
        return res.status(400).json({ message: 'Produto não reconhecido' });
    }
    
    // console.log(`🔍 Executando query para ${produto} com filtro: ${hierarchyFilter}`);
    // console.log(`📋 Query completa:`, query);
    
    const result = await pool.request().query(query);
    
    // console.log(`📊 Resultados encontrados: ${result.recordset.length} lojas`);
    
    // Mapear dados para o formato esperado pelo frontend
    const dadosFormatados = result.recordset.map(row => ({
      chaveLoja: row.CHAVE_LOJA.toString(),
      cnpj: row.CNPJ || '',
      nomeLoja: row.NOME_LOJA || '',
      mesM3: row.MES_M3 || 0,
      mesM2: row.MES_M2 || 0,
      mesM1: row.MES_M1 || 0,
      mesM0: row.MES_M0 || 0,
      situacao: row.SITUACAO?.toLowerCase() || 'ativa',
      dataUltTrxContabil: row.DT_ULT_AB_CONTA,
      dataUltTrxNegocio: row.DT_ULT_TRANSACAO,
      dataBloqueio: row.DT_BLOQUEIO,
      dataInauguracao: row.DT_INAUGURACAO,
      agencia: row.COD_AG_RELACIONAMENTO?.toString() || '',
      codAgRelacionamento: row.COD_AG_RELACIONAMENTO?.toString() || '',
      agRelacionamento: row.AG_RELACIONAMENTO || '',
      telefoneLoja: row.TELEFONE_PADRAO || '',
      nomeContato: row.GTE_RESP_LOJA || '',
      gerenciaRegional: row.DESC_GERENCIA_AREA || '',
      diretoriaRegional: row.DIR_REGIONAL || '',
      municipio: row.MUNICIPIO || '',
      uf: row.UF || '',
      tendencia: calcularTendencia(row.MES_M3, row.MES_M2, row.MES_M1, row.MES_M0),
      endereco: row.ENDERECO || '',
      nomePdv: row.NOME_LOJA || '',
      multiplicadorResponsavel: row.GTE_RESP_LOJA || '',
      dataCertificacao: row.DT_INAUGURACAO,
      situacaoTablet: row.STATUS_TABLET || 'S.Tablet',
      produtosHabilitados: {
        consignado: Boolean(row.HABILITADO_CONSIG),
        microsseguro: Boolean(row.HABILITADO_MICRO),
        lime: Boolean(row.HABILITADO_LIME)
      },
      motivoBloqueio: row.MOTIVO_BLOQUEIO || '',
      saldoCx: row.SALDO_CX,
      limite: row.LIMITE
    }));
    
    res.json({
      produto,
      userRole,
      userChave,
      totalLojas: dadosFormatados.length,
      dadosAnaliticos: dadosFormatados
    });
    
  } catch (error) {
    console.error(`Erro ao buscar estratégia ${produto}:`, error);
    res.status(500).json({ message: `Erro ao buscar dados da estratégia ${produto}` });
  }
});

// Função auxiliar para calcular tendência baseada nos últimos 4 meses
function calcularTendencia(m3, m2, m1, m0) {
  const valores = [m3 || 0, m2 || 0, m1 || 0, m0 || 0];
  const ultimoValor = valores[3]; // M0 (mês atual)
  const penultimoValor = valores[2]; // M1 (mês anterior)
  const antepenultimoValor = valores[1]; // M2
  const mediaAnterior = (valores[0] + valores[1] + valores[2]) / 3;
  
  // Calcular variação percentual entre M1 e M0
  const variacaoPercentual = penultimoValor > 0 ? 
    ((ultimoValor - penultimoValor) / penultimoValor) * 100 : 0;
  
  // Critérios de tendência alinhados com os "Pontos de Atenção"
  
  // 1. QUEDA: Queda significativa (>30%) ou zerou a produção tendo produzido antes
  if ((ultimoValor === 0 && penultimoValor > 0) || 
      (variacaoPercentual <= -30)) {
    return 'queda';
  }
  
  // 2. ATENÇÃO: Queda moderada entre 5% e 30% OU volatilidade alta
  if ((variacaoPercentual > -30 && variacaoPercentual <= -5) ||
      (ultimoValor === 0 && penultimoValor === 0 && antepenultimoValor > 0)) {
    return 'atencao';
  }
  
  // 3. CRESCIMENTO: Crescimento consistente (>10%) ou recuperação após queda
  if (variacaoPercentual >= 10 ||
      (ultimoValor > 0 && penultimoValor === 0 && antepenultimoValor >= 0)) {
    return 'comecando';
  }
  
  // 4. ESTÁVEL: Variação pequena entre -5% e +10%
  return 'estavel';
}

module.exports = router;

// Novo endpoint para buscar métricas calculadas no SQL
router.get('/:produto/metricas', authenticateToken, async (req, res) => {
  const { produto } = req.params;
  
  try {
    await poolConnect;
    
    // Buscar dados do usuário autenticado
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query('SELECT chave, role FROM TESTE..users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const { chave: userChave, role: userRole } = userResult.recordset[0];
    
    // Se usuário não tem chave definida, retornar erro
    if (!userChave && userRole !== 'admin') {
      return res.status(403).json({ 
        message: `Usuário ${userRole} não possui chave de hierarquia definida.`,
        details: {
          userId: req.userId,
          userRole: userRole,
          userChave: userChave
        }
      });
    }
    
    const hierarchyFilter = getHierarchyFilter(userRole, userChave);
    
    // Query para métricas apenas para produtos que usam TB_ESTR_CONTAS
    if (!['credito', 'abertura-conta', 'seguro'].includes(produto)) {
      return res.status(400).json({ message: 'Métricas disponíveis apenas para produtos de conta/crédito/seguro' });
    }
    
    const metricsQuery = `
      SELECT 
        -- Totais de contas
        SUM(ISNULL(c.MES_M0, 0)) as TOTAL_MES_ATUAL,
        SUM(ISNULL(c.MES_M1, 0)) as TOTAL_MES_ANTERIOR,
        SUM(ISNULL(c.MES_M0, 0) - ISNULL(c.MES_M1, 0)) as VARIACAO_TOTAL,
        
        -- Contadores de lojas
        COUNT(*) as LOJAS_NA_ESTRATEGIA,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_C_PRODUCAO_M0,
        SUM(CASE WHEN ISNULL(c.MES_M1, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_C_PRODUCAO_M1,
        
        -- Análises específicas
        SUM(CASE WHEN ISNULL(c.MES_M1, 0) > 0 AND ISNULL(c.MES_M0, 0) = 0 THEN 1 ELSE 0 END) as LOJAS_QUE_ZERARAM,
        SUM(CASE WHEN ISNULL(c.MES_M1, 0) = 0 AND ISNULL(c.MES_M0, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_NOVAS,
        SUM(CASE WHEN ISNULL(c.MES_M2, 0) > 0 AND ISNULL(c.MES_M1, 0) = 0 AND ISNULL(c.MES_M0, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_QUE_VOLTARAM,
        SUM(CASE WHEN ISNULL(c.MES_M1, 0) > 0 AND ISNULL(c.MES_M0, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_ESTAVEIS_ATIVAS,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) < ISNULL(c.MES_M1, 0) THEN 1 ELSE 0 END) as LOJAS_QUEDA_PRODUCAO,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) = 0 THEN 1 ELSE 0 END) as LOJAS_SEM_MOVIMENTO
        
      FROM DATAWAREHOUSE..TB_ESTR_CONTAS c
      LEFT JOIN DATAWAREHOUSE..TB_ESTR_LOJAS l ON l.CHAVE_LOJA = c.CHAVE_LOJA
      ${hierarchyFilter}
    `;
    
    const result = await pool.request().query(metricsQuery);
    const metricas = result.recordset[0];
    
    // Calcular percentuais e outras métricas derivadas
    const totalLojas = metricas.LOJAS_NA_ESTRATEGIA || 0;
    const totalM1 = metricas.TOTAL_MES_ANTERIOR || 0;
    const lojasComProducaoM0 = metricas.LOJAS_C_PRODUCAO_M0 || 0;
    
    // Calcular tendências do lado JavaScript (sem divisão por zero no SQL)
    // Buscar dados individuais para calcular tendências
    const dadosIndividuaisQuery = `
      SELECT 
        ISNULL(c.MES_M3, 0) as MES_M3,
        ISNULL(c.MES_M2, 0) as MES_M2,
        ISNULL(c.MES_M1, 0) as MES_M1,
        ISNULL(c.MES_M0, 0) as MES_M0
      FROM DATAWAREHOUSE..TB_ESTR_CONTAS c
      LEFT JOIN DATAWAREHOUSE..TB_ESTR_LOJAS l ON l.CHAVE_LOJA = c.CHAVE_LOJA
      ${hierarchyFilter}
    `;
    
    const dadosIndividuais = await pool.request().query(dadosIndividuaisQuery);
    
    // Calcular tendências usando a mesma lógica do frontend
    const tendencias = {
      comecando: 0,
      estavel: 0,
      atencao: 0,
      queda: 0
    };
    
    dadosIndividuais.recordset.forEach(loja => {
      const { MES_M3: m3, MES_M2: m2, MES_M1: m1, MES_M0: m0 } = loja;
      const ultimoValor = m0;
      const penultimoValor = m1;
      
      // Calcular variação percentual entre M1 e M0 (protegido contra divisão por zero)
      const variacaoPercentual = penultimoValor > 0 ? 
        ((ultimoValor - penultimoValor) / penultimoValor) * 100 : 0;
      
      // Critérios de tendência alinhados com os "Pontos de Atenção"
      
      // 1. QUEDA: Queda significativa (>30%) ou zerou a produção tendo produzido antes
      if ((ultimoValor === 0 && penultimoValor > 0) || 
          (variacaoPercentual <= -30)) {
        tendencias.queda++;
      }
      // 2. ATENÇÃO: Queda moderada entre 5% e 30% OU volatilidade alta
      else if ((variacaoPercentual > -30 && variacaoPercentual <= -5) ||
          (ultimoValor === 0 && penultimoValor === 0 && m2 > 0)) {
        tendencias.atencao++;
      }
      // 3. CRESCIMENTO: Crescimento consistente (>10%) ou recuperação após queda
      else if (variacaoPercentual >= 10 ||
          (ultimoValor > 0 && penultimoValor === 0 && m2 >= 0)) {
        tendencias.comecando++;
      }
      // 4. ESTÁVEL: Variação pequena entre -5% e +10%
      else {
        tendencias.estavel++;
      }
    });
    
    const response = {
      // Totais
      totalContasM0: metricas.TOTAL_MES_ATUAL || 0,
      totalContasM1: metricas.TOTAL_MES_ANTERIOR || 0,
      variacaoTotal: metricas.VARIACAO_TOTAL || 0,
      
      // Lojas
      totalLojas: totalLojas,
      lojasComProducaoM0: lojasComProducaoM0,
      lojasComProducaoM1: metricas.LOJAS_C_PRODUCAO_M1 || 0,
      
      // Análises específicas
      lojasQueZeraram: metricas.LOJAS_QUE_ZERARAM || 0,
      lojasNovas: metricas.LOJAS_NOVAS || 0,
      lojasQueVoltaram: metricas.LOJAS_QUE_VOLTARAM || 0,
      lojasEstaveisAtivas: metricas.LOJAS_ESTAVEIS_ATIVAS || 0,
      lojasQuedaProducao: metricas.LOJAS_QUEDA_PRODUCAO || 0,
      lojasSemMovimento: metricas.LOJAS_SEM_MOVIMENTO || 0,
      
      // Percentuais calculados (protegidos contra divisão por zero)
      crescimentoPercentual: totalM1 > 0 ? ((metricas.VARIACAO_TOTAL || 0) / totalM1) * 100 : 0,
      produtividadeGeral: totalLojas > 0 ? (lojasComProducaoM0 / totalLojas) * 100 : 0,
      
      // Média por loja (protegida contra divisão por zero)
      mediaPorLoja: lojasComProducaoM0 > 0 ? Math.round((metricas.TOTAL_MES_ATUAL || 0) / lojasComProducaoM0) : 0,
      
      // Tendências calculadas em JavaScript
      tendencias: tendencias,
      
      // Metadados
      produto,
      userRole,
      userChave
    };
    
    res.json(response);
    
  } catch (error) {
    console.error(`Erro ao buscar métricas de ${produto}:`, error);
    res.status(500).json({ message: `Erro ao buscar métricas de ${produto}` });
  }
});

// Novo endpoint para métricas gerenciais por supervisão
router.get('/:produto/metricas-gerenciais', authenticateToken, async (req, res) => {
  const { produto } = req.params;
  
  try {
    await poolConnect;
    
    // Buscar dados do usuário autenticado
    const userResult = await pool.request()
      .input('userId', sql.UniqueIdentifier, req.userId)
      .query('SELECT chave, role FROM TESTE..users WHERE id = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const { chave: userChave, role: userRole } = userResult.recordset[0];
    
    // Verificar se é coordenador ou gerente
    if (!['coordenador', 'gerente'].includes(userRole)) {
      return res.status(403).json({ message: 'Acesso restrito a coordenadores e gerentes' });
    }

    // Query base para buscar supervisores da região
    const supervisoresQuery = `
      SELECT DISTINCT 
        l.DESC_SUPERVISAO,
        l.CHAVE_SUPERVISAO,
        u.name as NOME_SUPERVISOR,
        SUM(ISNULL(c.MES_M0, 0)) as TOTAL_MES_ATUAL,
        SUM(ISNULL(c.MES_M1, 0)) as TOTAL_MES_ANTERIOR,
        COUNT(DISTINCT l.CHAVE_LOJA) as TOTAL_LOJAS,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_ATIVAS,
        SUM(CASE WHEN ISNULL(c.MES_M1, 0) > 0 AND ISNULL(c.MES_M0, 0) = 0 THEN 1 ELSE 0 END) as LOJAS_ZERARAM,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) > ISNULL(c.MES_M1, 0) THEN 1 ELSE 0 END) as LOJAS_CRESCERAM,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) < ISNULL(c.MES_M1, 0) THEN 1 ELSE 0 END) as LOJAS_CAIRAM,
        SUM(CASE WHEN ISNULL(c.MES_M0, 0) = ISNULL(c.MES_M1, 0) AND ISNULL(c.MES_M0, 0) > 0 THEN 1 ELSE 0 END) as LOJAS_ESTAVEIS
      FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
      LEFT JOIN TESTE..users u ON l.CHAVE_SUPERVISAO = u.chave
      LEFT JOIN DATAWAREHOUSE..TB_ESTR_CONTAS c ON l.CHAVE_LOJA = c.CHAVE_LOJA
      WHERE ${userRole === 'coordenador' ? 'l.CHAVE_COORDENACAO' : 'l.CHAVE_GERENCIA_AREA'} = ${userChave}
      GROUP BY l.DESC_SUPERVISAO, l.CHAVE_SUPERVISAO, u.name
      ORDER BY l.DESC_SUPERVISAO
    `;
    
    const result = await pool.request().query(supervisoresQuery);
    
    // Calcular métricas adicionais e formatar resposta
    const metricasGerenciais = result.recordset.map(supervisor => {
      const crescimentoPercentual = supervisor.TOTAL_MES_ANTERIOR > 0 
        ? ((supervisor.TOTAL_MES_ATUAL - supervisor.TOTAL_MES_ANTERIOR) / supervisor.TOTAL_MES_ANTERIOR) * 100 
        : 0;
      
      const produtividadeGeral = supervisor.TOTAL_LOJAS > 0 
        ? (supervisor.LOJAS_ATIVAS / supervisor.TOTAL_LOJAS) * 100 
        : 0;
      
      return {
        descricao: supervisor.DESC_SUPERVISAO,
        chaveSupervisao: supervisor.CHAVE_SUPERVISAO,
        nomeSupervisor: supervisor.NOME_SUPERVISOR,
        metricas: {
          totalContasM0: supervisor.TOTAL_MES_ATUAL,
          totalContasM1: supervisor.TOTAL_MES_ANTERIOR,
          totalLojas: supervisor.TOTAL_LOJAS,
          lojasAtivas: supervisor.LOJAS_ATIVAS,
          lojasZeraram: supervisor.LOJAS_ZERARAM,
          lojasCresceram: supervisor.LOJAS_CRESCERAM,
          lojasCairam: supervisor.LOJAS_CAIRAM,
          lojasEstaveis: supervisor.LOJAS_ESTAVEIS,
          crescimentoPercentual: Number(crescimentoPercentual.toFixed(1)),
          produtividadeGeral: Number(produtividadeGeral.toFixed(1))
        }
      };
    });
    
    res.json({
      produto,
      userRole,
      userChave,
      metricasGerenciais
    });
    
  } catch (error) {
    console.error(`Erro ao buscar métricas gerenciais de ${produto}:`, error);
    res.status(500).json({ message: `Erro ao buscar métricas gerenciais de ${produto}` });
  }
});

module.exports = router; 