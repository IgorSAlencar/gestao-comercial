export function normalizeFuncional(raw: string, options?: { maxLength?: number }): string {
  if (!raw) return "";
  const hasMaxLength = typeof options?.maxLength === 'number' && Number.isFinite(options.maxLength);
  const maxLength = hasMaxLength ? (options as { maxLength: number }).maxLength : undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";

  const lower = trimmed.toLowerCase();

  const letterToDigitMap: Record<string, string> = {
    a: "1",
    b: "2",
    c: "3",
    d: "4",
    e: "5",
    f: "6",
    g: "7",
    h: "8",
    i: "9",
  };

  const digits: string[] = [];

  // Handle first character: allow a-i mapping or a digit
  const firstChar = lower[0];
  if (firstChar in letterToDigitMap) {
    digits.push(letterToDigitMap[firstChar]);
  } else if (/\d/.test(firstChar)) {
    digits.push(firstChar);
  }

  // Handle remaining characters: keep only digits
  for (let index = 1; index < lower.length; index += 1) {
    const ch = lower[index];
    if (/\d/.test(ch)) {
      digits.push(ch);
    }
  }

  // Limit to desired length only if provided
  const normalized = digits.join("");
  return typeof maxLength === 'number' ? normalized.slice(0, maxLength) : normalized;
}


