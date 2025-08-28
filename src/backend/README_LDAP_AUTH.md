# Autenticação LDAP com Fallback SQL

Este backend autentica usuários priorizando o Active Directory (LDAP). Caso o LDAP não valide, o sistema faz fallback para a autenticação genérica via banco de dados (SQL). A normalização do funcional segue a mesma regra do frontend.

## Fluxo de Login

- Prioridade: LDAP
  - Normaliza o funcional para numérico (máx. 7).
  - Constrói o usuário de LDAP convertendo o 1º dígito (1..9) em letra (a..i).
  - Faz o bind no AD com `CORP\\<usuario_ldap>` (configurável via envs).
  - Se o bind for bem-sucedido, verifica se o usuário existe no banco (por funcional). Se existir, gera JWT.
- Fallback: SQL (genérico)
  - Se o LDAP falhar, tenta autenticar via banco com `funcional + password`.
  - Se a senha coincidir, permite o login normalmente.

## Transformação do Funcional

- Para o Banco: mantém apenas dígitos; se o 1º caractere for letra `a..i`, mapeia para `1..9`. Limita a 7 dígitos.
- Para o LDAP: a partir do funcional numérico, converte apenas o 1º dígito `1..9` para `a..i`.

Exemplos:
- Entrada `9444168` → Banco: `9444168` | LDAP: `i444168` (9→i)
- Entrada `a123456` → Banco: `1123456` | LDAP: `a123456` (1→a)

## Mensagens de Erro

- LDAP credenciais inválidas e SQL também falhou: `401 Senha incorreta. Não foi possível autenticar via AD.`
- Outras falhas (ex.: usuário inexistente ou indisponibilidade): `401 Funcional ou senha incorretos`.
- LDAP OK porém sem cadastro no sistema: `403 Usuário autenticado no AD, mas não cadastrado no sistema`.

Observação: se o fallback SQL autenticar com sucesso, o login ocorre normalmente (não exibimos o erro do LDAP).

## Variáveis de Ambiente

- `LDAP_URL` (padrão: `ldap://MZ-VV-DC-002`)
- `LDAP_DOMAIN` (padrão: `CORP`)
- `LDAP_TIMEOUT` (padrão: `5000` ms)

Config da API (porta/host) em `src/backend/config/config.js`.

## Dependências

- `ldapjs` para integração com AD: `npm install ldapjs`
- Banco: configurado em `src/backend/config/db.js`

## Pontos de Código

- Rota de login: `src/backend/routes/auth.js`
- Utilitários de normalização: `src/backend/utils/normalizeFuncional.js`
- Cliente LDAP: `src/backend/utils/ldap.js`
- Script de teste: `src/backend/script/test-ldap-auth.js`

## Script de Teste

Permite validar rapidamente o bind LDAP e a existência do usuário no banco.

Como usar:

```
npm install ldapjs
node src/backend/script/test-ldap-auth.js --user 9444168 --pass 123456
```

Ou via variáveis:

```
set LDAP_USER=9444168 & set LDAP_PASS=123456 & node src/backend/script/test-ldap-auth.js
```

Saídas:
- `✔ Autenticação LDAP bem-sucedida` quando o bind funciona.
- `⚠ Usuário autenticado no AD, mas não encontrado no sistema` quando falta cadastro local.

## Log de Auditoria

- Sucesso (LDAP): `method: LDAP`
- Sucesso (fallback SQL): `method: SQL_FALLBACK`
- Falha com senha incorreta no AD: `LDAP_INVALID_CREDENTIALS`

## Dicas e Solução de Problemas

- Falha de rede (timeout/ECONNREFUSED) em LDAP não são tratadas como senha incorreta; o fallback SQL ainda pode permitir o acesso se as credenciais locais forem válidas.
- Verifique firewall/rota entre o servidor da API e o host do AD (`LDAP_URL`).
- Ajuste o domínio conforme sua infraestrutura (`LDAP_DOMAIN`).

