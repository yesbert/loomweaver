import { EmbeddedViewRef, TemplateRef, Type } from '@angular/core';
import { SurfaceRetentionMode } from './retention-policy';
import { SurfaceHoldState } from './surface-hold';

export type RetainedViewSource = TemplateRef<unknown> | Type<unknown>;

export interface RetainedViewHandle {
  readonly view: EmbeddedViewRef<unknown>;
  readonly instance?: unknown;
  readonly hold?: SurfaceHoldState | null;
}

export interface RetainedSlot {
  readonly rootNodes: readonly Node[];
  readonly attached: boolean;
  stale(): boolean;
  held(): boolean;
  describe(mode: SurfaceRetentionMode, retains: boolean): void;
  detach(retains: boolean): void;
  hideInPlace(retains: boolean): void;
  discard(): void;
}

export interface ParkedEntry {
  readonly key: string;
  readonly retains: boolean;
  readonly held: boolean;
  readonly workspace: string;
  readonly instance?: unknown;
}

export interface SlotPlacement {
  readonly parent?: Node | null;
  readonly hold?: SurfaceHoldState | null;
}
