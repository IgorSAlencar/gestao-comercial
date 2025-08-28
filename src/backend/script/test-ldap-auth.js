/**
 * Teste de autenticação via LDAP + verificação no banco
 *
 * Como usar:
 * 1) Instale a dependência (no backend):
 *    npm install ldapjs
 *
 * 2) Configure variáveis de ambiente (opcional):
 *    - LDAP_URL       (ex: ldap://MZ-VV-DC-002)
 *    - LDAP_DOMAIN    (ex: CORP)
 *    - LDAP_TIMEOUT   (ms, ex: 5000)
 *
 * 3) Execute passando usuário e senha:
 *    node src/backend/script/test-ldap-auth.js --user 9444168 --pass 123456
 *
 *    ou use variáveis de ambiente (recomendado):
 *    set LDAP_USER=9444168 & set LDAP_PASS=123456 & node src/backend/script/test-ldap-auth.js
 *    (Evite usar USERNAME, pois no Windows pode ser o usuário do SO)
 */

/* eslint-disable no-console */
try { require('dotenv').config(); } catch (_) {}

const path = require('path');

// Tente carregar ldapjs com mensagem amigável caso não esteja instalado
let ldap;
try {
  ldap = require('ldapjs');
} catch (e) {
  console.error('\n[ERRO] Dependência ausente: ldapjs');
  console.error('Instale com: npm install ldapjs');
  process.exit(1);
}

const { sql, pool, poolConnect } = require('../config/db');
const { normalizeFuncional, toLdapUserFromNumeric } = require('../utils/normalizeFuncional');

// Leitura de args simples
function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

const usernameArg = getArg('--user') || process.env.LDAP_USER || process.env.AD_USER || process.env.USERNAME;
const passwordArg = getArg('--pass') || process.env.LDAP_PASS || process.env.AD_PASSWORD || process.env.PASSWORD;

if (!usernameArg || !passwordArg) {
  console.log('\nUso:');
  console.log('  node', path.relative(process.cwd(), __filename), '--user <usuario> --pass <senha>');
  console.log('\nOu defina as variáveis LDAP_USER e LDAP_PASS.');
  process.exit(1);
}

const LDAP_URL = process.env.LDAP_URL || 'ldap://MZ-VV-DC-002';
const LDAP_DOMAIN = process.env.LDAP_DOMAIN || 'CORP';
const LDAP_TIMEOUT = Number(process.env.LDAP_TIMEOUT || 5000);

async function bindToLdap(username, password) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: LDAP_URL,
      timeout: LDAP_TIMEOUT,
      connectTimeout: LDAP_TIMEOUT,
      reconnect: false,
    });

    const dn = `${LDAP_DOMAIN}\\${username}`; // Ex.: CORP\\a444168 (LDAP usa letra se primeiro dígito 1..9)

    client.on('error', (err) => {
      // Erros de socket/conexão
      reject(err);
    });

    client.bind(dn, password, (err) => {
      if (err) {
        // Em caso de falha no bind, finalize a conexão e rejeite
        try {
          client.unbind(() => reject(err));
        } catch (_) {
          reject(err);
        }
        return;
      }
      // Sucesso no bind
      try {
        client.unbind(() => resolve(true));
      } catch (_) {
        resolve(true);
      }
    });
  });
}

async function checkUserInDatabase(funcional) {
  await poolConnect; // garante conexão com SQL Server
  const result = await pool
    .request()
    .input('funcional', sql.NVarChar, funcional)
    .query('SELECT id, name, funcional, role, email FROM teste..users WHERE funcional = @funcional');
  return result.recordset[0];
}

(async () => {
  const numericUser = normalizeFuncional(usernameArg, { maxLength: 7 });
  const ldapUser = toLdapUserFromNumeric(numericUser);

  console.log('--- Teste LDAP + Banco ---');
  console.log('Servidor LDAP :', LDAP_URL);
  console.log('Domínio LDAP  :', LDAP_DOMAIN);
  console.log('Entrada       :', usernameArg);
  console.log('LDAP user     :', ldapUser);
  console.log('DB funcional  :', numericUser);

  try {
    console.log('\n1) Tentando autenticar no AD (LDAP)...');
    await bindToLdap(ldapUser, passwordArg);
    console.log('   ✔ Autenticação LDAP bem-sucedida');
  } catch (err) {
    console.error('   ✖ Falha na autenticação LDAP');
    console.error('     Detalhes:', err && err.message ? err.message : err);
    process.exit(1);
  }

  try {
    console.log('\n2) Verificando usuário no banco (teste..users)...');
    const user = await checkUserInDatabase(numericUser);
    if (!user) {
      console.log('   ⚠ Usuário autenticado no AD, mas não encontrado no sistema');
      process.exit(2);
    }
    console.log('   ✔ Usuário encontrado no sistema');
    console.log('     ->', { id: user.id, name: user.name, funcional: user.funcional, role: user.role, email: user.email });
    console.log('\nTudo certo! LDAP + Banco OK.');
    process.exit(0);
  } catch (err) {
    console.error('   ✖ Erro ao consultar o banco');
    console.error('     Detalhes:', err && err.message ? err.message : err);
    process.exit(3);
  }
})();

