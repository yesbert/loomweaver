import { PluginContext } from '@loomweaver/plugin-sdk';

export type BoundContext = Pick<
  PluginContext,
  | 'openContentTab'
  | 'keepContentTab'
  | 'updateContentTab'
  | 'navigateContent'
  | 'revealSurface'
  | 'ui'
>;

class TestbedContext {
  private ctx?: BoundContext;

  bind(ctx: BoundContext): void {
    this.ctx = ctx;
  }

  unbind(): void {
    this.ctx = undefined;
  }

  use(action: (ctx: BoundContext) => void): void {
    if (!this.ctx) {
      console.warn(
        '[testbed] a view acted before the plugin bound its context',
      );
      return;
    }
    action(this.ctx);
  }

  navigateTo(path: string): void {
    this.use((ctx) => ctx.navigateContent(path));
  }
}

export const testbedContext = new TestbedContext();
