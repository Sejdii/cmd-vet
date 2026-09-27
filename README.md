# cmd-vet

Check whether a bash command is safe to run, e.g. for whitelisting in AI agent hooks.

`cmd-vet` parses a shell command line and decides whether every command it contains is safe according to a set of pluggable rule packs. It is deliberately conservative: anything unrecognized, any command substitution/subshell, or any output redirection is treated as unsafe.

## Installation

```bash
pnpm add cmd-vet
```

## Usage

```ts
import { isSafe } from 'cmd-vet';

isSafe('ls -la');                 // true
isSafe('cat file.txt | grep foo'); // true
isSafe('rm -rf /');               // false
isSafe('ls > /etc/cron.d/evil');  // false — redirection defeats read-only intent
isSafe('echo $(rm -rf /)');       // false — command substitution
isSafe('find . -delete');         // false — forbidden find flag
```

`isSafe` defaults to the built-in rule packs. You can pass your own rule packs instead:

```ts
import { isSafe, type RulePack } from 'cmd-vet';

const myRulePack: RulePack = {
  name: 'my-rules',
  evaluate(commandName, args) {
    return commandName === 'echo';
  },
};

isSafe('echo hi', [myRulePack]); // true
```

A command is safe only if:
- it parses into at least one command segment,
- none of its segments contain a subshell or command/process substitution (`` $(...) ``, backticks, `<(...)`, `>(...)`, or a wholly `(...)`-wrapped segment), and
- every segment is accepted by at least one of the supplied rule packs.

Compound commands (`;`, `|`, `&`, `&&`, `||`, newlines) are split and each part is checked independently — the whole line is only safe if every part is.

## `LinuxRulePack`

The default rule pack is a deny-by-default allowlist:
- A fixed set of read-only commands (`ls`, `cat`, `grep`, `head`, `tail`, `wc`, `diff`, `sort`, `uniq`, `whoami`, `hostname`, `date`, `uptime`, `which`, `pwd`, `cd`, `tree`, `mkdir`, `less`, `more`) are unconditionally safe.
- `find` is safe unless it uses a flag that can execute or mutate (`-exec`, `-execdir`, `-ok`, `-okdir`, `-delete`, `-prune`, `-fprintf`, `-fls`).
- `uname` is safe only as `uname -a`; `ps` is safe only as `ps aux`.
- Any redirection (`>`, `>>`, `<`, `<<`, `&>`, `&>>`, including fd-prefixed forms like `2>`) makes a command unsafe regardless of the above.
- Anything else (e.g. `rm`, `curl`, `sudo`, `awk`, `sed`) is unsafe by default.

## Development

See [CLAUDE.md](./CLAUDE.md) for architecture notes and common development commands.