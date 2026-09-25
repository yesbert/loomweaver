import { Plugin } from '@loomweaver/plugin-sdk';
import { ClosingView } from './closing-view';
import { DunningView } from './dunning-view';
import { LedgerView } from './ledger-view';
import { PayablesView } from './payables-view';
import { ReceivablesView } from './receivables-view';
import { financeActions } from './finance-actions';

export const financePlugin: Plugin = {
  manifest: {
    id: 'finance',
    name: 'Finance',
    capabilities: ['contributions', 'navigation', 'ui'],
  },
  activate(ctx) {
    financeActions.bind(ctx);

    ctx.registerSurface({
      id: 'finance.receivables',
      title: 'finance.view.receivables',
      icon: 'receivables',
      routable: { path: 'finance/receivables' },
      docks: [],
      component: ReceivablesView,
    });
    ctx.registerSurface({
      id: 'finance.payables',
      title: 'finance.view.payables',
      icon: 'payables',
      routable: { path: 'finance/payables' },
      docks: [],
      component: PayablesView,
    });
    ctx.registerSurface({
      id: 'finance.ledger',
      title: 'finance.view.ledger',
      icon: 'ledger',
      routable: { path: 'finance/ledger' },
      docks: [],
      component: LedgerView,
    });
    ctx.registerSurface({
      id: 'finance.closing',
      title: 'finance.view.closing',
      icon: 'closing',
      routable: { path: 'finance/closing' },
      docks: [],
      component: ClosingView,
    });
    ctx.registerSurface({
      id: 'finance.dunning',
      title: 'finance.view.dunning',
      icon: 'dunning',
      routable: { path: 'finance/dunning' },
      docks: [],
      component: DunningView,
    });

    ctx.registerCommand({
      id: 'finance.dunningRun',
      title: 'finance.startDunning',
      description: 'finance.dunningDescription',
      icon: 'dunning',
      callable: true,
      answers: 'finance.dunningAnswers',
      run: async () => ({ reminded: await financeActions.dunningRun() }),
    });
  },
  deactivate() {
    financeActions.unbind();
  },
};
