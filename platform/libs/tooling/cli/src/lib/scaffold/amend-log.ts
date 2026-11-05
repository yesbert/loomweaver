import { relativeTo } from '../workspace';

export interface PlannedAmendment {
  readonly file: string;
  readonly display: string;
  readonly added: readonly string[];
  readonly content: string;
}

export class AmendLog {
  readonly planned: PlannedAmendment[] = [];
  readonly remaining: string[] = [];

  constructor(private readonly root: string) {}

  plan(file: string, added: readonly string[], content: string): void {
    this.planned.push({ file, display: this.displayName(file), added, content });
  }

  note(...entries: readonly string[]): void {
    this.remaining.push(...entries);
  }

  displayName(file: string): string {
    const inside = relativeTo(this.root, file);
    return inside.startsWith('..') ? file : inside;
  }
}
