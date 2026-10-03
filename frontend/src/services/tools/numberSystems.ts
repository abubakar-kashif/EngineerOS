export type NumberBase = "binary" | "octal" | "decimal" | "hexadecimal";

const DIGITS: Record<NumberBase, string> = {
  binary: "01",
  octal: "01234567",
  decimal: "0123456789",
  hexadecimal: "0123456789abcdef",
};

const RADIX: Record<NumberBase, number> = {
  binary: 2,
  octal: 8,
  decimal: 10,
  hexadecimal: 16,
};

export function convertNumberBase(value: string, from: NumberBase, to: NumberBase): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) throw new Error("Enter a value");
  const negative = trimmed.startsWith("-");
  const body = negative ? trimmed.slice(1) : trimmed;
  if (!body) throw new Error("Enter a value");
  const allowed = DIGITS[from];
  if ([...body].some((digit) => !allowed.includes(digit))) {
    throw new Error(`Invalid ${from} digit`);
  }
  const parsed = parseInt(body, RADIX[from]);
  if (!Number.isSafeInteger(parsed)) throw new Error("Value is outside the safe integer range");
  const converted = parsed.toString(RADIX[to]);
  return negative ? `-${converted}` : converted;
}
