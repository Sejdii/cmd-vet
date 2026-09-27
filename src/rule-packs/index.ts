import type { RulePack } from '../core/index.js';
import { LinuxRulePack } from './linux.js';

export { LinuxRulePack } from './linux.js';

export function getDefaultRulePacks(): RulePack[] {
  return [LinuxRulePack];
}
