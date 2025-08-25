/**
 * Script para extrair e mostrar a estrutura completa da hierarquia de usuários
 * Ajuda a depurar problemas de permissão relacionados à estrutura hierárquica
 */

const { sql, pool, poolConnect } = require('../config/db');

async function dumpHierarchy() {
  try {
    //console.log('Conectando ao banco de dados...');
    await poolConnect;
    
    //console.log('\n=== HIERARQUIA DE USUÁRIOS ===\n');
    
    // 1. Obter todos os usuários
    //console.log('Listando todos os usuários:');
    const usersResult = await pool.request().query(`
      SELECT id, name, role, funcional FROM TESTE..users
      ORDER BY role, name
    `);
    
    //console.log('\nUsuários encontrados:', usersResult.recordset.length);
    usersResult.recordset.forEach(user => {
      //console.log(`- ${user.id} | ${user.name} | ${user.role} | ${user.funcional}`);
    });
    
    // 2. Obter todas as relações hierárquicas
    //console.log('\nRelações hierárquicas:');
    const hierarchyResult = await pool.request().query(`
      SELECT 
        h.id, 
        h.superior_id, 
        h.subordinate_id,
        u1.name as superior_name, 
        u1.role as superior_role,
        u2.name as subordinate_name, 
        u2.role as subordinate_role
      FROM TESTE..hierarchy h
      JOIN TESTE..users u1 ON h.superior_id = u1.id
      JOIN TESTE..users u2 ON h.subordinate_id = u2.id
      ORDER BY u1.role, u1.name, u2.role, u2.name
    `);
    
    //console.log('\nTotal de relações encontradas:', hierarchyResult.recordset.length);
    hierarchyResult.recordset.forEach((rel, index) => {
      //console.log(`\nRelação #${index + 1}:`);
      //console.log(`- Superior: ${rel.superior_name} (${rel.superior_role})`);
      //console.log(`- Subordinado: ${rel.subordinate_name} (${rel.subordinate_role})`);
      //console.log(`- IDs: ${rel.superior_id} > ${rel.subordinate_id}`);
    });
    
    // 3. Verificar relações indiretas (gerente > coordenador > supervisor)
    //console.log('\nRelações indiretas (gerente > coordenador > supervisor):');
    const indirectResult = await pool.request().query(`
      SELECT 
        h1.superior_id as gerente_id,
        u1.name as gerente_name,
        h1.subordinate_id as coordenador_id,
        u2.name as coordenador_name,
        h2.subordinate_id as supervisor_id,
        u3.name as supervisor_name
      FROM TESTE..hierarchy h1
      JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
      JOIN TESTE..users u1 ON h1.superior_id = u1.id AND u1.role = 'gerente'
      JOIN TESTE..users u2 ON h1.subordinate_id = u2.id AND u2.role = 'coordenador'
      JOIN TESTE..users u3 ON h2.subordinate_id = u3.id AND u3.role = 'supervisor'
      ORDER BY u1.name, u2.name, u3.name
    `);
    
    //console.log('\nTotal de relações indiretas encontradas:', indirectResult.recordset.length);
    indirectResult.recordset.forEach((rel, index) => {
      //console.log(`\nRelação indireta #${index + 1}:`);
      //console.log(`- Gerente: ${rel.gerente_name} (ID: ${rel.gerente_id})`);
      //console.log(`- Coordenador: ${rel.coordenador_name} (ID: ${rel.coordenador_id})`);
      //console.log(`- Supervisor: ${rel.supervisor_name} (ID: ${rel.supervisor_id})`);
    });
    
    //console.log('\nDump de hierarquia concluído!\n');
    
  } catch (error) {
    console.error('Erro ao fazer dump da hierarquia:', error);
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
dumpHierarchy(); 