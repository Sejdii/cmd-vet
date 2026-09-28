import type { RulePack } from '../core/index.js';

const UNCONDITIONALLY_SAFE_COMMANDS = new Set([
  'ls',
  'mkdir',
  'pwd',
  'cd',
  'tree',
  'grep',
  'cat',
  'less',
  'more',
  'head',
  'tail',
  'wc',
  'diff',
  'sort',
  'uniq',
  'whoami',
  'hostname',
  'date',
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
  '-fls',
]);

function hasExactlyArgs(args: string[], expected: string[]): boolean {
  return args.length === expected.length && args.every((a, i) => a === expected[i]);
}

const RULES: Record<string, (args: string[]) => boolean> = {
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
