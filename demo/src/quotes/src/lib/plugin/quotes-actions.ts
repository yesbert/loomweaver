import { type PluginContext } from '@loomweaver/plugin-sdk';
import { type Quote } from '../../../../accounting';

let ctx: PluginContext | undefined;

function pathOf(quote: Quote): string {
  return `quotes/${quote.id}`;
}

export const quotesActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  open(quote: Quote, options: { preview?: boolean } = {}): void {
    ctx?.openContentTab({
      path: pathOf(quote),
      title: quote.number,
      titleIsLiteral: true,
      icon: 'quotes',
      preview: options.preview ?? false,
    });
  },
  keep(quote: Quote): void {
    this.open(quote);
    ctx?.keepContentTab(pathOf(quote));
  },
  activeQuoteId(): string | undefined {
    const active = ctx?.activeContent();
    return active?.surfaceId === 'quotes.document' ? active.params['id'] : undefined;
  },
};
