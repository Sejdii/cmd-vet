import { parseBashLine, type ParsedCommand } from '../bash-parser/index.js';
import { areRedirectionsSafe } from './redirection.js';
import type { RulePack } from './rule-pack.js';

export type { RulePack } from './rule-pack.js';

export function isSafe(command: string, rulePacks: RulePack[]): boolean {
  const parsedCommands = parseBashLine(command);
  if (parsedCommands.length === 0) return false;
  return parsedCommands.every((parsed) => isParsedCommandSafe(parsed, rulePacks));
}

function isParsedCommandSafe(parsed: ParsedCommand, rulePacks: RulePack[]): boolean {
  if (parsed.containsSubshellOrCommandSubstitution) return false;
  if (!areRedirectionsSafe(parsed)) return false;
  return rulePacks.some((pack) => pack.evaluate(parsed.name, parsed.args));
}
