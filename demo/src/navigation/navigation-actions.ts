import { type PluginContext } from '@loomweaver/plugin-sdk';

let ctx: PluginContext | undefined;
const titles = new Map<string, string>();

export const navigationActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
    titles.clear();
  },
  activePath(): string {
    return ctx?.activeContent()?.path ?? '';
  },
  showingUnder(path: string): boolean {
    return ctx?.isShowingUnder(path) ?? false;
  },
  open(path: string): void {
    ctx?.navigateContent(path);
  },
  remember(surfaceId: string, titleKey: string): void {
    titles.set(surfaceId, titleKey);
  },
  retitle(surfaceId: string, titleKey: string): void {
    if (!ctx || titles.get(surfaceId) === titleKey) {
      return;
    }
    titles.set(surfaceId, titleKey);
    ctx.retitleSurface(surfaceId, titleKey);
  },
};
