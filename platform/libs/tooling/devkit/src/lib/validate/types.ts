export type FindingLevel = 'error' | 'warning' | 'info';

export interface Finding {
  readonly level: FindingLevel;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}
