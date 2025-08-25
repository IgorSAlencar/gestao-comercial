/**
 * Script para adicionar relações diretas entre o gerente e supervisores
 * Isso permite que o gerente possa criar eventos diretamente para supervisores
 * mesmo que eles já tenham um coordenador como superior
 */

const { sql, pool, poolConnect } = require('../config/db');

async function addDirectHierarchy() {
  try {
    //console.log('Conectando ao banco de dados...');
    await poolConnect;
    
    //console.log('\n=== ADICIONANDO RELAÇÕES DIRETAS ===\n');
    
    // 1. Identificar gerentes, coordenadores e supervisores
    //console.log('Identificando usuários por papel:');
    
    // Obter gerentes
    const gerentesResult = await pool.request().query(`
      SELECT id, name FROM TESTE..users WHERE role = 'gerente'
    `);
    
    //console.log('\nGerentes encontrados:', gerentesResult.recordset.length);
    for (const gerente of gerentesResult.recordset) {
      //console.log(`- ${gerente.id} | ${gerente.name}`);
      
      // Para cada gerente, encontrar os supervisores que estão abaixo dele indiretamente
      //console.log(`\nBuscando supervisores indiretos do gerente ${gerente.name}:`);
      
      const supervisoresIndiretos = await pool.request()
        .input('gerenteId', sql.UniqueIdentifier, gerente.id)
        .query(`
          SELECT 
            u3.id as supervisor_id, 
            u3.name as supervisor_name,
            u2.id as coordenador_id,
            u2.name as coordenador_name
          FROM TESTE..hierarchy h1
          JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
          JOIN TESTE..users u2 ON h1.subordinate_id = u2.id AND u2.role = 'coordenador'
          JOIN TESTE..users u3 ON h2.subordinate_id = u3.id AND u3.role = 'supervisor'
          WHERE h1.superior_id = @gerenteId
        `);
      
      //console.log(`Supervisores indiretos encontrados: ${supervisoresIndiretos.recordset.length}`);
      
      // Para cada supervisor indireto, verificar se já existe relação direta
      for (const supervisor of supervisoresIndiretos.recordset) {
        //console.log(`\nVerificando relação para: ${supervisor.supervisor_name} (via ${supervisor.coordenador_name})`);
        
        const relacaoExistente = await pool.request()
          .input('gerenteId', sql.UniqueIdentifier, gerente.id)
          .input('supervisorId', sql.UniqueIdentifier, supervisor.supervisor_id)
          .query(`
            SELECT COUNT(*) as count 
            FROM TESTE..hierarchy 
            WHERE superior_id = @gerenteId AND subordinate_id = @supervisorId
          `);
        
        if (relacaoExistente.recordset[0].count > 0) {
          //console.log(`- Relação direta já existe entre ${gerente.name} e ${supervisor.supervisor_name}`);
        } else {
          //console.log(`- Criando relação direta entre ${gerente.name} e ${supervisor.supervisor_name}`);
          
          // Inserir a nova relação direta
          await pool.request()
            .input('gerenteId', sql.UniqueIdentifier, gerente.id)
            .input('supervisorId', sql.UniqueIdentifier, supervisor.supervisor_id)
            .query(`
              INSERT INTO TESTE..hierarchy (superior_id, subordinate_id)
              VALUES (@gerenteId, @supervisorId)
            `);
          
          //console.log(`  → Relação criada com sucesso!`);
        }
      }
    }
    
    //console.log('\nProcesso concluído!\n');
    
  } catch (error) {
    console.error('Erro ao adicionar relações diretas:', error);
  } finally {
    // Fechar a conexão com o banco
    try {
      await pool.close();
    } catch (err) {
      console.error('Erro ao fechar a conexão:', err);
    }
    process.exit(0);
  }
}

// Executar a função principal
addDirectHierarchy(); 