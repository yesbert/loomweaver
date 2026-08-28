import { PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedNavView } from '../views/testbed-nav-view';
import { TestbedOutlineView } from '../views/testbed-outline-view';
import { TestbedHomeView } from '../views/testbed-home-view';
import { TestbedEntryView } from '../views/testbed-entry-view';
import { TestbedListView } from '../views/testbed-list-view';
import { TestbedDashboardView } from '../views/testbed-dashboard-view';
import { TestbedSearchView } from '../views/testbed-search-view';
import { TestbedLoginView } from '../views/testbed-login-view';
import { TestbedEscalationsView } from '../views/testbed-escalations-view';
import { TestbedTeamView } from '../views/testbed-team-view';
import { TestbedOwnerView } from '../views/testbed-owner-view';
import { TestbedWsAuditView } from '../views/testbed-ws-audit-view';
import { TestbedWsItemView } from '../views/testbed-ws-item-view';
import { TestbedWsListView } from '../views/testbed-ws-list-view';
import { TestbedWsCanvasView } from '../views/testbed-ws-canvas-view';
import { TestbedWsDetailsView } from '../views/testbed-ws-details-view';

export function registerSurfaces(ctx: PluginContext): void {
  registerContentSurfaces(ctx);
  registerPanelSurfaces(ctx);
}

function registerContentSurfaces(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.home',
    title: 'testbed.home.title',
    routable: { path: '' },
    component: TestbedHomeView,
  });
  ctx.registerSurface({
    id: 'testbed.entry',
    title: 'testbed.entry.title',
    routable: {
      path: 'entry/:id',
      subRoutes: ['detail', 'meta', 'message/:messageId'],
    },
    component: TestbedEntryView,
  });
  ctx.registerSurface({
    id: 'testbed.dash.overview',
    title: 'testbed.dash.overview',
    icon: 'outline',
    routable: { path: 'dashboard/overview' },
    component: TestbedDashboardView,
  });
  ctx.registerSurface({
    id: 'testbed.dash.trends',
    title: 'testbed.dash.trends',
    icon: 'testbedTrends',
    routable: { path: 'dashboard/trends' },
    component: TestbedDashboardView,
  });
  ctx.registerSurface({
    id: 'testbed.dash.export',
    title: 'testbed.dash.export',
    icon: 'download',
    routable: { path: 'dashboard/export' },
    component: TestbedDashboardView,
  });
  ctx.registerSurface({
    id: 'testbed.overview',
    title: 'testbed.overview.title',
    icon: 'outline',
    routable: { path: 'overview' },
    closable: false,
    component: TestbedDashboardView,
  });
  ctx.registerSurface({
    id: 'testbed.search',
    title: 'testbed.search.title',
    routable: { path: 'search' },
    padded: false,
    component: TestbedSearchView,
  });
  ctx.registerSurface({
    id: 'testbed.notes',
    title: 'testbed.notes.title',
    routable: { path: 'notes' },
    retain: 'always',
    saveOn: 'hide',
    loadComponent: () =>
      import('../views/testbed-notes-view').then((m) => m.TestbedNotesView),
  });
  ctx.registerSurface({
    id: 'testbed.retired',
    title: 'testbed.retired.title',
    routable: { path: 'retired' },
    loadComponent: () =>
      import('../views/testbed-notes-view').then((m) => m.TestbedNotesView),
  });
  ctx.registerSurface({
    id: 'testbed.secretArea',
    title: 'testbed.admin.route',
    routable: { path: 'secret' },
    access: { anyRole: ['admin'] },
    component: TestbedEscalationsView,
  });
  ctx.registerSurface({
    id: 'testbed.adminArea',
    title: 'testbed.admin.area',
    routable: { path: 'admin-area' },
    access: { anyRole: ['admin'] },
    component: TestbedTeamView,
  });
  ctx.registerSurface({
    id: 'testbed.login',
    title: 'testbed.login.title',
    routable: { path: 'login', chromeless: true },
    component: TestbedLoginView,
  });
  registerOwnerFacets(ctx);
  registerWorkspaceContainer(ctx);
}

function registerOwnerFacets(ctx: PluginContext): void {
  for (const [index, facet] of ['queue', 'profile'].entries()) {
    ctx.registerSurface({
      id: `testbed.owner.${facet}`,
      title: `testbed.owner.${facet}`,
      order: index,
      routable: {
        path: `owner/:ownerId/${facet}`,
        follows: true,
      },
      component: TestbedOwnerView,
    });
  }
}

function registerWorkspaceContainer(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.workspace',
    title: 'testbed.workspace.title',
    routable: { path: 'workspace/:id' },
    container: {
      children: ['testbed.wsCanvas', 'testbed.wsDetails', 'testbed.wsFrame'],
      initial: ['testbed.wsCanvas', 'testbed.wsDetails'],
    },
  });
  ctx.registerSurface({
    id: 'testbed.arranged',
    title: 'testbed.arranged.title',
    routable: { path: 'arranged/:id' },
    container: {
      children: [
        'testbed.wsCanvas',
        'testbed.wsDetails',
        'testbed.wsFrame',
        'testbed.wsAudit',
      ],
      initial: {
        columns: [
          { size: 60, tabs: ['testbed.wsCanvas'] },
          {
            size: 40,
            rows: [
              {
                size: 45,
                tabs: [{ surface: 'testbed.wsDetails', closable: false }],
              },
              { size: 30, tabs: ['testbed.wsFrame'] },
              { size: 25, tabs: ['testbed.wsAudit'] },
            ],
          },
        ],
      },
    },
  });
  ctx.registerSurface({
    id: 'testbed.browse',
    title: 'testbed.browse.title',
    routable: { path: 'browse/:id' },
    container: {
      children: [
        { surface: 'testbed.wsList', segment: 'list' },
        { surface: 'testbed.wsItem', segment: 'item/:itemId' },
        'testbed.wsDetails',
      ],
      initial: {
        columns: [
          { size: 34, tabs: [{ surface: 'testbed.wsList', closable: false }] },
          { size: 66, tabs: [] },
        ],
      },
    },
  });
  ctx.registerSurface({
    id: 'testbed.wsList',
    title: 'testbed.workspace.list',
    icon: 'outline',
    docks: [],
    component: TestbedWsListView,
  });
  ctx.registerSurface({
    id: 'testbed.wsItem',
    title: 'testbed.workspace.item',
    icon: 'testbedEntry',
    docks: [],
    component: TestbedWsItemView,
  });
  ctx.registerSurface({
    id: 'testbed.wsFrame',
    title: 'testbed.workspace.frame',
    docks: [],
    iframe: '/docked-frame/view.html?child=1',
  });
  ctx.registerSurface({
    id: 'testbed.wsCanvas',
    title: 'testbed.workspace.canvas',
    docks: [],
    component: TestbedWsCanvasView,
  });
  ctx.registerSurface({
    id: 'testbed.wsDetails',
    title: 'testbed.workspace.details',
    docks: [],
    component: TestbedWsDetailsView,
  });
  ctx.registerSurface({
    id: 'testbed.wsAudit',
    title: 'testbed.workspace.audit',
    docks: [],
    access: { anyRole: ['admin'] },
    component: TestbedWsAuditView,
  });
}

function registerPanelSurfaces(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.list',
    title: 'testbed.list.title',
    icon: 'testbedList',
    order: 2,
    instanceable: true,
    docks: ['primary'],
    component: TestbedListView,
  });
  ctx.registerSurface({
    id: 'testbed.nav',
    docks: ['primary'],
    title: 'testbed.nav.title',
    icon: 'navigator',
    order: 0,
    actions: [
      {
        id: 'testbed.nav.add',
        icon: 'add',
        title: 'testbed.nav.add',
        order: 0,
        command: 'testbed.nav.add',
      },
      {
        id: 'testbed.nav.sort',
        icon: 'sort',
        title: 'testbed.nav.sort',
        order: 1,
        command: 'testbed.nav.sort',
      },
      {
        id: 'testbed.nav.lock',
        icon: 'testbedUsers',
        title: 'testbed.nav.lock',
        order: 2,
        command: 'testbed.nav.sort',
        access: { authenticated: true, mode: 'disable' },
      },
      {
        id: 'testbed.nav.reset',
        icon: 'undo',
        title: 'testbed.cmd.reset',
        order: 3,
        command: 'testbed.reset',
      },
    ],
    component: TestbedNavView,
  });
  ctx.registerSurface({
    id: 'testbed.outline',
    title: 'testbed.outline.title',
    icon: 'outline',
    order: 1,
    instanceable: true,
    docks: ['primary'],
    component: TestbedOutlineView,
  });
  ctx.registerSurface({
    id: 'testbed.info',
    docks: ['secondary'],
    title: 'testbed.info.title',
    icon: 'info',
    order: 0,
    loadComponent: () =>
      import('../views/testbed-info-view').then((m) => m.TestbedInfoView),
  });
  ctx.registerSurface({
    id: 'testbed.dockedFrame',
    docks: ['secondary'],
    title: 'testbed.dockedFrame.title',
    icon: 'testbedSandbox',
    order: 1,
    retain: 'always',
    iframe: '/docked-frame/view.html',
  });
  ctx.registerSurface({
    id: 'testbed.adminView',
    docks: ['secondary'],
    title: 'testbed.admin.view',
    icon: 'testbedShield',
    order: 5,
    component: TestbedTeamView,
    access: { anyRole: ['admin'] },
  });
}
