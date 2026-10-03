import { isQuoteChar } from './quote.js';

interface SplitState {
  segments: string[];
  current: string;
  quote: '"' | "'" | null;
  parenDepth: number;
}

export function splitTopLevel(input: string): string[] {
  const state: SplitState = { segments: [], current: '', quote: null, parenDepth: 0 };

  for (let i = 0; i < input.length; i += 1) {
    const char = input.charAt(i);
    const next = input.charAt(i + 1);

    if (state.quote) {
      consumeQuotedChar(state, char);
      continue;
    }

    const consumed = consumeUnquotedChar(state, char, next);
    if (consumed === 2) i += 1;
  }

  state.segments.push(state.current);
  return state.segments;
}

function consumeQuotedChar(state: SplitState, char: string): void {
  state.current += char;
  if (char === state.quote) state.quote = null;
}

function consumeUnquotedChar(state: SplitState, char: string, next: string): 1 | 2 {
  if (isQuoteChar(char)) {
    state.quote = char;
    state.current += char;
    return 1;
  }

  if (char === '(' || char === ')') {
    updateParenDepth(state, char);
    return 1;
  }

  if (state.parenDepth === 0 && isOperatorAt(state, char, next)) {
    state.segments.push(state.current);
    state.current = '';
    return isTwoCharOperator(char, next) ? 2 : 1;
  }

  state.current += char;
  return 1;
}

function updateParenDepth(state: SplitState, char: '(' | ')'): void {
  state.current += char;
  if (char === '(') {
    state.parenDepth += 1;
  } else {
    state.parenDepth = Math.max(0, state.parenDepth - 1);
  }
}

function isTwoCharOperator(char: string, next: string): boolean {
  return (char === '&' && next === '&') || (char === '|' && next === '|');
}

// `&>` and `N>&M` are redirections, not the background operator.
const isRedirectionAmpersand = (current: string, next: string): boolean =>
  current.endsWith('>') || next === '>';

function isOperatorAt(state: SplitState, char: string, next: string): boolean {
  if (char === '&' && isRedirectionAmpersand(state.current, next)) return false;
  return (
    isTwoCharOperator(char, next) || char === ';' || char === '|' || char === '&' || char === '\n'
  );
}
