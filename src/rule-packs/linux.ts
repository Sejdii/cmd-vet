import type { RulePack } from '../core/index.js';

const UNCONDITIONALLY_SAFE_COMMANDS = new Set([
  'ls',
  'mkdir',
  'pwd',
  'cd',
  'grep',
  'cat',
  'more',
  'head',
  'tail',
  'wc',
  'diff',
  'whoami',
  'uptime',
  'which',
]);

const FIND_FORBIDDEN_FLAGS = new Set([
  '-exec',
  '-execdir',
  '-prune',
  '-delete',
  '-ok',
  '-okdir',
  '-fprintf',
  '-fprint',
  '-fprint0',
  '-fls',
]);

// Flag allowlist: a flag is `-` followed by letters (every letter must be allowed) or `--long`
// (must be listed exactly). Anything else, including `--`, is rejected. A lone `-` is an operand,
// and `+cmd` operands (e.g. `less +!sh`) are rejected.
function allowFlags(
  short: string,
  long: string[],
  maxOperands = Infinity,
): (args: string[]) => boolean {
  const shortFlag = new RegExp(`^-[${short}]*$`);
  const isFlag = (arg: string): boolean => arg.length > 1 && arg.startsWith('-');
  const isAllowedFlag = (arg: string): boolean =>
    arg.startsWith('--') ? long.includes(arg) : shortFlag.test(arg);
  return (args) =>
    !args.some((arg) => arg.startsWith('+')) &&
    args.filter(isFlag).every(isAllowedFlag) &&
    args.filter((a) => !isFlag(a)).length <= maxOperands;
}

// Only bare, read-only flags; no positional operands (which would set state) and no `+cmd` args.
function allowExactArgs(allowed: string[]): (args: string[]) => boolean {
  return (args) => args.every((arg) => allowed.includes(arg));
}

function hasExactlyArgs(args: string[], expected: string[]): boolean {
  return args.length === expected.length && args.every((a, i) => a === expected[i]);
}

const RULES: Record<string, (args: string[]) => boolean> = {
  tree: allowFlags('aACdDfFghiIJlLnNpPqrsStuvx', ['--dirsfirst', '--noreport']),
  less: allowFlags('cCeEfFgGiIJmMnNqQrRsSuUwWX', []),
  sort: allowFlags('bcdfghikMnrRstuVz', ['--reverse', '--numeric-sort', '--unique']),
  uniq: allowFlags('cdiuz', [], 1),
  hostname: allowExactArgs(['-f', '-s', '-d', '-i', '-I', '-a', '-A', '--fqdn', '--short']),
  date: (args) => args.every((arg) => arg.startsWith('+') || ['-u', '--utc', '-R'].includes(arg)),
  find: (args) => !args.some((arg) => FIND_FORBIDDEN_FLAGS.has(arg)),
  uname: (args) => hasExactlyArgs(args, ['-a']),
  ps: (args) => hasExactlyArgs(args, ['aux']),
};

export const LinuxRulePack: RulePack = {
  name: 'linux',
  evaluate(commandName, args) {
    if (UNCONDITIONALLY_SAFE_COMMANDS.has(commandName)) return true;
    const rule = RULES[commandName];
    return rule ? rule(args) : false;
  },
};
