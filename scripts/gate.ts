#!/usr/bin/env tsx
import { execFile, type ExecFileException } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LOG_DIR = '.gate-logs';

type Phase = 'fast' | 'full';

interface CmdResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface StepContext {
  pnpmAndLog(script: string, args?: string[]): Promise<CmdResult>;
  readJson(path: string): unknown;
}

interface StepResult {
  ok: boolean;
  detail?: string;
}

function toStepResult(r: CmdResult, detail: (stdout: string) => string): StepResult {
  return r.code === 0 ? { ok: true } : { ok: false, detail: detail(r.stdout) };
}

interface Step {
  name: string;
  description: string;
  phases: Phase[];
  run(ctx: StepContext): Promise<StepResult>;
}

const STEPS: Step[] = [
  {
    name: 'depcruise',
    description: 'Architecture / dependency-cruiser rules (src)',
    phases: ['fast', 'full'],
    async run(ctx) {
      const r = await ctx.pnpmAndLog('depcruise', ['--output-type', 'json']);
      return toStepResult(r, depcruiseDetail);
    },
  },
  {
    name: 'typecheck',
    description: 'tsc --noEmit',
    phases: ['fast', 'full'],
    async run(ctx) {
      const r = await ctx.pnpmAndLog('typecheck');
      return toStepResult(r, typecheckDetail);
    },
  },
  {
    name: 'test-coverage',
    description: 'Vitest unit tests with coverage',
    phases: ['fast', 'full'],
    async run(ctx) {
      const out = join(LOG_DIR, 'vitest.json');
      const r = await ctx.pnpmAndLog('test:coverage', ['--reporter=json', `--outputFile=${out}`]);
      if (r.code === 0) return { ok: true, detail: coverageDetail(ctx) };
      const report = ctx.readJson(out) as VitestReport | null;
      return {
        ok: false,
        detail: `${String(report?.numFailedTests ?? '?')} test(s) failed${ref(out)}`,
      };
    },
  },
  {
    name: 'lint',
    description: 'ESLint',
    phases: ['fast', 'full'],
    async run(ctx) {
      const out = join(LOG_DIR, 'eslint.json');
      const r = await ctx.pnpmAndLog('lint', ['.', '--format', 'json', '-o', out]);
      return toStepResult(r, () => lintDetail(ctx, out));
    },
  },
  {
    name: 'format',
    description: 'Prettier formatting check',
    phases: ['fast', 'full'],
    async run(ctx) {
      const r = await ctx.pnpmAndLog('format:check');
      return toStepResult(r, formatDetail);
    },
  },
];

interface VitestReport {
  numFailedTests?: number;
}
interface DepcruiseReport {
  summary?: { violations?: unknown[]; error?: number };
}
interface EslintFileReport {
  errorCount: number;
  warningCount: number;
}
interface CoverageSummary {
  total?: { statements?: { pct?: number } };
}

function ref(file: string): string {
  return ` (see ${file})`;
}

function depcruiseDetail(stdout: string): string {
  const report = parseJson(stdout) as DepcruiseReport | null;
  const count = report?.summary?.violations?.length ?? report?.summary?.error ?? '?';
  const log = join(LOG_DIR, 'depcruise.log');
  return `${String(count)} violation(s)${ref(log)}`;
}

function typecheckDetail(stdout: string): string {
  const lines = stdout.split('\n').filter((l) => l.trim().length > 0);
  const log = join(LOG_DIR, 'typecheck.log');
  return `${String(lines.length)} error line(s)${ref(log)}`;
}

function lintDetail(ctx: StepContext, file: string): string {
  const results = ctx.readJson(file) as EslintFileReport[] | null;
  if (!results) return `see ${file}`;
  const errors = results.reduce((n, f) => n + f.errorCount, 0);
  const warnings = results.reduce((n, f) => n + f.warningCount, 0);
  return `${String(errors)} error(s), ${String(warnings)} warning(s)${ref(file)}`;
}

function formatDetail(stdout: string): string {
  const files = stdout
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('Checking') && !l.includes('Code style issues'));
  const log = join(LOG_DIR, 'format.log');
  return `${String(files.length)} file(s) need formatting${ref(log)}`;
}

function coverageDetail(ctx: StepContext): string {
  const cov = ctx.readJson('coverage/coverage-summary.json') as CoverageSummary | null;
  const pct = cov?.total?.statements?.pct;
  return pct == null ? '' : `stmts ${String(pct)}%`;
}

function errCode(err: ExecFileException | null): number {
  if (typeof err?.code === 'number') return err.code;
  return err ? 1 : 0;
}

function exec(file: string, args: string[]): Promise<CmdResult> {
  return new Promise((resolve) => {
    const opts = { encoding: 'utf-8' as const, maxBuffer: 64 * 1024 * 1024 };
    execFile(file, args, opts, (err, stdout, stderr) => {
      resolve({ code: errCode(err), stdout, stderr });
    });
  });
}

function pnpmRun(script: string, args: string[]): Promise<CmdResult> {
  return exec('pnpm', ['run', script, ...args]);
}

function saveLog(name: string, r: CmdResult): void {
  writeFileSync(join(LOG_DIR, `${name}.log`), `${r.stdout}\n${r.stderr}`);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function makeContext(step: Step): StepContext {
  return {
    async pnpmAndLog(script, args = []) {
      const r = await pnpmRun(script, args);
      saveLog(step.name, r);
      return r;
    },
    readJson: (path) => (existsSync(path) ? parseJson(readFileSync(path, 'utf-8')) : null),
  };
}

type Status = 'pending' | 'running' | 'passed' | 'failed';

const ICONS: Record<Status, string> = { pending: '·', running: '⏳', passed: '✅', failed: '❌' };
const LABELS: Record<Status, string> = {
  pending: 'not started',
  running: 'in progress',
  passed: 'passed',
  failed: 'failed',
};

interface StepState {
  status: Status;
  detail: string;
}

const order: string[] = [];
const states = new Map<string, StepState>();
const isTTY = process.stdout.isTTY;
let renderedLines = 0;

function formatLine(name: string): string {
  const s = states.get(name) ?? { status: 'pending', detail: '' };
  const detail = s.detail ? ` — ${s.detail}` : '';
  return `${ICONS[s.status]} ${name.padEnd(14)} ${LABELS[s.status].padEnd(11)}${detail}`;
}

function render(): void {
  if (!isTTY) return;
  if (renderedLines > 0) process.stdout.write(`\x1b[${String(renderedLines)}A`);
  for (const name of order) process.stdout.write(`\x1b[2K${formatLine(name)}\n`);
  renderedLines = order.length;
}

function register(name: string): void {
  order.push(name);
  states.set(name, { status: 'pending', detail: '' });
}

function setStatus(name: string, status: Status, detail = ''): void {
  states.set(name, { status, detail });
  if (isTTY) render();
  else console.log(formatLine(name));
}

function printSteps(): void {
  console.log('Gate steps (in run order):\n');
  for (const step of STEPS) {
    const phases = step.phases.join(',').padEnd(9);
    console.log(`  ${step.name.padEnd(14)} [${phases}] ${step.description}`);
  }
}

async function runStep(step: Step): Promise<boolean> {
  setStatus(step.name, 'running');
  const { ok, detail } = await step.run(makeContext(step));
  setStatus(step.name, ok ? 'passed' : 'failed', detail);
  return ok;
}

async function main(): Promise<void> {
  const arg = process.argv[2] ?? 'fast';
  if (arg === 'list') {
    printSteps();
    return;
  }

  if (arg !== 'fast' && arg !== 'full') {
    throw new Error(`Unknown phase: ${arg}`);
  }
  const phase: Phase = arg;
  const selected = STEPS.filter((step) => step.phases.includes(phase));
  mkdirSync(LOG_DIR, { recursive: true });
  for (const step of selected) register(step.name);
  render();

  const outcomes: boolean[] = [];
  for (const step of selected) outcomes.push(await runStep(step));
  process.exitCode = outcomes.includes(false) ? 1 : 0;
}

void main();
