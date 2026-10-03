import type { ParsedCommand } from '../bash-parser/index.js';
import { isSafeRedirectTarget } from './path-guard.js';

const REDIRECTION_CHAR = /[<>]/;

// Fail closed: any `<` or `>` the parser did not fold into a structured redirection is an
// unrecognised redirection (input glued mid-command, `<>`, quoted literals like `"a>b"`, ...).
// Recognised redirections must be fd duplications or output to a safe target.
export function areRedirectionsSafe({
  name,
  args,
  redirections,
}: Pick<ParsedCommand, 'name' | 'args' | 'redirections'>): boolean {
  if ([name, ...args].some((token) => REDIRECTION_CHAR.test(token))) return false;
  return redirections.every((redirection) => {
    switch (redirection.kind) {
      case 'fd-dup':
        return true;
      case 'output':
        return isSafeRedirectTarget(redirection.target);
      case 'input':
        return false;
    }
  });
}
