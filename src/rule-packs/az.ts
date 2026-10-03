import type { RulePack } from '../core/index.js';

const READ_ONLY_VERBS = new Set(['list', 'show', 'exists', 'check-name-availability']);
const READ_ONLY_VERB_PREFIX = /^(list|show)-/;

// Command groups where a `list`/`show` verb is read-only. Any group not listed is unsafe, so new
// or unreviewed groups (which may expose secrets through list/show) are denied by default.
const READ_ONLY_GROUPS = new Set([
  'group',
  'account',
  'resource',
  'vm',
  'network',
  'storage',
  'aks',
  'acr',
  'keyvault',
  'cosmosdb',
  'redis',
  'signalr',
  'ad',
  'pipelines',
  'repos',
]);

// Whole command paths (not just the last word) that are read-only despite a different verb.
const READ_ONLY_PATHS = new Set([
  'graph query',
  'monitor log-analytics query',
  ...['group', 'sub', 'mg', 'tenant'].map((scope) => `deployment ${scope} what-if`),
]);

// Commands that are read-only whatever words follow: `version` only prints the CLI version and
// `find` takes a free-text search phrase.
const READ_ONLY_COMMAND_ROOTS = new Set(['find', 'version']);

const TOP_LEVEL_FLAGS = new Set(['--version', '--help', '-h']);

// Command words that expose credentials, so even `list`/`show` on them is unsafe.
const SECRET_WORD = /(^|-)(keys?|secrets?|credentials?|certificates?|passwords?|tokens?|sas)(-|$)/;
const SECRET_FRAGMENT = /connection-string|publishing|appsettings/;

// `--debug` logs HTTP requests including bearer tokens. Argument parsing accepts unique prefixes
// of long flags, so every prefix (`--deb`, `--d`, ...) is treated as `--debug`.
function isDebugFlag(arg: string): boolean {
  if (!arg.startsWith('--')) return false;
  const name = arg.slice(2).replace(/=.*/s, '');
  return name.length > 0 && 'debug'.startsWith(name);
}

// The command path is the run of leading arguments before the first flag.
function leadingWords(args: string[]): string[] {
  const end = args.findIndex((arg) => arg.startsWith('-'));
  return end === -1 ? args : args.slice(0, end);
}

const isReadOnlyVerb = (verb: string): boolean =>
  READ_ONLY_VERBS.has(verb) || READ_ONLY_VERB_PREFIX.test(verb);

// `words` always starts with `group` (the first argument, which is not a flag).
function isReadOnlyCommand(group: string, words: string[]): boolean {
  if (words.some((word) => SECRET_WORD.test(word) || SECRET_FRAGMENT.test(word))) return false;
  if (READ_ONLY_COMMAND_ROOTS.has(group) || READ_ONLY_PATHS.has(words.join(' '))) return true;

  // A bare `az list` has no command group, so require a known group plus a verb.
  return words.length >= 2 && READ_ONLY_GROUPS.has(group) && words.slice(-1).every(isReadOnlyVerb);
}

export const AzRulePack: RulePack = {
  name: 'az',
  evaluate(commandName, args) {
    if (commandName !== 'az' || args.some(isDebugFlag)) return false;

    const [first] = args;
    if (first === undefined) return true;
    if (first.startsWith('-')) return args.length === 1 && TOP_LEVEL_FLAGS.has(first);
    return isReadOnlyCommand(first, leadingWords(args));
  },
};
