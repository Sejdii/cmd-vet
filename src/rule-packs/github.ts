import type { RulePack } from '../core/index.js';

const READ_ONLY_VERBS: Record<string, Set<string>> = {
  pr: new Set(['list', 'view', 'status', 'diff', 'checks']),
  issue: new Set(['list', 'view', 'status']),
  repo: new Set(['view', 'list']),
};

const NOUNLESS_SUBCOMMANDS = new Set(['status', 'browse']);

export const GithubRulePack: RulePack = {
  name: 'github',
  evaluate(commandName, args) {
    if (commandName !== 'gh') return false;

    const [noun, verb] = args;
    if (noun !== undefined && NOUNLESS_SUBCOMMANDS.has(noun)) return true;

    const verbs = noun !== undefined ? READ_ONLY_VERBS[noun] : undefined;
    return verbs !== undefined && verb !== undefined && verbs.has(verb);
  },
};
