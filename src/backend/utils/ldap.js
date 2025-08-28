/* eslint-disable no-console */
try { require('dotenv').config(); } catch (_) {}

let ldap;
try {
  ldap = require('ldapjs');
} catch (e) {
  // Mantemos sem throw aqui; quem chamar trata e pode fazer fallback para SQL
  ldap = null;
}

const LDAP_URL = process.env.LDAP_URL || 'ldap://MZ-VV-DC-002';
const LDAP_DOMAIN = process.env.LDAP_DOMAIN || 'CORP';
const LDAP_TIMEOUT = Number(process.env.LDAP_TIMEOUT || 5000);

function ldapBind(username, password) {
  if (!ldap) {
    const err = new Error('ldapjs não está instalado. Execute: npm install ldapjs');
    err.code = 'LDAPJS_NOT_INSTALLED';
    return Promise.reject(err);
  }
  if (!username || !password) {
    return Promise.reject(new Error('Credenciais LDAP ausentes'));
  }

  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: LDAP_URL,
      timeout: LDAP_TIMEOUT,
      connectTimeout: LDAP_TIMEOUT,
      reconnect: false,
    });

    const dn = `${LDAP_DOMAIN}\\${username}`;

    const onError = (err) => {
      try { client.unbind(() => reject(err)); } catch (_) { reject(err); }
    };

    client.on('error', onError);

    client.bind(dn, password, (err) => {
      if (err) return onError(err);
      try { client.unbind(() => resolve(true)); } catch (_) { resolve(true); }
    });
  });
}

module.exports = {
  ldapBind,
  LDAP_URL,
  LDAP_DOMAIN,
  LDAP_TIMEOUT,
};

