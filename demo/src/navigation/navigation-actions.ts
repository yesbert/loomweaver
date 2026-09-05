import { type Type } from '@angular/core';
import { type PluginContext } from '@loomweaver/plugin-sdk';

let ctx: PluginContext | undefined;
let view: Type<unknown> | undefined;
const titles = new Map<string, string>();

export const navigationActions = {
  bind(next: PluginContext, navView: Type<unknown>): void {
    ctx = next;
    view = navView;
  },
  unbind(): void {
    ctx = undefined;
    view = undefined;
    titles.clear();
  },
  activePath(): string {
    return ctx?.activeContent()?.path ?? '';
  },
  open(path: string): void {
    ctx?.navigateContent(path);
  },
  remember(surfaceId: string, titleKey: string): void {
    titles.set(surfaceId, titleKey);
  },
  retitle(surfaceId: string, titleKey: string, icon: string): void {
    if (!ctx || !view || titles.get(surfaceId) === titleKey) {
      return;
    }
    titles.set(surfaceId, titleKey);
    ctx.registerSurface({
      id: surfaceId,
      title: titleKey,
      icon,
      component: view,
      docks: ['left-panel'],
    });
  },
};
