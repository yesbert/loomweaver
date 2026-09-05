import { type Command, type PluginContext } from '@loomweaver/plugin-sdk';
import { formatMoney, marginOf, markQuoteSent, quotes } from '../../../../accounting';
import { quotesActions } from './quotes-actions';

function numbers(): string[] {
  return quotes().map((quote) => quote.number);
}

function byNumber(number: unknown) {
  return quotes().find((quote) => quote.number === number);
}

function openQuote(): Command {
  return {
    id: 'quotes.open',
    title: 'quotes.command.open.title',
    description: 'quotes.command.open.description',
    icon: 'quotes',
    callable: true,
    answers: 'quotes.command.open.answers',
    arguments: [
      {
        name: 'number',
        kind: 'choice',
        choices: numbers(),
        description: 'quotes.command.open.arg.number',
        required: true,
      },
    ],
    run: (_context, args) => {
      const quote = byNumber(args?.['number']);
      if (!quote) {
        return { found: false };
      }
      quotesActions.keep(quote);
      return quote.number;
    },
  };
}

function sendQuote(): Command {
  return {
    id: 'quotes.send',
    title: 'quotes.command.send.title',
    description: 'quotes.command.send.description',
    icon: 'quotes',
    callable: true,
    answers: 'quotes.command.send.answers',
    arguments: [
      {
        name: 'number',
        kind: 'choice',
        choices: numbers(),
        description: 'quotes.command.send.arg.number',
        required: true,
      },
    ],
    run: (_context, args) => {
      const quote = byNumber(args?.['number']);
      if (!quote) {
        return { found: false };
      }
      markQuoteSent(quote.id);
      return { quote: quote.number, status: 'sent' };
    },
  };
}

function quoteMargin(): Command {
  return {
    id: 'quotes.margin',
    title: 'quotes.command.margin.title',
    description: 'quotes.command.margin.description',
    icon: 'quotes',
    callable: true,
    access: { anyRole: ['accounting'] },
    answers: 'quotes.command.margin.answers',
    arguments: [
      {
        name: 'number',
        kind: 'choice',
        choices: numbers(),
        description: 'quotes.command.margin.arg.number',
        required: true,
      },
    ],
    run: (_context, args) => {
      const quote = byNumber(args?.['number']);
      if (!quote) {
        return { found: false };
      }
      const totals = marginOf(quote.lines);
      return {
        quote: quote.number,
        revenue: formatMoney(totals.revenue, 'en'),
        cost: formatMoney(totals.cost, 'en'),
        margin: formatMoney(totals.margin, 'en'),
      };
    },
  };
}

function createQuote(): Command {
  return {
    id: 'quotes.create',
    title: 'quotes.create.action',
    description: 'quotes.create.description',
    icon: 'quotes',
    callable: true,
    answers: 'quotes.create.answers',
    arguments: [
      {
        name: 'customer',
        kind: 'text',
        description: 'quotes.create.arg.customer',
        required: false,
      },
    ],
    run: async (_context, args) => {
      const customer = args?.['customer'];
      const id = await quotesActions.create(
        typeof customer === 'string' ? customer : undefined,
      );
      return { created: id ?? null };
    },
  };
}

export function registerQuoteCommands(ctx: PluginContext): void {
  ctx.registerCommand(createQuote());
  ctx.registerCommand(openQuote());
  ctx.registerCommand(sendQuote());
  ctx.registerCommand(quoteMargin());
}
