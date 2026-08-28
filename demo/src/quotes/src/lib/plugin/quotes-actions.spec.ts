import type { OpenTabInput, PluginContext } from '@loomweaver/plugin-sdk';
import { quoteById } from '../../../../accounting';
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
        path: 'quotes/q-0007',
        title: quote!.number,
        titleIsLiteral: true,
        icon: 'quotes',
        preview: true,
      },
    ]);
  });

  it('keeps a quote with a second call that promotes the tab, because re-opening never clears the preview state the host holds', () => {
    const { recorded, ctx } = recorder();
    quotesActions.bind(ctx);

    quotesActions.keep(quoteById('q-0007')!);

    expect(recorded.opened.map((input) => input.preview)).toEqual([false]);
    expect(recorded.kept).toEqual(['quotes/q-0007']);
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
