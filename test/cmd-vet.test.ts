import { describe, expect, it } from 'vitest';
import { isSafe } from '../src/index.js';
import { readCommandFixtures } from './fixtures.js';

const safeCommands = readCommandFixtures(new URL('./fixtures/linux_safe.txt', import.meta.url));
const unsafeCommands = readCommandFixtures(new URL('./fixtures/linux_unsafe.txt', import.meta.url));

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
