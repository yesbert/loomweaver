import { PluginContext } from '@loomweaver/plugin-sdk';
import { testbedContext } from '../bound-context';
import { TestbedDashboardView } from './testbed-dashboard-view';

export const DASHBOARD_OVERVIEW_PATH = 'dashboard/overview';

export function registerDashboard(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.dash.overview',
    title: 'testbed.dash.overview',
    icon: 'outline',
    routable: { path: DASHBOARD_OVERVIEW_PATH },
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
    badge: { text: 'testbed.badge.new', tone: 'success' },
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

  ctx.registerCommand({
    id: 'testbed.go.dashboard',
    title: 'testbed.dash.title',
    icon: 'testbedDashboard',
    run: () => testbedContext.navigateTo(DASHBOARD_OVERVIEW_PATH),
  });
}
