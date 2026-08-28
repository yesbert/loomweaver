import { PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedStatusItem } from '../views/testbed-status-item';
import { TestbedStatusCount } from '../views/testbed-status-count';

export function registerChrome(ctx: PluginContext): void {
  registerRailItems(ctx);
  registerBarItems(ctx);
}

function registerRailItems(ctx: PluginContext): void {
  ctx.registerRailItem({
    id: 'testbed.rail.sandbox',
    rail: 'activity',
    icon: 'testbedSandbox',
    title: 'testbed.sandbox.title',
    order: 5,
    command: 'testbed.go.sandbox',
    menu: 'testbed.rail/context',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.workspace',
    rail: 'activity',
    icon: 'splitPanes',
    title: 'testbed.workspace.title',
    order: 6,
    command: 'testbed.go.workspace',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.arranged',
    rail: 'activity',
    icon: 'splitPanesDown',
    title: 'testbed.arranged.title',
    order: 6.5,
    command: 'testbed.go.arranged',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.browse',
    rail: 'activity',
    icon: 'testbedList',
    title: 'testbed.browse.title',
    order: 6.7,
    command: 'testbed.go.browse',
  });
  ctx.registerRailItem({
    id: 'testbed.admin',
    rail: 'activity',
    icon: 'testbedShield',
    title: 'testbed.admin.title',
    order: 7,
    command: 'testbed.go.dashboard',
    access: { anyRole: ['admin'] },
  });
  ctx.registerRailItem({
    id: 'testbed.locked',
    rail: 'activity-right',
    icon: 'testbedUsers',
    title: 'testbed.locked.title',
    order: 7,
    command: 'testbed.go.search',
    access: { authenticated: true, mode: 'disable' },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.secret',
    rail: 'activity-right',
    icon: 'testbedKey',
    title: 'testbed.admin.route',
    order: 8,
    command: 'testbed.go.secret',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.adminArea',
    rail: 'activity-right',
    icon: 'testbedBuilding',
    title: 'testbed.admin.area',
    order: 9,
    command: 'testbed.go.adminArea',
  });
  ctx.registerRailItem({
    id: 'testbed.workspaces',
    rail: 'activity-right',
    icon: 'workspaces',
    title: 'workspace.title',
    anchor: 'bottom',
    order: -4,
    command: 'shell.workspace.manage',
  });
  ctx.registerRailItem({
    id: 'testbed.auth',
    rail: 'activity-right',
    icon: 'testbedUserSwitch',
    title: 'testbed.auth.cycle',
    anchor: 'bottom',
    order: -3,
    command: 'testbed.auth.cycle',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.grace',
    rail: 'activity',
    icon: 'testbedUser',
    title: 'testbed.auth.grace',
    anchor: 'bottom',
    order: -2.5,
    command: 'testbed.auth.grace',
    access: { authenticated: true },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.dropAdmin',
    rail: 'activity',
    icon: 'testbedStepDown',
    title: 'testbed.auth.dropAdmin',
    anchor: 'bottom',
    order: -2,
    command: 'testbed.auth.dropAdmin',
    access: { anyRole: ['admin'] },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.signOut',
    rail: 'activity',
    icon: 'testbedSignOut',
    title: 'testbed.auth.signOut',
    anchor: 'bottom',
    order: -1,
    command: 'testbed.auth.signOut',
    access: { authenticated: true },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.settings',
    rail: 'activity',
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
    id: 'testbed.count',
    bar: 'status-bar',
    slot: 'start',
    component: TestbedStatusCount,
  });
  ctx.registerBarItem({
    id: 'testbed.add',
    bar: 'status-bar',
    slot: 'start',
    order: 1,
    icon: 'add',
    tooltip: 'testbed.status.add',
    command: 'testbed.nav.add',
    showShortcut: true,
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
  ctx.registerBarItem({
    id: 'testbed.status',
    bar: 'status-bar',
    slot: 'end',
    component: TestbedStatusItem,
  });
}
