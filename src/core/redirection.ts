// The tokenizer doesn't split on `<`/`>`, so redirections can be glued to
// adjacent text (`ls>out`, `cmd 1>>f`, `<>f`). Any `<` or `>` anywhere in a
// token is treated as a redirection; this also rejects quoted literals like
// `"a>b"`, which is an acceptable conservative false positive.
const REDIRECTION_CHAR = /[<>]/;

export function containsRedirection(tokens: string[]): boolean {
  return tokens.some((token) => REDIRECTION_CHAR.test(token));
}
