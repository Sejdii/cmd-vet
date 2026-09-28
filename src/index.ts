import { isSafe as evaluate, type RulePack } from './core/index.js';
import { getDefaultRulePacks } from './rule-packs/index.js';

export type { RulePack } from './core/index.js';
export { LinuxRulePack, GithubRulePack } from './rule-packs/index.js';

export function isSafe(command: string, rulePacks: RulePack[] = getDefaultRulePacks()): boolean {
  return evaluate(command, rulePacks);
}
