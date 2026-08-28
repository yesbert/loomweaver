export type FindingLevel = 'error' | 'warning';

export interface Finding {
  readonly level: FindingLevel;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}
