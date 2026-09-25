import type { OpenTabInput, PluginContext } from '@loomweaver/plugin-sdk';
import { quoteById, resetQuotes } from '../accounting';
import { quotesActions } from './quotes-actions';

interface Recorded {
  readonly opened: OpenTabInput[];
  readonly kept: string[];
}

function recorder(): { recorded: Recorded; ctx: PluginContext } {
  const recorded: Recorded = { opened: [], kept: [] };
  const ctx = {
    openContentTab: (input: OpenTabInput) => recorded.opened.push(input),
    keepContentTab: (path: string) => recorded.kept.push(path),
  } as unknown as PluginContext;
  return { recorded, ctx };
}

describe('quotesActions', () => {
  afterEach(() => quotesActions.unbind());

  it('previews a quote in the reused slot, labelled with the document number', () => {
    const { recorded, ctx } = recorder();
    quotesActions.bind(ctx);

    const quote = quoteById('q-0007');
    quotesActions.open(quote!, { preview: true });

    expect(recorded.opened).toEqual([
      {
        path: 'sales/quotes/q-0007',
        title: quote!.number,
        titleIsLiteral: true,
        icon: 'quotes',
        badge: { text: 'accounting.quoteStatus.sent', tone: 'brand' },
        preview: true,
      },
    ]);
  });

  it('marks the tab with the quote status, in the tone the list gives it', () => {
    const { recorded, ctx } = recorder();
    quotesActions.bind(ctx);

    quotesActions.open(quoteById('q-0004')!);
    quotesActions.open(quoteById('q-0005')!);
    quotesActions.open(quoteById('q-0002')!);

    expect(recorded.opened.map((input) => input.badge)).toEqual([
      { text: 'accounting.quoteStatus.draft', tone: 'neutral' },
      { text: 'accounting.quoteStatus.accepted', tone: 'success' },
      { text: 'accounting.quoteStatus.declined', tone: 'danger' },
    ]);
  });

  it('labels a quote tab with its number and status where it stands, without opening or bringing it forward', () => {
    const updateContentTab = vi.fn();
    quotesActions.bind({ updateContentTab } as unknown as PluginContext);

    quotesActions.labelTab({ ...quoteById('q-0004')!, status: 'sent' });

    expect(updateContentTab).toHaveBeenCalledWith('sales/quotes/q-0004', {
      title: 'Q-0004',
      titleIsLiteral: true,
      badge: { text: 'accounting.quoteStatus.sent', tone: 'brand' },
    });
  });

  it('hands a menu to the workbench, at the pointer it was asked for', () => {
    const openMenu = vi.fn();
    quotesActions.bind({ ui: { openMenu } } as unknown as PluginContext);
    const items = [{ label: 'quotes.menu.open', run: () => undefined }];

    quotesActions.openMenu(items, { x: 12, y: 34 });

    expect(openMenu).toHaveBeenCalledWith(items, { x: 12, y: 34 });
  });

  it('turns opening a tab into a no-op once a disabled plugin lost its context, rather than throwing inside a click handler', () => {
    const { recorded, ctx } = recorder();
    quotesActions.bind(ctx);
    quotesActions.unbind();

    quotesActions.open(quoteById('q-0007')!, { preview: true });
    quotesActions.keep(quoteById('q-0007')!);

    expect(recorded.opened).toEqual([]);
    expect(recorded.kept).toEqual([]);
  });

  it('creates a quote for exactly the customer it is given, without asking', () => {
    const { recorded, ctx } = recorder();
    quotesActions.bind({ ...ctx, ui: { toast: () => undefined } } as unknown as PluginContext);

    const id = quotesActions.createFor('c-nordwind');

    expect(id && quoteById(id)?.customerId).toBe('c-nordwind');
    expect(recorded.opened).toHaveLength(1);
    resetQuotes();
  });
});
