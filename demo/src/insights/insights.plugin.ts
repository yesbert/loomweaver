import { Plugin } from '@loomweaver/plugin-sdk';
import { InsightsDashboardView } from './dashboard-view';

const insightsIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3.5" y="3.5" width="7" height="9" rx="1"/>' +
  '<rect x="13.5" y="3.5" width="7" height="5" rx="1"/>' +
  '<rect x="3.5" y="15.5" width="7" height="5" rx="1"/>' +
  '<rect x="13.5" y="11.5" width="7" height="9" rx="1"/></svg>';

export const insightsPlugin: Plugin = {
  manifest: {
    id: 'insights',
    name: 'Insights',
    capabilities: ['contributions', 'navigation'],
  },
  activate(ctx) {
    ctx.contributeIcons({ insights: insightsIcon });

    ctx.registerSurface({
      id: 'insights.dashboard',
      title: 'insights.dashboard.title',
      icon: 'insights',
      docks: [],
      routable: { path: '', chromeless: true },
      component: InsightsDashboardView,
    });

    ctx.registerCommand({
      id: 'insights.overview',
      title: 'insights.command.overview.title',
      description: 'insights.command.overview.description',
      icon: 'insights',
      callable: true,
      answers: 'insights.command.overview.answers',
      run: () => {
        ctx.navigateContent('');
        return { showing: 'dashboard' };
      },
    });
  },
};
