import { PluginContext } from '@loomweaver/plugin-sdk';
import { TestbedWsAuditView } from './testbed-ws-audit-view';
import { TestbedWsCanvasView } from './testbed-ws-canvas-view';
import { TestbedWsDetailsView } from './testbed-ws-details-view';
import { TestbedWsItemView } from './testbed-ws-item-view';
import { TestbedWsListView } from './testbed-ws-list-view';

interface ContainerTab {
  readonly kind: 'workspace' | 'arranged' | 'browse';
  readonly title: string;
  readonly icon: string;
}

const WORKSPACE_TAB: ContainerTab = {
  kind: 'workspace',
  title: 'Container',
  icon: 'testbedDashboard',
};
const ARRANGED_TAB: ContainerTab = {
  kind: 'arranged',
  title: 'Arranged',
  icon: 'splitPanesDown',
};
const BROWSE_TAB: ContainerTab = {
  kind: 'browse',
  title: 'Browse',
  icon: 'testbedList',
};

export function registerContainers(ctx: PluginContext): void {
  registerContainerSurfaces(ctx);
  registerChildSurfaces(ctx);
  registerContainerCommands(ctx);
  registerContainerRailItems(ctx);
}

function openContainerTab(
  ctx: PluginContext,
  tab: ContainerTab,
  id: string,
): void {
  ctx.openContentTab({
    path: `${tab.kind}/${id}`,
    title: `${tab.title} ${id}`,
    icon: tab.icon,
    titleIsLiteral: true,
  });
}

function registerContainerSurfaces(ctx: PluginContext): void {
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
}

function registerChildSurfaces(ctx: PluginContext): void {
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
    badge: { text: 'testbed.badge.beta', tone: 'brand' },
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

function registerContainerCommands(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.go.workspace',
    title: 'testbed.workspace.title',
    icon: 'splitPanes',
    run: () => {
      openContainerTab(ctx, WORKSPACE_TAB, 'alpha');
      openContainerTab(ctx, WORKSPACE_TAB, 'beta');
    },
  });
  ctx.registerCommand({
    id: 'testbed.go.arranged',
    title: 'testbed.arranged.title',
    icon: 'splitPanesDown',
    run: () => openContainerTab(ctx, ARRANGED_TAB, 'alpha'),
  });
  ctx.registerCommand({
    id: 'testbed.go.browse',
    title: 'testbed.browse.title',
    icon: 'testbedList',
    run: () => openContainerTab(ctx, BROWSE_TAB, 'alpha'),
  });
  let auditShown = true;
  ctx.registerCommand({
    id: 'testbed.toggleAudit',
    title: 'testbed.cmd.toggleAudit',
    icon: 'splitPanesDown',
    run: () => {
      auditShown = !auditShown;
      ctx.setChildShown('testbed.wsAudit', auditShown);
    },
  });
}

function registerContainerRailItems(ctx: PluginContext): void {
  ctx.registerRailItem({
    id: 'testbed.rail.workspace',
    rail: 'primary',
    icon: 'splitPanes',
    title: 'testbed.workspace.title',
    order: 6,
    command: 'testbed.go.workspace',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.arranged',
    rail: 'primary',
    icon: 'splitPanesDown',
    title: 'testbed.arranged.title',
    order: 6.5,
    command: 'testbed.go.arranged',
  });
  ctx.registerRailItem({
    id: 'testbed.rail.browse',
    rail: 'primary',
    icon: 'testbedList',
    title: 'testbed.browse.title',
    order: 6.7,
    command: 'testbed.go.browse',
  });
}
