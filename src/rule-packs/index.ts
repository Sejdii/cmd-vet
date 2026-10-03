import type { RulePack } from '../core/index.js';
import { AzRulePack } from './az.js';
import { GithubRulePack } from './github.js';
import { JiraRulePack } from './jira.js';
import { LinuxRulePack } from './linux.js';

export { LinuxRulePack } from './linux.js';
export { GithubRulePack } from './github.js';
export { JiraRulePack } from './jira.js';
export { AzRulePack } from './az.js';

export function getDefaultRulePacks(): RulePack[] {
  return [LinuxRulePack, GithubRulePack, JiraRulePack, AzRulePack];
}
