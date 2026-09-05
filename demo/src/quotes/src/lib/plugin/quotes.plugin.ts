import { Plugin } from '@loomweaver/plugin-sdk';
import { QuotesCustomerView } from '../views/quotes-customer-view';
import { QuotesListView } from '../views/quotes-list-view';
import { QuotesMarginView } from '../views/quotes-margin-view';
import { QuotesOpenItemsView } from '../views/quotes-open-items-view';
import { QuotesPositionsView } from '../views/quotes-positions-view';
import { quotesActions } from './quotes-actions';
import { registerQuoteCommands } from './quotes-commands';

const quotesIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M6.5 3.5h7.5l4.5 4.5v12a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/>' +
  '<path d="M14 3.5V8h4.5"/><path d="M9 13h6M9 16.5h4"/></svg>';

export const quotesPlugin: Plugin = {
  manifest: {
    id: 'quotes',
    name: 'Quotes',
    capabilities: ['contributions', 'navigation'],
  },
  activate(ctx) {
    quotesActions.bind(ctx);
    ctx.contributeIcons({ quotes: quotesIcon });
    registerQuoteCommands(ctx);

    ctx.registerSurface({
      id: 'quotes',
      title: 'quotes.title',
      icon: 'quotes',
      routable: { path: 'sales/quotes' },
      docks: [],
      padded: false,
      component: QuotesListView,
    });

    ctx.registerSurface({
      id: 'quotes.openItems',
      title: 'quotes.openItems.title',
      icon: 'quotes',
      docks: ['left-panel'],
      padded: false,
      component: QuotesOpenItemsView,
    });

    ctx.registerSurface({
      id: 'quotes.document',
      title: 'quotes.document.title',
      icon: 'quotes',
      routable: { path: 'sales/quotes/:id' },
      container: {
        children: [
          'quotes.positions',
          'quotes.customer',
          'quotes.margin',
        ],
        initial: {
          columns: [
            { size: 62, tabs: [{ surface: 'quotes.positions', closable: false }] },
            {
              size: 38,
              rows: [
                { size: 45, tabs: ['quotes.customer'] },
                { size: 55, tabs: ['quotes.margin'] },
              ],
            },
          ],
        },
      },
    });

    ctx.registerSurface({
      id: 'quotes.positions',
      title: 'quotes.document.positions',
      docks: [],
      component: QuotesPositionsView,
    });

    ctx.registerSurface({
      id: 'quotes.customer',
      title: 'quotes.document.customer',
      docks: [],
      component: QuotesCustomerView,
    });

    ctx.registerSurface({
      id: 'quotes.margin',
      title: 'quotes.document.margin',
      docks: [],
      access: { anyRole: ['accounting'] },
      component: QuotesMarginView,
    });
  },
  deactivate() {
    quotesActions.unbind();
  },
};
