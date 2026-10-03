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
const jiraSafeCommands = readCommandFixtures(new URL('./fixtures/jira_safe.txt', import.meta.url));
const jiraUnsafeCommands = readCommandFixtures(
  new URL('./fixtures/jira_unsafe.txt', import.meta.url),
);
const azSafeCommands = readCommandFixtures(new URL('./fixtures/az_safe.txt', import.meta.url));
const azUnsafeCommands = readCommandFixtures(new URL('./fixtures/az_unsafe.txt', import.meta.url));
const mixedSafeCommands = readCommandFixtures(
  new URL('./fixtures/mixed_safe.txt', import.meta.url),
);
const mixedUnsafeCommands = readCommandFixtures(
  new URL('./fixtures/mixed_unsafe.txt', import.meta.url),
);

const redirectionSafeCommands = readCommandFixtures(
  new URL('./fixtures/redirection_safe.txt', import.meta.url),
);
const redirectionUnsafeCommands = readCommandFixtures(
  new URL('./fixtures/redirection_unsafe.txt', import.meta.url),
);

describe('isSafe (redirections)', () => {
  it.each(redirectionSafeCommands)('treats "%s" as safe', (command) => {
    expect(isSafe(command)).toBe(true);
  });

  it.each(redirectionUnsafeCommands)('treats "%s" as unsafe', (command) => {
    expect(isSafe(command)).toBe(false);
  });
});

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

describe('isSafe (JiraRulePack)', () => {
  it.each(jiraSafeCommands)('treats "%s" as safe', (command) => {
    expect(isSafe(command)).toBe(true);
  });

  it.each(jiraUnsafeCommands)('treats "%s" as unsafe', (command) => {
    expect(isSafe(command)).toBe(false);
  });
});

describe('isSafe (AzRulePack)', () => {
  it.each(azSafeCommands)('treats "%s" as safe', (command) => {
    expect(isSafe(command)).toBe(true);
  });

  it.each(azUnsafeCommands)('treats "%s" as unsafe', (command) => {
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
