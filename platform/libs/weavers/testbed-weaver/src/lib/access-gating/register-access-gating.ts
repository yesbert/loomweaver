import { AuthSnapshot, PluginContext } from '@loomweaver/plugin-sdk';
import { testbedContext } from '../bound-context';
import { testbedAuth } from './testbed-auth';
import { TestbedEscalationsView } from './testbed-escalations-view';
import { TestbedLoginView } from './testbed-login-view';
import { TestbedTeamView } from './testbed-team-view';

export const SECRET_PATH = 'secret';
export const ADMIN_AREA_PATH = 'admin-area';

const TOAST_MS = 4000;

function principalToastKey(session: AuthSnapshot): string {
  if (session.roles.includes('admin')) {
    return 'testbed.auth.asAdmin';
  }
  return session.authenticated ? 'testbed.auth.asUser' : 'testbed.auth.asAnon';
}

export function registerAccessGating(ctx: PluginContext): void {
  registerGatedSurfaces(ctx);
  registerSessionCommands(ctx);
  registerGatedChrome(ctx);
}

function registerGatedSurfaces(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.secretArea',
    title: 'testbed.admin.route',
    routable: { path: SECRET_PATH },
    access: { anyRole: ['admin'] },
    component: TestbedEscalationsView,
  });
  ctx.registerSurface({
    id: 'testbed.adminArea',
    title: 'testbed.admin.area',
    routable: { path: ADMIN_AREA_PATH },
    access: { anyRole: ['admin'] },
    component: TestbedTeamView,
  });
  ctx.registerSurface({
    id: 'testbed.login',
    title: 'testbed.login.title',
    routable: { path: 'login', chromeless: true },
    component: TestbedLoginView,
  });
  ctx.registerSurface({
    id: 'testbed.adminView',
    docks: ['right-panel'],
    padded: true,
    title: 'testbed.admin.view',
    icon: 'testbedShield',
    order: 5,
    component: TestbedTeamView,
    access: { anyRole: ['admin'] },
  });
}

function registerSessionCommands(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.go.secret',
    title: 'testbed.admin.route',
    icon: 'testbedKey',
    run: () => testbedContext.navigateTo(SECRET_PATH),
  });
  ctx.registerCommand({
    id: 'testbed.go.adminArea',
    title: 'testbed.admin.area',
    icon: 'testbedBuilding',
    run: () => testbedContext.navigateTo(ADMIN_AREA_PATH),
  });
  ctx.registerCommand({
    id: 'testbed.secret',
    title: 'testbed.cmd.secret',
    icon: 'testbedStar',
    shortcut: 'mod+shift+y',
    access: { anyRole: ['admin'] },
    run: () =>
      ctx.ui.toast({ message: 'testbed.cmd.secretDone', timeoutMs: TOAST_MS }),
  });
  ctx.registerCommand({
    id: 'testbed.auth.cycle',
    title: 'testbed.auth.cycle',
    icon: 'testbedUserSwitch',
    run: () => {
      testbedAuth.cycle();
      ctx.ui.toast({
        message: principalToastKey(testbedAuth.snapshot()),
        timeoutMs: TOAST_MS,
      });
    },
  });
  ctx.registerCommand({
    id: 'testbed.auth.signOut',
    title: 'testbed.auth.signOut',
    icon: 'testbedSignOut',
    run: () => {
      testbedAuth.signOut();
      ctx.ui.toast({ message: 'testbed.auth.signedOut', timeoutMs: TOAST_MS });
    },
  });
  ctx.registerCommand({
    id: 'testbed.auth.dropAdmin',
    title: 'testbed.auth.dropAdmin',
    icon: 'testbedStepDown',
    run: () => {
      testbedAuth.dropAdmin();
      ctx.ui.toast({
        message: 'testbed.auth.droppedAdmin',
        timeoutMs: TOAST_MS,
      });
    },
  });
  ctx.registerCommand({
    id: 'testbed.auth.grace',
    title: 'testbed.auth.grace',
    icon: 'testbedUser',
    access: { authenticated: true },
    run: () => testbedAuth.switchToGrace(),
  });
}

function registerGatedChrome(ctx: PluginContext): void {
  ctx.registerRailItem({
    id: 'testbed.admin',
    rail: 'primary',
    icon: 'testbedShield',
    title: 'testbed.admin.title',
    order: 7,
    command: 'testbed.go.dashboard',
    access: { anyRole: ['admin'] },
  });
  ctx.registerRailItem({
    id: 'testbed.locked',
    rail: 'secondary',
    icon: 'testbedUsers',
    title: 'testbed.locked.title',
    order: 7,
    command: 'testbed.go.search',
    access: { authenticated: true, mode: 'disable' },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.secret',
    rail: 'secondary',
    icon: 'testbedKey',
    title: 'testbed.admin.route',
    order: 8,
    command: 'testbed.go.secret',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.adminArea',
    rail: 'secondary',
    icon: 'testbedBuilding',
    title: 'testbed.admin.area',
    order: 9,
    command: 'testbed.go.adminArea',
  });
  ctx.registerRailItem({
    id: 'testbed.auth',
    rail: 'secondary',
    icon: 'testbedUserSwitch',
    title: 'testbed.auth.cycle',
    anchor: 'bottom',
    order: -3,
    command: 'testbed.auth.cycle',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.grace',
    rail: 'primary',
    icon: 'testbedUser',
    title: 'testbed.auth.grace',
    anchor: 'bottom',
    order: -2.5,
    command: 'testbed.auth.grace',
    access: { authenticated: true },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.dropAdmin',
    rail: 'primary',
    icon: 'testbedStepDown',
    title: 'testbed.auth.dropAdmin',
    anchor: 'bottom',
    order: -2,
    command: 'testbed.auth.dropAdmin',
    access: { anyRole: ['admin'] },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.signOut',
    rail: 'primary',
    icon: 'testbedSignOut',
    title: 'testbed.auth.signOut',
    anchor: 'bottom',
    order: -1,
    command: 'testbed.auth.signOut',
    access: { authenticated: true },
  });
  ctx.registerBarItem({
    id: 'testbed.adminBar',
    bar: 'status-bar',
    slot: 'end',
    order: 2,
    icon: 'testbedShield',
    label: 'testbed.admin.bar',
    command: 'testbed.go.dashboard',
    access: { anyRole: ['admin'] },
  });
}
