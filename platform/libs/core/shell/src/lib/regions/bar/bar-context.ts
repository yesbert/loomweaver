import { InjectionToken } from '@angular/core';
import { DockPosition } from '../../layout/layout';
import { BarSlot } from '../../foundation/bar-item';

export interface BarContext {
  readonly bar: string;
  readonly dock: DockPosition;
  readonly slot: BarSlot;
}

export const BAR_CONTEXT = new InjectionToken<BarContext>('BAR_CONTEXT');
