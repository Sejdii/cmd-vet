# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

cmd-vet checks whether a bash command string is safe to run (e.g. for whitelisting in AI agent hooks). It parses a command line and decides, per rule pack, whether every individual command in it is safe. It is deliberately conservative: anything unrecognized, any command substitution/subshell, or any redirection is rejected.

## Commands

```bash
pnpm test              # vitest run (single run)
pnpm test:watch        # vitest watch mode
pnpm test:coverage     # vitest run with coverage (100% thresholds enforced, see vitest.config.mts)
pnpm typecheck         # tsc -p tsconfig.json (noEmit)
pnpm lint              # eslint --cache
pnpm format            # prettier --write . --cache
pnpm format:check      # prettier --check . --cache
pnpm depcruise         # dependency-cruiser against src, enforces module boundaries below
pnpm build             # tsc -p tsconfig.build.json -> dist/
```

Run a single test file: `pnpm vitest run test/cmd-vet.test.ts`. Run a single case with `-t`: `pnpm vitest run -t "treats bare separator"`.

### Gate script

`scripts/gate.ts` runs the full check suite with live status output and writes logs to `.gate-logs/`:

```bash
pnpm gate:fast   # depcruise, typecheck, test-coverage, lint, format
pnpm gate:full   # same steps as fast today
pnpm gate:list   # list steps without running them
```

Prefer `pnpm gate:fast` over running individual commands when validating a change — it surfaces failures for all checks at once with concise detail lines (e.g. violation counts, failed test counts) instead of raw tool output.

## Architecture

The codebase is split into three `src/` modules with a strict, enforced dependency direction (see `.dependency-cruiser.mjs`):

```
bash-parser   (no internal deps — pure parsing)
    ^
    |
  core        (depends on bash-parser)
    ^
    |
rule-packs    (depends on core)
```

dependency-cruiser enforces two things for every module: it may only import other modules through their `index.ts` (public API, no reaching into internal files), and it may only depend on the modules listed in `.dependency-cruiser.mjs`'s `allowedModuleDeps`. Adding a new module or a new cross-module import requires updating that map, or the build fails.

**`src/bash-parser`** turns a raw command-line string into `ParsedCommand[]`

**`src/core`** defines the `RulePack` interface (`{ name, evaluate(commandName, args): boolean }`) and `isSafe(command, rulePacks)`: a command is safe only if it parses into at least one segment, none of the segments contain a subshell/command substitution, and every segment is accepted by at least one supplied rule pack.

**`src/rule-packs`** holds concrete rule packs.

**`src/index.ts`** is the public entry point: `isSafe(command, rulePacks = getDefaultRulePacks())`

### Adding a new rule pack

Implement `RulePack` from `src/core`, export it from `src/rule-packs/index.ts`, and add it to `getDefaultRulePacks()` if it should be part of the default set. `isSafe` treats multiple rule packs as OR'd (a segment is safe if _any_ pack accepts it).

## Testing conventions

- Coverage thresholds are 100% (lines/functions/branches/statements) — see `vitest.config.mts`. New code needs tests that exercise it.
- Rule-pack test cases live as plain command-line fixtures in `test/fixtures/*.txt` (one command per line, `#`-prefixed comments and blank lines ignored), loaded via `readCommandFixtures` in `test/fixtures.ts` and run with `it.each` in `test/cmd-vet.test.ts`. Add new safe/unsafe examples there rather than writing bespoke test bodies, unless the case doesn't fit the fixture format.
