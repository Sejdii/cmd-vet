import { describe, expect, it } from 'vitest';
import { isSafe } from '../src/index.js';
import { readCommandFixtures } from './fixtures.js';

const safeCommands = readCommandFixtures(new URL('./fixtures/linux_safe.txt', import.meta.url));
const unsafeCommands = readCommandFixtures(new URL('./fixtures/linux_unsafe.txt', import.meta.url));
const githubSafeCommands = readCommandFixtures(
  new URL('./fixtures/github_safe.txt', import.meta.url),
);
const githubUnsafeCommands = readCommandFixtures(
  new URL('./fixtures/github_unsafe.txt', import.meta.url),
);
const mixedSafeCommands = readCommandFixtures(
  new URL('./fixtures/mixed_safe.txt', import.meta.url),
);
const mixedUnsafeCommands = readCommandFixtures(
  new URL('./fixtures/mixed_unsafe.txt', import.meta.url),
);

describe('isSafe (LinuxRulePack)', () => {
  it.each(safeCommands)('treats "%s" as safe', (command) => {
    expect(isSafe(command)).toBe(true);
  });

  it.each(unsafeCommands)('treats "%s" as unsafe', (command) => {
    expect(isSafe(command)).toBe(false);
  });

  it.each(['', '   '])('treats blank command "%s" as unsafe', (command) => {
    expect(isSafe(command)).toBe(false);
  });

  it('treats a bare separator ";" as unsafe', () => {
    expect(isSafe(';')).toBe(false);
  });
});

describe('isSafe (GithubRulePack)', () => {
  it.each(githubSafeCommands)('treats "%s" as safe', (command) => {
    expect(isSafe(command)).toBe(true);
  });

  it.each(githubUnsafeCommands)('treats "%s" as unsafe', (command) => {
    expect(isSafe(command)).toBe(false);
  });
});

describe('isSafe (mixed rule packs)', () => {
  it.each(mixedSafeCommands)('treats "%s" as safe', (command) => {
    expect(isSafe(command)).toBe(true);
  });

  it.each(mixedUnsafeCommands)('treats "%s" as unsafe', (command) => {
    expect(isSafe(command)).toBe(false);
  });
});
