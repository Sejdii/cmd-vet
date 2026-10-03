import { extractRedirections, splitOperators, type Redirection } from './redirection.js';
import { splitTopLevel } from './split-top-level.js';
import { hasUnsafeConstruct } from './unsafe-construct.js';
import { tokenize } from './tokenize.js';

export type { Redirection } from './redirection.js';

export interface ParsedCommand {
  name: string;
  args: string[];
  redirections: Redirection[];
  containsSubshellOrCommandSubstitution: boolean;
}

export function parseBashLine(input: string): ParsedCommand[] {
  return splitTopLevel(input)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map(parseSegment);
}

function parseSegment(segment: string): ParsedCommand {
  const [name = '', ...rest] = tokenize(segment).flatMap(splitOperators);
  const { args, redirections } = extractRedirections(rest);
  return {
    name,
    args,
    redirections,
    containsSubshellOrCommandSubstitution: hasUnsafeConstruct(segment),
  };
}
