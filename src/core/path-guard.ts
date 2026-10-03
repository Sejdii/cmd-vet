// Allowlist: bash expands globs, `~`, variables and quoting before opening the file, so a denylist of
// known trigger files cannot be complete. Only `/dev/null` and plain relative paths that stay inside
// the working directory and avoid dot-entries (`.bashrc`, `.git/hooks`, `.ssh`, ...) are accepted.
const PLAIN_PATH = /^[\w@%+=:,./-]+$/;

export function isSafeRedirectTarget(path: string): boolean {
  if (path === '/dev/null') return true;
  return (
    PLAIN_PATH.test(path) &&
    !path.startsWith('/') &&
    !path.split('/').some((segment) => segment.startsWith('.'))
  );
}
