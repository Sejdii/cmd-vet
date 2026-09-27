import { readFileSync } from 'node:fs';

export function readCommandFixtures(path: string | URL): string[] {
  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}
