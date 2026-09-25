import { PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedStatusItem } from './testbed-status-item';

const TESTBED_ACCOUNT_PICTURE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCc+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdnJyB4MT0nMCcgeTE9JzAnIHgyPScxJyB5Mj0nMSc+PHN0b3Agb2Zmc2V0PScwJyBzdG9wLWNvbG9yPScjMkU5NkM5Jy8+PHN0b3Agb2Zmc2V0PScxJyBzdG9wLWNvbG9yPScjQzU5QTJGJy8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9JzY0JyBoZWlnaHQ9JzY0JyBmaWxsPSd1cmwoI2cpJy8+PGNpcmNsZSBjeD0nMzInIGN5PScyNScgcj0nMTEnIGZpbGw9JyNmZmZmZmYnIGZpbGwtb3BhY2l0eT0nMC45Jy8+PHBhdGggZD0nTTEwIDYwYzQtMTMgMTItMTkgMjItMTlzMTggNiAyMiAxOXonIGZpbGw9JyNmZmZmZmYnIGZpbGwtb3BhY2l0eT0nMC45Jy8+PC9zdmc+';

const TOAST_MS = 3000;

export function registerChrome(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.openSettings',
    title: 'testbed.cmd.settings',
    icon: 'settings',
    shortcut: 'mod+shift+s',
    popout: true,
    run: () => ctx.ui.openSettings(),
  });
  ctx.registerCommand({
    id: 'testbed.account.profile',
    title: 'testbed.account.profile',
    icon: 'testbedUser',
    run: () =>
      ctx.ui.toast({
        message: 'testbed.account.profileOpened',
        timeoutMs: TOAST_MS,
      }),
  });
  registerRailItems(ctx);
  registerBarItems(ctx);
}

function registerRailItems(ctx: PluginContext): void {
  ctx.registerRailItem({
    id: 'testbed.workspaces',
    rail: 'secondary',
    icon: 'workspaces',
    title: 'workspace.title',
    anchor: 'bottom',
    order: -4,
    command: 'shell.workspace.manage',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.account',
    rail: 'primary',
    icon: 'testbedUsers',
    initials: 'AL',
    title: 'testbed.account.title',
    anchor: 'bottom',
    order: -3,
    image: TESTBED_ACCOUNT_PICTURE,
    menu: 'testbed.account/menu',
    menuTrigger: 'primary',
    menuHeader: {
      title: 'testbed.account.name',
      detail: 'testbed.account.detail',
      initials: 'AL',
      image: TESTBED_ACCOUNT_PICTURE,
      command: 'testbed.account.profile',
    },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.account.broken',
    rail: 'primary',
    icon: 'testbedUsers',
    initials: 'GH',
    title: 'testbed.account.brokenTitle',
    anchor: 'bottom',
    order: -2.8,
    image: 'https://testbed.invalid/no-such-picture.png',
    menu: 'testbed.account/menu',
    menuTrigger: 'primary',
    menuHeader: {
      title: 'testbed.account.brokenName',
      detail: 'testbed.account.brokenDetail',
      initials: 'GH',
      image: 'https://testbed.invalid/no-such-picture.png',
    },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.settings',
    rail: 'primary',
    icon: 'settings',
    title: 'testbed.cmd.settings',
    anchor: 'bottom',
    command: 'shell.openSettings',
  });
}

function registerBarItems(ctx: PluginContext): void {
  ctx.registerBarItem({
    id: 'testbed.bar.about',
    bar: 'left-footer',
    slot: 'end',
    icon: 'help',
    tooltip: 'testbed.cmd.about',
    command: 'testbed.about',
  });
  ctx.registerBarItem({
    id: 'testbed.bar.account',
    bar: 'left-footer',
    slot: 'end',
    order: -1,
    icon: 'testbedUsers',
    initials: 'GH',
    image: 'https://testbed.invalid/no-such-picture.png',
    tooltip: 'testbed.account.title',
    menu: 'testbed.account/menu',
    menuTrigger: 'primary',
    menuHeader: {
      title: 'testbed.account.name',
      detail: 'testbed.account.detail',
      image: TESTBED_ACCOUNT_PICTURE,
    },
  });
  ctx.registerBarItem({
    id: 'testbed.status.account',
    bar: 'status-bar',
    slot: 'end',
    order: 1,
    icon: 'testbedUsers',
    initials: 'AL',
    image: TESTBED_ACCOUNT_PICTURE,
    label: 'testbed.account.name',
    menu: 'testbed.account/menu',
    menuTrigger: 'primary',
    menuHeader: {
      title: 'testbed.account.name',
      detail: 'testbed.account.detail',
      image: TESTBED_ACCOUNT_PICTURE,
    },
  });
  ctx.registerBarItem({
    id: 'testbed.status',
    bar: 'status-bar',
    slot: 'end',
    component: TestbedStatusItem,
  });
}
