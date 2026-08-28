import { Signal, signal } from '@angular/core';
import { OpenTabInput, PluginContext, UiMenuItem } from '@loomweaver/plugin-sdk';
import { Entry } from '../views/testbed-entries';

type TestbedContentCtx = Pick<
  PluginContext,
  | 'openContentTab'
  | 'keepContentTab'
  | 'navigateContent'
  | 'revealSurface'
  | 'ui'
>;

type OpenMode = 'preview' | 'permanent';

class TestbedContentActions {
  private ctx?: TestbedContentCtx;

  private readonly open = signal<ReadonlySet<string>>(new Set());
  readonly openEntryIds: Signal<ReadonlySet<string>> = this.open.asReadonly();

  bind(ctx: TestbedContentCtx): void {
    this.ctx = ctx;
  }

  unbind(): void {
    this.ctx = undefined;
    this.open.set(new Set());
  }

  openEntry(entry: Entry, mode: OpenMode = 'permanent'): void {
    const input: OpenTabInput = {
      path: `entry/${entry.id}`,
      title: entry.reference,
      icon: 'testbedEntry',
      titleIsLiteral: true,
      onClose: () => this.markClosed(entry.id),
      preview: mode === 'preview',
    };
    this.markOpen(entry.id);
    this.withCtx((ctx) => ctx.openContentTab(input));
  }

  keepEntry(entry: Entry): void {
    this.withCtx((ctx) => ctx.keepContentTab(`entry/${entry.id}`));
  }

  openMenu(items: readonly UiMenuItem[], at: { x: number; y: number }): void {
    this.withCtx((ctx) => ctx.ui.openMenu(items, at));
  }

  goHome(): void {
    this.withCtx((ctx) => ctx.navigateContent(''));
  }

  goDashboard(): void {
    this.withCtx((ctx) => ctx.navigateContent('dashboard/overview'));
  }

  goSearch(): void {
    this.withCtx((ctx) => ctx.navigateContent('search'));
  }

  revealList(): void {
    this.withCtx((ctx) => ctx.revealSurface('testbed.list'));
  }

  goNotes(): void {
    this.withCtx((ctx) => ctx.navigateContent('notes'));
  }

  goSecret(): void {
    this.withCtx((ctx) => ctx.navigateContent('secret'));
  }

  goAdminArea(): void {
    this.withCtx((ctx) => ctx.navigateContent('admin-area'));
  }

  goSandbox(): void {
    this.withCtx((ctx) =>
      ctx.openContentTab({
        path: 'sandbox-rpc',
        title: 'testbed.sandbox.title',
        icon: 'testbedSandbox',
        preview: true,
      }),
    );
  }

  openWorkspace(id: string): void {
    this.withCtx((ctx) =>
      ctx.openContentTab({
        path: `workspace/${id}`,
        title: `Container ${id}`,
        icon: 'testbedDashboard',
        titleIsLiteral: true,
      }),
    );
  }

  openArranged(id: string): void {
    this.withCtx((ctx) =>
      ctx.openContentTab({
        path: `arranged/${id}`,
        title: `Arranged ${id}`,
        icon: 'splitPanesDown',
        titleIsLiteral: true,
      }),
    );
  }

  openBrowse(id: string): void {
    this.withCtx((ctx) =>
      ctx.openContentTab({
        path: `browse/${id}`,
        title: `Browse ${id}`,
        icon: 'testbedList',
        titleIsLiteral: true,
      }),
    );
  }

  private markOpen(id: string): void {
    this.open.update((ids) => new Set(ids).add(id));
  }

  private markClosed(id: string): void {
    this.open.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  private withCtx(action: (ctx: TestbedContentCtx) => void): void {
    if (!this.ctx) {
      console.warn(
        '[demo] content action used before the plugin bound its context',
      );
      return;
    }
    action(this.ctx);
  }
}

export const testbedContent = new TestbedContentActions();
