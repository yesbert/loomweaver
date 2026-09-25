import { PluginContext } from '@loomweaver/plugin-sdk';
import { ContainerAuditView } from './container-audit-view';
import { ContainerCanvasView } from './container-canvas-view';
import { ContainerDetailsView } from './container-details-view';
import { ContainerItemView } from './container-item-view';
import { ContainerListView } from './container-list-view';

interface ContainerTab {
  readonly kind: 'container' | 'arranged' | 'browse';
  readonly literalTitle: string;
  readonly icon: string;
}

const CONTAINER_TAB: ContainerTab = {
  kind: 'container',
  literalTitle: 'Container',
  icon: 'testbedDashboard',
};
const ARRANGED_TAB: ContainerTab = {
  kind: 'arranged',
  literalTitle: 'Arranged',
  icon: 'splitPanesDown',
};
const BROWSE_TAB: ContainerTab = {
  kind: 'browse',
  literalTitle: 'Browse',
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
    title: `${tab.literalTitle} ${id}`,
    icon: tab.icon,
    titleIsLiteral: true,
  });
}

function registerContainerSurfaces(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.container',
    title: 'testbed.container.title',
    routable: { path: 'container/:id' },
    container: {
      children: ['testbed.containerCanvas', 'testbed.containerDetails', 'testbed.containerFrame'],
      initial: ['testbed.containerCanvas', 'testbed.containerDetails'],
    },
  });
  ctx.registerSurface({
    id: 'testbed.arranged',
    title: 'testbed.arranged.title',
    routable: { path: 'arranged/:id' },
    container: {
      children: [
        'testbed.containerCanvas',
        'testbed.containerDetails',
        'testbed.containerFrame',
        'testbed.containerAudit',
      ],
      initial: {
        columns: [
          { size: 60, tabs: ['testbed.containerCanvas'] },
          {
            size: 40,
            rows: [
              {
                size: 45,
                tabs: [{ surface: 'testbed.containerDetails', closable: false }],
              },
              { size: 30, tabs: ['testbed.containerFrame'] },
              { size: 25, tabs: ['testbed.containerAudit'] },
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
        { surface: 'testbed.containerList', segment: 'list' },
        { surface: 'testbed.containerItem', segment: 'item/:itemId' },
        'testbed.containerDetails',
      ],
      initial: {
        columns: [
          { size: 34, tabs: [{ surface: 'testbed.containerList', closable: false }] },
          { size: 66, tabs: [] },
        ],
      },
    },
  });
}

function registerChildSurfaces(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.containerList',
    title: 'testbed.container.list',
    icon: 'outline',
    docks: [],
    component: ContainerListView,
  });
  ctx.registerSurface({
    id: 'testbed.containerItem',
    title: 'testbed.container.item',
    icon: 'testbedEntry',
    docks: [],
    component: ContainerItemView,
  });
  ctx.registerSurface({
    id: 'testbed.containerFrame',
    title: 'testbed.container.frame',
    badge: { text: 'testbed.badge.beta', tone: 'brand' },
    docks: [],
    iframe: '/docked-frame/view.html?child=1',
  });
  ctx.registerSurface({
    id: 'testbed.containerCanvas',
    title: 'testbed.container.canvas',
    docks: [],
    component: ContainerCanvasView,
  });
  ctx.registerSurface({
    id: 'testbed.containerDetails',
    title: 'testbed.container.details',
    docks: [],
    component: ContainerDetailsView,
  });
  ctx.registerSurface({
    id: 'testbed.containerAudit',
    title: 'testbed.container.audit',
    docks: [],
    access: { anyRole: ['admin'] },
    component: ContainerAuditView,
  });
}

function registerContainerCommands(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.go.container',
    title: 'testbed.container.title',
    icon: 'splitPanes',
    run: () => {
      openContainerTab(ctx, CONTAINER_TAB, 'alpha');
      openContainerTab(ctx, CONTAINER_TAB, 'beta');
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
      ctx.setChildShown('testbed.containerAudit', auditShown);
    },
  });
}

function registerContainerRailItems(ctx: PluginContext): void {
  ctx.registerRailItem({
    id: 'testbed.rail.container',
    rail: 'primary',
    icon: 'splitPanes',
    title: 'testbed.container.title',
    order: 6,
    command: 'testbed.go.container',
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
