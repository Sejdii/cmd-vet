import { splitTopLevel } from './split-top-level.js';
import { hasUnsafeConstruct } from './unsafe-construct.js';
import { tokenize } from './tokenize.js';

export interface ParsedCommand {
  name: string;
  args: string[];
  containsSubshellOrCommandSubstitution: boolean;
}

export function parseBashLine(input: string): ParsedCommand[] {
  return splitTopLevel(input)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map(parseSegment);
}

function parseSegment(segment: string): ParsedCommand {
  const [name = '', ...args] = tokenize(segment);
  return { name, args, containsSubshellOrCommandSubstitution: hasUnsafeConstruct(segment) };
}
