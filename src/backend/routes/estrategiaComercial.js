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
          FROM DATAWAREHOUSE..TB_ESTR_LOJAS l
          LEFT JOIN DATAWAREHOUSE..TB_ESTR_CONTAS c ON l.CHAVE_LOJA = c.CHAVE_LOJA
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