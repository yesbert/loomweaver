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
      title: 'product.view.receivables',
      icon: 'receivables',
      routable: { path: 'finance/receivables' },
      docks: [],
      padded: false,
      component: ReceivablesView,
    });
    ctx.registerSurface({
      id: 'finance.payables',
      title: 'product.view.payables',
      icon: 'payables',
      routable: { path: 'finance/payables' },
      docks: [],
      padded: false,
      component: PayablesView,
    });
    ctx.registerSurface({
      id: 'finance.ledger',
      title: 'product.view.ledger',
      icon: 'ledger',
      routable: { path: 'finance/ledger' },
      docks: [],
      padded: false,
      component: LedgerView,
    });
    ctx.registerSurface({
      id: 'finance.closing',
      title: 'product.view.closing',
      icon: 'closing',
      routable: { path: 'finance/closing' },
      docks: [],
      padded: false,
      component: ClosingView,
    });
    ctx.registerSurface({
      id: 'finance.dunning',
      title: 'product.view.dunning',
      icon: 'dunning',
      routable: { path: 'finance/dunning' },
      docks: [],
      padded: false,
      component: DunningView,
    });

    ctx.registerCommand({
      id: 'finance.dunningRun',
      title: 'product.finance.startDunning',
      description: 'product.finance.dunningDescription',
      icon: 'dunning',
      callable: true,
      answers: 'product.finance.dunningAnswers',
      run: async () => ({ reminded: await financeActions.dunningRun() }),
    });
  },
  deactivate() {
    financeActions.unbind();
  },
};
