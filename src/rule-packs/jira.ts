import type { RulePack } from '../core/index.js';

const LIST_VERBS = new Set(['list', 'lists', 'ls']);
const ISSUE_VERBS = new Set([...LIST_VERBS, 'search', 'view', 'show']);

const READ_ONLY_VERBS = new Map<string, Set<string>>([
  ['issue', ISSUE_VERBS],
  ['issues', ISSUE_VERBS],
  ['epic', LIST_VERBS],
  ['epics', LIST_VERBS],
  ['sprint', LIST_VERBS],
  ['sprints', LIST_VERBS],
  ['board', LIST_VERBS],
  ['boards', LIST_VERBS],
  ['project', LIST_VERBS],
  ['projects', LIST_VERBS],
  ['release', LIST_VERBS],
  ['releases', LIST_VERBS],
]);

const READ_ONLY_TOP_LEVEL = new Set([
  'me',
  'version',
  'serverinfo',
  'systeminfo',
  'open',
  'browse',
  'navigate',
  'completion',
]);

// `-c`/`--config` swaps the config file, which can point the stored API token at another server.
// Short flags may be clustered (`-ac`) or carry an attached value (`-cfile`).
function isConfigFlag(arg: string): boolean {
  return /^--config(=|$)/.test(arg) || /^-[^-]*c/.test(arg);
}

// Skips the persistent flags that are harmless before the command words
// (`--debug`, `-p`/`--project`). Returns the index of the next non-flag
// argument, or -1 when an unrecognised flag is found.
function skipGlobalFlags(args: string[], start: number): number {
  let i = start;
  for (;;) {
    const arg = args[i];
    if (!arg?.startsWith('-')) return i;
    if (/^--debug(=(true|false))?$/.test(arg)) {
      i += 1;
    } else if (arg === '-p' || arg === '--project') {
      i += 2;
    } else if (/^(-p|--project=)/.test(arg)) {
      i += 1;
    } else {
      return -1;
    }
  }
}

export const JiraRulePack: RulePack = {
  name: 'jira',
  evaluate(commandName, args) {
    if (commandName !== 'jira') return false;
    if (args.some(isConfigFlag)) return false;

    const wordIndex = skipGlobalFlags(args, 0);
    if (wordIndex === -1) return false;
    const word = args[wordIndex];
    if (word === undefined) return false;
    if (READ_ONLY_TOP_LEVEL.has(word)) return true;

    const verbs = READ_ONLY_VERBS.get(word);
    if (verbs === undefined) return false;

    const verbIndex = skipGlobalFlags(args, wordIndex + 1);
    if (verbIndex === -1) return false;
    const verb = args[verbIndex];
    return verb !== undefined && verbs.has(verb);
  },
};
