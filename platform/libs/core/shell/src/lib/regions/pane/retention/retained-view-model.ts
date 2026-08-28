import { EmbeddedViewRef, TemplateRef, Type } from '@angular/core';
import { SurfaceRetentionMode } from './retention-policy';

export type RetainedViewSource = TemplateRef<unknown> | Type<unknown>;

export interface RetainedViewHandle {
  readonly view: EmbeddedViewRef<unknown>;
  readonly instance?: unknown;
}

export interface RetainedSlot {
  readonly rootNodes: readonly Node[];
  readonly attached: boolean;
  stale(): boolean;
  describe(mode: SurfaceRetentionMode, retain: boolean): void;
  release(retained: boolean): void;
  hide(retained: boolean): void;
  discard(): void;
}

export interface ParkedEntry {
  readonly key: string;
  readonly retained: boolean;
  readonly workspace: string;
  readonly instance?: unknown;
}
