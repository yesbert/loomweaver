import { PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedAboutDialog } from './testbed-about-dialog';
import { TestbedDraftDialog } from './testbed-draft-dialog';
import { TestbedFormDialog } from './testbed-form-dialog';

const TOAST_MS = 3000;

export function registerDialogs(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.dialogs.form',
    title: 'testbed.dialogs.form',
    icon: 'edit',
    run: async () => {
      const name = await ctx.ui.open<string>(TestbedFormDialog, {
        title: 'testbed.dialogs.form',
        dismiss: 'explicit',
      }).closed;
      if (name !== undefined) {
        ctx.ui.toast({ message: 'testbed.dialogs.saved', timeoutMs: TOAST_MS });
      }
    },
  });
  ctx.registerCommand({
    id: 'testbed.dialogs.draft',
    title: 'testbed.dialogs.draft',
    icon: 'edit',
    run: () => {
      ctx.ui.open(TestbedDraftDialog, { title: 'testbed.dialogs.draft' });
    },
  });
  ctx.registerCommand({
    id: 'testbed.about',
    title: 'testbed.cmd.about',
    icon: 'help',
    popout: true,
    run: () => {
      ctx.ui.open(TestbedAboutDialog, { data: ctx.host });
    },
  });
}
