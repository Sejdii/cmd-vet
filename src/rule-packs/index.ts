import type { RulePack } from '../core/index.js';
import { GithubRulePack } from './github.js';
import { LinuxRulePack } from './linux.js';

export { LinuxRulePack } from './linux.js';
export { GithubRulePack } from './github.js';

export function getDefaultRulePacks(): RulePack[] {
  return [LinuxRulePack, GithubRulePack];
}
