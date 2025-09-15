/**
 * Script de teste para verificar a conexão com o banco e tabela de tratativas
 */

const { sql, pool, poolConnect } = require('./config/db');

async function testConnection() {
  try {
    console.log('🔌 Testando conexão com o banco...');
    
    // Conectar ao banco
    await poolConnect;
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar se a tabela existe
    console.log('🔍 Verificando se a tabela TESTE..tratativas_pontos_ativos existe...');
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as table_exists
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'TESTE' 
        AND TABLE_NAME = 'tratativas_pontos_ativos'
    `);
    
    if (tableCheck.recordset[0].table_exists > 0) {
      console.log('✅ Tabela TESTE..tratativas_pontos_ativos encontrada!');
      
      // Testar inserção de dados
      console.log('🧪 Testando inserção de dados...');
      
      const insertQuery = `
        INSERT INTO TESTE..tratativas_pontos_ativos (
          chave_loja,
          usuario_id,
          nome_usuario,
          data_contato,
          foi_tratado,
          descricao_tratativa,
          quando_volta_operar,
          situacao,
          tipo
        ) VALUES (
          @chave_loja,
          @usuario_id,
          @nome_usuario,
          @data_contato,
          @foi_tratado,
          @descricao_tratativa,
          @quando_volta_operar,
          @situacao,
          @tipo
        )
      `;
      
      const request = pool.request();
      request.input('chave_loja', sql.VarChar(50), 'TEST001');
      request.input('usuario_id', sql.VarChar(100), 'test_user');
      request.input('nome_usuario', sql.VarChar(200), 'Usuário de Teste');
      request.input('data_contato', sql.Date, new Date());
      request.input('foi_tratado', sql.Char(3), 'sim');
      request.input('descricao_tratativa', sql.VarChar(sql.MAX), 'Teste de inserção via script');
      request.input('quando_volta_operar', sql.Date, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 dias
      request.input('situacao', sql.VarChar(20), 'tratada');
      request.input('tipo', sql.VarChar(50), 'pontos-ativos');
      
      await request.query(insertQuery);
      console.log('✅ Dados inseridos com sucesso!');
      
      // Buscar os dados inseridos
      console.log('🔍 Verificando dados inseridos...');
      const selectResult = await pool.request()
        .input('chave_loja', sql.VarChar(50), 'TEST001')
        .query('SELECT * FROM TESTE..tratativas_pontos_ativos WHERE chave_loja = @chave_loja');
      
      console.log('📊 Dados encontrados:', selectResult.recordset.length, 'registros');
      console.log('📝 Último registro:', selectResult.recordset[selectResult.recordset.length - 1]);
      
      // Limpar dados de teste
      console.log('🧹 Limpando dados de teste...');
      await pool.request()
        .input('chave_loja', sql.VarChar(50), 'TEST001')
        .query('DELETE FROM TESTE..tratativas_pontos_ativos WHERE chave_loja = @chave_loja');
      console.log('✅ Dados de teste removidos!');
      
    } else {
      console.log('❌ Tabela TESTE..tratativas_pontos_ativos NÃO encontrada!');
      console.log('📋 Execute o script SQL primeiro: src/sql/create_tratativas_pontos_ativos.sql');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // Fechar conexão
    try {
      await pool.close();
      console.log('🔐 Conexão com o banco fechada.');
    } catch (error) {
      console.error('❌ Erro ao fechar conexão:', error);
    }
  }
}

// Executar teste
testConnection();
