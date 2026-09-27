export function isQuoteChar(c: string): c is '"' | "'" {
  return c === '"' || c === "'";
}
