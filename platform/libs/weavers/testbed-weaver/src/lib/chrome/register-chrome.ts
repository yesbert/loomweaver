import { PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedStatusItem } from './testbed-status-item';

const ACCOUNT_PICTURE_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>",
  "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>",
  "<stop offset='0' stop-color='#2E96C9'/><stop offset='1' stop-color='#C59A2F'/>",
  '</linearGradient></defs>',
  "<rect width='64' height='64' fill='url(#g)'/>",
  "<circle cx='32' cy='25' r='11' fill='#ffffff' fill-opacity='0.9'/>",
  "<path d='M10 60c4-13 12-19 22-19s18 6 22 19z' fill='#ffffff' fill-opacity='0.9'/>",
  '</svg>',
].join('');

const TESTBED_ACCOUNT_PICTURE = `data:image/svg+xml,${encodeURIComponent(ACCOUNT_PICTURE_SVG)}`;

const BROKEN_PICTURE_URL = 'https://testbed.invalid/no-such-picture.png';

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
    id: 'testbed.rail.workspaces',
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
    image: BROKEN_PICTURE_URL,
    menu: 'testbed.account/menu',
    menuTrigger: 'primary',
    menuHeader: {
      title: 'testbed.account.brokenName',
      detail: 'testbed.account.brokenDetail',
      initials: 'GH',
      image: BROKEN_PICTURE_URL,
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
    image: BROKEN_PICTURE_URL,
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
    id: 'testbed.bar.statusAccount',
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
    id: 'testbed.bar.status',
    bar: 'status-bar',
    slot: 'end',
    component: TestbedStatusItem,
  });
}
