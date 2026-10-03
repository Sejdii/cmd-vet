# cmd-vet

Check whether a bash command is safe to run, e.g. for whitelisting in AI agent hooks.

`cmd-vet` parses a shell command line and decides whether every command it contains is safe according to a set of pluggable rule packs. It is deliberately conservative: anything unrecognized, any command substitution/subshell, or any redirection other than dumping output to a harmless file is treated as unsafe.

## Installation

```bash
pnpm add cmd-vet
```

## Usage

```ts
import { isSafe } from 'cmd-vet';

isSafe('ls -la'); // true
isSafe('cat file.txt | grep foo'); // true
isSafe('rm -rf /'); // false
isSafe('gh pr view 42 > out.txt'); // true — dumping output to a file
isSafe('ls > /etc/cron.d/evil'); // false — target can lead to later command execution
isSafe('echo $(rm -rf /)'); // false — command substitution
isSafe('find . -delete'); // false — forbidden find flag
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
- none of its segments contain a subshell or command/process substitution (`$(...)`, backticks, `<(...)`, `>(...)`, or a wholly `(...)`-wrapped segment), and
- every segment is accepted by at least one of the supplied rule packs.

Compound commands (`;`, `|`, `&`, `&&`, `||`, newlines) are split and each part is checked independently — the whole line is only safe if every part is.

## Built-in rule packs

All of these are on by default and deny by default: anything not explicitly listed as safe is unsafe.

| Name                                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                       | Examples of safe commands                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `LinuxRulePack`                                                       | Read-only core commands (`ls`, `cat`, `grep`, `head`, `tail`, `wc`, `diff`, `sort`, `uniq`, `whoami`, `hostname`, `date`, `uptime`, `which`, `pwd`, `cd`, `tree`, `mkdir`, `less`, `more`); `find` without `-exec`, `-execdir`, `-ok`, `-okdir`, `-delete`, `-prune`, `-fprintf`, `-fls`; `uname` only as `uname -a`; `ps` only as `ps aux`. Everything else (`rm`, `curl`, `sudo`, `awk`, `sed`, ...) is unsafe. | `ls -la`, `cat file.txt`, `grep foo file.txt`, `find . -name '*.ts'`, `uname -a`, `ps aux`         |
| `GithubRulePack` ([GitHub CLI](https://cli.github.com/))              | Read-only `gh` usage: `pr list`/`view`/`status`/`diff`/`checks`, `issue list`/`view`/`status`, `repo view`/`list`, bare `status` and `browse`. Any flags are allowed on those (including `-R/--repo` and `-w/--web`). Mutating verbs, `gh api`, and `auth`/`config`/`alias`/`extension`/`ssh-key`/`secret`/`gpg-key`/`codespace` are unsafe.                                                                      | `gh pr list`, `gh pr view 42 --repo owner/repo`, `gh issue view 7`, `gh repo view`, `gh browse`    |
| `JiraRulePack` ([jira-cli](https://github.com/ankitpokhrel/jira-cli)) | Read-only `jira` usage: `list`/`ls` on `issue`, `epic`, `sprint`, `board`, `project`, `release` (plus `search`/`view`/`show` on `issue`), and top-level `me`, `version`, `serverinfo`, `systeminfo`, `open`, `browse`, `navigate`, `completion`. Only `--debug` and `-p/--project` are accepted before the command; `-c/--config` is always unsafe, as is any mutating verb.                                      | `jira issue list -a me --plain`, `jira issue view PROJ-1`, `jira sprint list --current`, `jira me` |

## Development

See [CLAUDE.md](./CLAUDE.md) for architecture notes and common development commands.
