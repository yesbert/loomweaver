import { AuthSnapshot, PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedAboutDialog } from '../dialogs/testbed-about-dialog';
import { testbedNavState } from '../views/testbed-nav-state';
import { testbedContent } from './testbed-content';
import { testbedAuth } from './testbed-auth';

const RESET_TOKEN = 'Reset';

function principalToastKey(session: AuthSnapshot): string {
  if (session.roles.includes('admin')) {
    return 'testbed.auth.asAdmin';
  }
  return session.authenticated ? 'testbed.auth.asUser' : 'testbed.auth.asAnon';
}

export function registerCommands(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.go.home',
    title: 'testbed.home.title',
    icon: 'testbedHome',
    run: () => testbedContent.goHome(),
  });
  ctx.registerCommand({
    id: 'testbed.go.dashboard',
    title: 'testbed.dash.title',
    icon: 'testbedDashboard',
    run: () => testbedContent.goDashboard(),
  });
  ctx.registerCommand({
    id: 'testbed.focusLibrary',
    title: 'testbed.list.focus',
    icon: 'testbedDocument',
    run: () => ctx.revealSurface('testbed.list'),
  });
  ctx.registerCommand({
    id: 'testbed.go.search',
    title: 'testbed.search.title',
    icon: 'search',
    run: () => testbedContent.goSearch(),
  });
  ctx.registerCommand({
    id: 'testbed.go.notes',
    title: 'testbed.notes.title',
    icon: 'edit',
    run: () => testbedContent.goNotes(),
  });
  ctx.registerCommand({
    id: 'testbed.go.secret',
    title: 'testbed.admin.route',
    icon: 'testbedKey',
    run: () => testbedContent.goSecret(),
  });
  ctx.registerCommand({
    id: 'testbed.go.adminArea',
    title: 'testbed.admin.area',
    icon: 'testbedBuilding',
    run: () => testbedContent.goAdminArea(),
  });
  ctx.registerCommand({
    id: 'testbed.go.sandbox',
    title: 'testbed.sandbox.title',
    icon: 'testbedSandbox',
    run: () => testbedContent.goSandbox(),
  });
  ctx.registerCommand({
    id: 'testbed.go.workspace',
    title: 'testbed.workspace.title',
    icon: 'splitPanes',
    run: () => {
      testbedContent.openWorkspace('alpha');
      testbedContent.openWorkspace('beta');
    },
  });

  ctx.registerCommand({
    id: 'testbed.go.arranged',
    title: 'testbed.arranged.title',
    icon: 'splitPanesDown',
    run: () => testbedContent.openArranged('alpha'),
  });
  ctx.registerCommand({
    id: 'testbed.go.browse',
    title: 'testbed.browse.title',
    icon: 'testbedList',
    run: () => testbedContent.openBrowse('alpha'),
  });

  ctx.registerCommand({
    id: 'testbed.reset',
    title: 'testbed.cmd.reset',
    icon: 'undo',
    run: async () => {
      const ok = await ctx.ui.confirm({
        title: 'testbed.cmd.reset',
        message: 'testbed.cmd.resetConfirm',
        confirmLabel: 'testbed.cmd.reset',
        tone: 'danger',
        requireConfirmation: {
          label: 'testbed.cmd.resetGuardLabel',
          placeholder: RESET_TOKEN,
          validate: (value) => (value === RESET_TOKEN ? null : ''),
        },
      });
      if (ok) testbedNavState.reset();
    },
  });
  ctx.registerCommand({
    id: 'testbed.nav.add',
    title: 'testbed.nav.add',
    icon: 'add',
    shortcut: 'mod+enter',
    run: () => testbedNavState.add(),
  });
  ctx.registerCommand({
    id: 'testbed.nav.sort',
    title: 'testbed.nav.sort',
    icon: 'sort',
    run: () => testbedNavState.sortItems(),
  });
  ctx.registerCommand({
    id: 'testbed.secret',
    title: 'testbed.cmd.secret',
    icon: 'testbedStar',
    shortcut: 'mod+shift+y',
    access: { anyRole: ['admin'] },
    run: () =>
      ctx.ui.toast({ message: 'testbed.cmd.secretDone', timeoutMs: 4000 }),
  });
  ctx.registerCommand({
    id: 'testbed.auth.cycle',
    title: 'testbed.auth.cycle',
    icon: 'testbedUserSwitch',
    run: () => {
      ctx.ui.toast({
        message: principalToastKey(testbedAuth.cycle()),
        timeoutMs: 4000,
      });
    },
  });
  ctx.registerCommand({
    id: 'testbed.auth.signOut',
    title: 'testbed.auth.signOut',
    icon: 'testbedSignOut',
    run: () => {
      testbedAuth.signOut();
      ctx.ui.toast({ message: 'testbed.auth.signedOut', timeoutMs: 4000 });
    },
  });
  ctx.registerCommand({
    id: 'testbed.auth.dropAdmin',
    title: 'testbed.auth.dropAdmin',
    icon: 'testbedStepDown',
    run: () => {
      testbedAuth.dropAdmin();
      ctx.ui.toast({ message: 'testbed.auth.droppedAdmin', timeoutMs: 4000 });
    },
  });
  ctx.registerCommand({
    id: 'testbed.auth.grace',
    title: 'testbed.auth.grace',
    icon: 'testbedUser',
    access: { authenticated: true },
    run: () => testbedAuth.switchToGrace(),
  });
  ctx.registerCommand({
    id: 'testbed.openSettings',
    title: 'testbed.cmd.settings',
    icon: 'settings',
    shortcut: 'mod+shift+s',
    popout: true,
    run: () => ctx.ui.openSettings(),
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
