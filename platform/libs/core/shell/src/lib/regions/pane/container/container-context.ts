import { InjectionToken, Type } from '@angular/core';
import { ContainerSpec, ContainerTabLabel } from '@loomweaver/plugin-sdk';

export interface ContainerContext {
  readonly params: Record<string, string>;
  readonly spec: ContainerSpec | undefined;
  readonly open: (segmentPath: string, label?: ContainerTabLabel) => void;
}

export const CONTAINER_CONTEXT = new InjectionToken<ContainerContext | null>(
  'lw.container-context',
  { factory: () => null },
);

export const CONTAINER_PANE_HOST = new InjectionToken<Type<unknown>>(
  'lw.container-pane-host',
);
