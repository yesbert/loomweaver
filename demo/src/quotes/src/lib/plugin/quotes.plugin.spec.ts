import type { PluginContext } from '@loomweaver/plugin-sdk';
import { quotesPlugin } from './quotes.plugin';

interface RecordedSurface {
  readonly id: string;
  readonly path?: string;
  readonly docks?: readonly string[];
  readonly access?: unknown;
}

type Area = {
  tabs?: readonly (string | { surface: string })[];
  rows?: readonly Area[];
  columns?: readonly Area[];
};

function namedInArrangement(area: Area | readonly string[] | undefined): string[] {
  if (area === undefined || Array.isArray(area)) {
    return [...((area as readonly string[]) ?? [])];
  }
  const tree = area as Area;
  if (tree.tabs) {
    return tree.tabs.map((tab) => (typeof tab === 'string' ? tab : tab.surface));
  }
  return (tree.rows ?? tree.columns ?? []).flatMap(namedInArrangement);
}

interface RecordedCommand {
  readonly id: string;
  readonly callable?: boolean;
  readonly description?: string;
  readonly argumentNames: readonly string[];
}

interface Recorded {
  readonly icons: string[];
  readonly surfaces: RecordedSurface[];
  readonly commands: RecordedCommand[];
  readonly railItems: { id: string; rail: string }[];
  container?: { children: readonly string[]; initial?: Area | readonly string[] };
}

function activateWithRecorder(): Recorded {
  const recorded: Recorded = { icons: [], surfaces: [], commands: [], railItems: [] };
  const ctx = {
    contributeIcons: (icons: Record<string, string>) => recorded.icons.push(...Object.keys(icons)),
    registerSurface: (surface: {
      id: string;
      docks?: readonly string[];
      routable?: { path: string };
      access?: unknown;
      container?: { children: readonly string[]; initial?: Area | readonly string[] };
    }) => {
      recorded.surfaces.push({
        id: surface.id,
        path: surface.routable?.path,
        docks: surface.docks,
        access: surface.access,
      });
      if (surface.container) {
        recorded.container = surface.container;
      }
    },
    registerCommand: (command: {
      id: string;
      callable?: boolean;
      description?: string;
      arguments?: readonly { name: string }[];
    }) =>
      recorded.commands.push({
        id: command.id,
        callable: command.callable,
        description: command.description,
        argumentNames: (command.arguments ?? []).map((one) => one.name),
      }),
    registerRailItem: (item: { id: string; rail: string }) =>
      recorded.railItems.push({ id: item.id, rail: item.rail }),
  } as unknown as PluginContext;

  quotesPlugin.activate(ctx);
  return recorded;
}

describe('quotesPlugin', () => {
  it('declares only the capabilities it uses', () => {
    expect(quotesPlugin.manifest.id).toBe('quotes');
    expect([...(quotesPlugin.manifest.capabilities ?? [])].sort()).toEqual([
      'contributions',
      'navigation',
    ]);
  });

  it('docks the list and routes the documents, pinning each dock by name because a wrong one leaves the surface invisible', () => {
    const recorded = activateWithRecorder();

    expect(
      recorded.surfaces.map(({ id, path, docks }) => ({ id, path, docks })),
    ).toEqual([
      { id: 'quotes', path: 'sales/quotes', docks: [] },
      { id: 'quotes.openItems', path: undefined, docks: ['left-panel'] },
      { id: 'quotes.document', path: 'sales/quotes/:id', docks: undefined },
      { id: 'quotes.positions', path: undefined, docks: [] },
      { id: 'quotes.customer', path: undefined, docks: [] },
      { id: 'quotes.margin', path: undefined, docks: [] },
    ]);
  });

  it('arranges the document from children it also declares', () => {
    const document = activateWithRecorder().container;

    expect(document?.children).toEqual([
      'quotes.positions',
      'quotes.customer',
      'quotes.margin',
    ]);
    expect(namedInArrangement(document?.initial)).toEqual([
      'quotes.positions',
      'quotes.customer',
      'quotes.margin',
    ]);
  });

  it('gates only the margin child', () => {
    const gated = activateWithRecorder()
      .surfaces.filter((surface) => surface.access !== undefined)
      .map((surface) => surface.id);

    expect(gated).toEqual(['quotes.margin']);
  });

  it('claims no place in the rail, because the list is seeded into the sidebar instead — putting one back is a decision, not a slip', () => {
    expect(activateWithRecorder().railItems).toEqual([]);
  });

  it('registers the icon its own contributions ask for, because an unregistered name ships a blank button and says nothing', () => {
    expect(activateWithRecorder().icons).toContain('quotes');
  });

  it('opens its commands to a caller that is not the user, described and with a typed argument', () => {
    const { commands } = activateWithRecorder();

    expect(commands.map((command) => command.id)).toEqual([
      'quotes.create',
      'quotes.open',
      'quotes.send',
      'quotes.margin',
    ]);
    for (const command of commands) {
      expect(command.callable).toBe(true);
      expect(command.description).toBeDefined();
    }
    expect(
      commands
        .filter((command) => command.id !== 'quotes.create')
        .map((command) => command.argumentNames),
    ).toEqual([['number'], ['number'], ['number']]);
    expect(
      commands.find((command) => command.id === 'quotes.create')?.argumentNames,
    ).toEqual(['customer']);
  });
});
