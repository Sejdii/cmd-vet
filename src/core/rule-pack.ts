export interface RulePack {
  name: string;
  evaluate(commandName: string, args: string[]): boolean;
}
