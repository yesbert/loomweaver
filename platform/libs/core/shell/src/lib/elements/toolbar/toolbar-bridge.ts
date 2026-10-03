import type { LwToolbarElement } from './lw-toolbar.element';

export interface LwToolbarHost {
  attach(toolbar: LwToolbarElement): void;
  changed(toolbar: LwToolbarElement): void;
  detach(toolbar: LwToolbarElement): void;
}

let host: LwToolbarHost | undefined;

const connected = new Set<LwToolbarElement>();

export function installedLwToolbarHost(): LwToolbarHost | undefined {
  return host;
}

export function installLwToolbarHost(next: LwToolbarHost | undefined): void {
  for (const toolbar of connected) {
    host?.detach(toolbar);
  }
  host = next;
  for (const toolbar of connected) {
    next?.attach(toolbar);
  }
}

export function toolbarConnected(toolbar: LwToolbarElement): void {
  connected.add(toolbar);
  host?.attach(toolbar);
}

export function toolbarChanged(toolbar: LwToolbarElement): void {
  if (connected.has(toolbar)) {
    host?.changed(toolbar);
  }
}

export function toolbarDisconnected(toolbar: LwToolbarElement): void {
  connected.delete(toolbar);
  host?.detach(toolbar);
}
