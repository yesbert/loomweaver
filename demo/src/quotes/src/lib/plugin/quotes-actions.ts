import { type PluginContext } from '@loomweaver/plugin-sdk';
import { type Quote, addQuote, customers } from '../../../../accounting';

let ctx: PluginContext | undefined;

function pathOf(quote: Quote): string {
  return `sales/quotes/${quote.id}`;
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
  async create(customer?: string): Promise<string | null> {
    const host = ctx;
    if (!host) {
      return null;
    }
    const typed =
      customer ??
      (await host.ui.prompt({
        title: 'quotes.create.title',
        message: 'quotes.create.message',
        placeholder: 'quotes.create.placeholder',
        confirmLabel: 'quotes.create.confirm',
      }));
    const needle = typed?.trim().toLowerCase();
    if (!needle) {
      return null;
    }
    const match = customers().find((customer) =>
      customer.name.toLowerCase().includes(needle),
    );
    if (!match) {
      await host.ui.alert({
        title: 'quotes.create.title',
        message: 'quotes.create.noMatch',
        tone: 'warning',
      });
      return null;
    }
    const created = addQuote(match.id);
    this.open(created);
    host.ui.toast({ message: 'quotes.create.done', kind: 'success', timeoutMs: 4000 });
    return created.id;
  },
  activeQuoteId(): string | undefined {
    const active = ctx?.activeContent();
    return active?.surfaceId === 'quotes.document' ? active.params['id'] : undefined;
  },
};
