import { Data } from '@angular/router';
import { ContainerSpec } from '@loomweaver/plugin-sdk';

export interface SurfaceRouteData {
  readonly iframe?: string;
  readonly container?: ContainerSpec;
  readonly pluginId?: string;
  readonly rest?: boolean;
  readonly sub?: string;
  readonly urlDriven?: boolean;
  readonly docked?: boolean;
  readonly instanceId?: string;
}

export function surfaceRouteData(data: Data): SurfaceRouteData {
  return data as SurfaceRouteData;
}
