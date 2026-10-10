import { PluginContext } from '@loomweaver/plugin-sdk';

const BURST = 5;

export function registerNotices(ctx: PluginContext): void {
  let bursts = 0;
  ctx.registerCommand({
    id: 'testbed.notices.repeat',
    title: 'testbed.notices.repeat',
    icon: 'undo',
    run: () => {
      ctx.ui.toast({ message: 'testbed.notices.repeated', kind: 'warning' });
    },
  });
  ctx.registerCommand({
    id: 'testbed.notices.symbol',
    title: 'testbed.notices.symbol',
    icon: 'pin',
    run: () => {
      ctx.ui.toast({
        message: 'testbed.notices.pinned',
        kind: 'success',
        icon: 'pin',
      });
    },
  });
  ctx.registerCommand({
    id: 'testbed.notices.stay',
    title: 'testbed.notices.stay',
    icon: 'lock',
    run: () => {
      ctx.ui.toast({
        id: 'stays',
        message: 'testbed.notices.stays',
        timeoutMs: 0,
      });
    },
  });
  ctx.registerCommand({
    id: 'testbed.notices.fail',
    title: 'testbed.notices.fail',
    icon: 'error',
    run: () => {
      ctx.ui.toast({ message: 'testbed.notices.failed', kind: 'error' });
    },
  });
  ctx.registerCommand({
    id: 'testbed.notices.burst',
    title: 'testbed.notices.burst',
    icon: 'more',
    run: () => {
      bursts += 1;
      for (let number = 1; number <= BURST; number++) {
        ctx.ui.toast({
          message: `Burst ${bursts}, notice ${number} of ${BURST}`,
        });
      }
    },
  });
}
