import { isQuoteChar } from './quote.js';

interface TokenizeState {
  tokens: string[];
  current: string;
  quote: '"' | "'" | null;
}

export function tokenize(segment: string): string[] {
  const state: TokenizeState = { tokens: [], current: '', quote: null };

  for (let i = 0; i < segment.length; i += 1) {
    const char = segment.charAt(i);
    const next = segment.charAt(i + 1);
    const consumedNext = state.quote
      ? consumeQuotedChar(state, char, next)
      : consumeUnquotedChar(state, char, next);
    if (consumedNext) i += 1;
  }

  if (state.current) {
    state.tokens.push(state.current);
  }

  return state.tokens;
}

function consumeQuotedChar(state: TokenizeState, char: string, next: string): boolean {
  if (char === '\\' && state.quote === '"' && next !== '') {
    state.current += next;
    return true;
  }
  if (char === state.quote) {
    state.quote = null;
  } else {
    state.current += char;
  }
  return false;
}

function consumeUnquotedChar(state: TokenizeState, char: string, next: string): boolean {
  if (char === '\\' && next !== '') {
    state.current += next;
    return true;
  }

  if (isQuoteChar(char)) {
    state.quote = char;
    return false;
  }

  if (/\s/.test(char)) {
    if (state.current) {
      state.tokens.push(state.current);
      state.current = '';
    }
    return false;
  }

  state.current += char;
  return false;
}
