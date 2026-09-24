import type { OpenTabInput, PluginContext } from '@loomweaver/plugin-sdk';
import { quoteById } from '../../../../accounting';
import { quotesActions } from './quotes-actions';

interface Recorded {
  readonly opened: OpenTabInput[];
  readonly kept: string[];
}

function recorder(activeQuote?: string): { recorded: Recorded; ctx: PluginContext } {
  const recorded: Recorded = { opened: [], kept: [] };
  const ctx = {
    openContentTab: (input: OpenTabInput) => recorded.opened.push(input),
    keepContentTab: (path: string) => recorded.kept.push(path),
    activeContent: () =>
      activeQuote === undefined
        ? null
        : { surfaceId: 'quotes.document', params: { id: activeQuote } },
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
        badge: { text: 'quotes.list.status.sent', tone: 'brand' },
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
      { text: 'quotes.list.status.draft', tone: 'neutral' },
      { text: 'quotes.list.status.accepted', tone: 'success' },
      { text: 'quotes.list.status.declined', tone: 'danger' },
    ]);
  });

  it('refreshes the tab of the quote in front, so a changed status shows at once', () => {
    const { recorded, ctx } = recorder('q-0004');
    quotesActions.bind(ctx);

    quotesActions.refreshIfActive({ ...quoteById('q-0004')!, status: 'sent' });

    expect(recorded.opened.map((input) => input.badge?.text)).toEqual([
      'quotes.list.status.sent',
    ]);
  });

  it('leaves a quote alone that is not in front, rather than bringing its tab forward', () => {
    const { recorded, ctx } = recorder('q-0007');
    quotesActions.bind(ctx);

    quotesActions.refreshIfActive(quoteById('q-0004')!);

    expect(recorded.opened).toEqual([]);
  });

  it('keeps a quote with a second call that promotes the tab, because re-opening never clears the preview state the host holds', () => {
    const { recorded, ctx } = recorder();
    quotesActions.bind(ctx);

    quotesActions.keep(quoteById('q-0007')!);

    expect(recorded.opened.map((input) => input.preview)).toEqual([false]);
    expect(recorded.kept).toEqual(['sales/quotes/q-0007']);
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
});
