// Normaliza o funcional para formato numérico (espelha src/utils/normalizeFuncional.ts)
function normalizeFuncional(raw, options) {
  if (!raw) return '';
  const hasMaxLength = typeof options?.maxLength === 'number' && Number.isFinite(options.maxLength);
  const maxLength = hasMaxLength ? options.maxLength : undefined;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return '';

  const lower = trimmed.toLowerCase();
  const letterToDigitMap = { a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7', h: '8', i: '9' };

  const digits = [];

  // Primeiro caractere: a..i -> 1..9 ou mantém dígito
  const firstChar = lower[0];
  if (Object.prototype.hasOwnProperty.call(letterToDigitMap, firstChar)) {
    digits.push(letterToDigitMap[firstChar]);
  } else if (/\d/.test(firstChar)) {
    digits.push(firstChar);
  }

  // Restante: mantém apenas dígitos
  for (let i = 1; i < lower.length; i += 1) {
    const ch = lower[i];
    if (/\d/.test(ch)) digits.push(ch);
  }

  const normalized = digits.join('');
  return typeof maxLength === 'number' ? normalized.slice(0, maxLength) : normalized;
}

// Converte o primeiro dígito 1..9 para letra a..i para uso no LDAP
function toLdapUserFromNumeric(numeric) {
  if (!numeric || numeric.length === 0) return numeric;
  const digitToLetterMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e', '6': 'f', '7': 'g', '8': 'h', '9': 'i' };
  const first = numeric[0];
  const mappedFirst = digitToLetterMap[first] || first;
  return mappedFirst + numeric.slice(1);
}

module.exports = { normalizeFuncional, toLdapUserFromNumeric };

