import { pluginContextHolder } from '../../plugin-context';

const context = pluginContextHolder();
const titles = new Map<string, string>();

export const navigationActions = {
  bind: context.bind,
  unbind(): void {
    context.unbind();
    titles.clear();
  },
  activePath(): string {
    return context.current?.activeContent()?.path ?? '';
  },
  showingUnder(path: string): boolean {
    return context.current?.isShowingUnder(path) ?? false;
  },
  open(path: string): void {
    context.current?.navigateContent(path);
  },
  remember(surfaceId: string, titleKey: string): void {
    titles.set(surfaceId, titleKey);
  },
  retitle(surfaceId: string, titleKey: string): void {
    const ctx = context.current;
    if (!ctx || titles.get(surfaceId) === titleKey) {
      return;
    }
    titles.set(surfaceId, titleKey);
    ctx.retitleSurface(surfaceId, titleKey);
  },
};
