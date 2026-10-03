export type Redirection =
  | { kind: 'fd-dup'; operator: string }
  | { kind: 'output' | 'input'; operator: string; target: string };

// An fd digit only counts as part of an operator at the start of a word (`2>f`, not `file2>f`).
const START_OF_WORD = '(?<![\\s\\S])';
const FD = `(?:${START_OF_WORD}[0-2])?`;
const FD_DUP = `${FD}>&[0-2]`;
const FILE_OPERATOR = `&>>?|${FD}>>?|${FD}<<?`;

const OPERATOR_SPLIT = new RegExp(`(${FD_DUP}|${FILE_OPERATOR})`);
const FD_DUP_TOKEN = new RegExp(`^${FD_DUP}$`);
const FILE_OPERATOR_TOKEN = new RegExp(`^(?:${FILE_OPERATOR})$`);

export function splitOperators(token: string): string[] {
  return token.split(OPERATOR_SPLIT).filter((part) => part !== '');
}

export function extractRedirections(tokens: string[]): {
  args: string[];
  redirections: Redirection[];
} {
  const redirections: Redirection[] = [];
  let end = tokens.length;

  while (end > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- defined: `end > 0`
    const last = tokens[end - 1]!;
    const prev = end >= 2 ? tokens[end - 2] : undefined;

    if (FD_DUP_TOKEN.test(last)) {
      redirections.unshift({ kind: 'fd-dup', operator: last });
      end -= 1;
    } else if (prev !== undefined && FILE_OPERATOR_TOKEN.test(prev) && !isOperatorToken(last)) {
      const kind = prev.includes('>') ? 'output' : 'input';
      redirections.unshift({ kind, operator: prev, target: last });
      end -= 2;
    } else {
      break;
    }
  }

  return { args: tokens.slice(0, end), redirections };
}

function isOperatorToken(token: string): boolean {
  return FD_DUP_TOKEN.test(token) || FILE_OPERATOR_TOKEN.test(token);
}
