/**
 * Script para testar a verificação de permissão para criação de eventos
 */

const { sql, pool, poolConnect } = require('../config/db');

// Função para normalizar UUID
const normalizeUUID = (uuid) => {
  if (!uuid) return null;
  
  // Garantir que o UUID esteja no formato correto com hífens
  // Primeiro remover hífens e converter para maiúsculas
  const clean = uuid.replace(/-/g, '').toUpperCase();
  
  // Então reinsere os hífens no formato correto para SQL Server
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }
  
  // Se não conseguir formatar, retorna o original
  return uuid;
};

async function testPermission() {
  try {
    //console.log('Conectando ao banco de dados...');
    await poolConnect;
    
    //console.log('\n=== TESTE DE PERMISSÃO PARA CRIAÇÃO DE EVENTOS ===\n');
    
    // 1. Obter os usuários do sistema
    const users = await pool.request().query(`
      SELECT id, name, role FROM TESTE..users
      ORDER BY role, name
    `);
    
    //console.log('Usuários disponíveis:');
    users.recordset.forEach((user, index) => {
      //console.log(`${index + 1}. ${user.name} (${user.role}) - ID: ${user.id}`);
    });
    
    // Testar todas as combinações
    //console.log('\n=== MATRIZ DE PERMISSÕES ===');
    //console.log('(Quem pode criar evento para quem)\n');
    
    // Cabeçalho
    let header = 'CRIADOR ↓ / ALVO →';
    users.recordset.forEach(user => {
      header += `\t${user.name.substring(0, 10)}`;
    });
    //console.log(header);
    
    // Linhas
    for (const creator of users.recordset) {
      let row = `${creator.name.substring(0, 10)}`;
      
      for (const target of users.recordset) {
        // Verificar permissão
        const userRole = creator.role;
        const normalizedUserId = normalizeUUID(creator.id);
        const normalizedSupervisorId = normalizeUUID(target.id);
        
        let hasPermission = false;
        
        // Se o usuário é supervisor, só pode criar para si mesmo
        if (userRole === 'supervisor') {
          hasPermission = normalizedUserId === normalizedSupervisorId;
        }
        // Se o usuário é admin, pode criar para qualquer um
        else if (userRole === 'admin') {
          hasPermission = true;
        }
        // Para gerente e coordenador, verificar hierarquia
        else {
          let query = '';
          
          // Para gerentes, incluir supervisores diretos e indiretos
          if (userRole === 'gerente') {
            query = `
              SELECT COUNT(*) as count FROM (
                -- Supervisores diretamente subordinados ao gerente
                SELECT subordinate_id 
                FROM TESTE..hierarchy 
                WHERE subordinate_id = @supervisorId AND superior_id = @userId
                
                UNION
                
                -- Supervisores sob coordenadores que estão subordinados ao gerente
                SELECT h2.subordinate_id
                FROM TESTE..hierarchy h1
                JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
                WHERE h1.superior_id = @userId AND h2.subordinate_id = @supervisorId
              ) AS subordinates
            `;
          }
          // Para coordenadores, apenas supervisores diretos
          else if (userRole === 'coordenador') {
            query = `
              SELECT COUNT(*) as count FROM TESTE..hierarchy 
              WHERE subordinate_id = @supervisorId AND superior_id = @userId
            `;
          }
          
          // Executar a verificação
          const checkResult = await pool.request()
            .input('supervisorId', sql.UniqueIdentifier, normalizedSupervisorId)
            .input('userId', sql.UniqueIdentifier, normalizedUserId)
            .query(query);
          
          hasPermission = checkResult.recordset[0].count > 0;
        }
        
        // Adicionar resultado à linha
        row += `\t${hasPermission ? 'SIM' : 'NÃO'}`;
      }
      
      //console.log(row);
    }
    
    //console.log('\n=== TESTES ESPECÍFICOS ===\n');
    
    // Teste específico do gerente para os supervisores
    const gerente = users.recordset.find(u => u.role === 'gerente');
    const supervisores = users.recordset.filter(u => u.role === 'supervisor');
    
    if (gerente && supervisores.length > 0) {
      //console.log(`Testando gerente ${gerente.name} criando para supervisores:`);
      
      for (const supervisor of supervisores) {
        // Verificar permissão direta
        const diretaResult = await pool.request()
          .input('gerenteId', sql.UniqueIdentifier, gerente.id)
          .input('supervisorId', sql.UniqueIdentifier, supervisor.id)
          .query(`
            SELECT COUNT(*) as count FROM TESTE..hierarchy
            WHERE superior_id = @gerenteId AND subordinate_id = @supervisorId
          `);
        
        const temRelacaoDireta = diretaResult.recordset[0].count > 0;
        
        // Verificar permissão indireta
        const indiretaResult = await pool.request()
          .input('gerenteId', sql.UniqueIdentifier, gerente.id)
          .input('supervisorId', sql.UniqueIdentifier, supervisor.id)
          .query(`
            SELECT COUNT(*) as count
            FROM TESTE..hierarchy h1
            JOIN TESTE..hierarchy h2 ON h1.subordinate_id = h2.superior_id
            WHERE h1.superior_id = @gerenteId AND h2.subordinate_id = @supervisorId
          `);
        
        const temRelacaoIndireta = indiretaResult.recordset[0].count > 0;
        
        //console.log(`- Para ${supervisor.name}:`);
        //console.log(`  * Relação direta: ${temRelacaoDireta ? 'SIM' : 'NÃO'}`);
        //console.log(`  * Relação indireta: ${temRelacaoIndireta ? 'SIM' : 'NÃO'}`);
        //console.log(`  * Permissão final: ${temRelacaoDireta || temRelacaoIndireta ? 'SIM' : 'NÃO'}`);
      }
    }
    
    //console.log('\nTeste de permissão concluído!\n');
    
  } catch (error) {
    console.error('Erro ao testar permissões:', error);
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
testPermission(); 