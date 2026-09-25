import { OpenTabInput, PluginContext } from '@loomweaver/plugin-sdk';
import type { Mock } from 'vitest';
import { testbedContext } from '../bound-context';
import { entryTabs } from './entry-tab-actions';
import { ENTRIES } from './testbed-entries';

type Ctx = {
  openContentTab: Mock;
  keepContentTab: Mock;
  updateContentTab: Mock;
  navigateContent: Mock;
  revealSurface: Mock;
  ui: PluginContext['ui'];
};

function ctx(): Ctx {
  return {
    openContentTab: vi.fn(),
    keepContentTab: vi.fn(),
    updateContentTab: vi.fn(),
    navigateContent: vi.fn(),
    revealSurface: vi.fn(),
    ui: {} as PluginContext['ui'],
  };
}

describe('entry tab actions', () => {
  afterEach(() => {
    testbedContext.unbind();
    entryTabs.reset();
  });

  it('exposes a list of entries', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
    expect(ENTRIES.map((d) => d.id)).toContain('e-01');
  });

  it('warns and does nothing when a view acts before the context is bound', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    testbedContext.navigateTo('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('opens an entry as a preview tab and marks it open', () => {
    const c = ctx();
    testbedContext.bind(c);

    entryTabs.openEntry(ENTRIES[0], 'preview');

    const input = c.openContentTab.mock.calls[0][0] as OpenTabInput;
    expect(input).toMatchObject({
      path: `entry/${ENTRIES[0].id}`,
      title: ENTRIES[0].reference,
      titleIsLiteral: true,
      preview: true,
    });
    expect(entryTabs.openIds().has(ENTRIES[0].id)).toBe(true);
  });

  it("clears the open mark when the tab's onClose fires", () => {
    const c = ctx();
    testbedContext.bind(c);
    entryTabs.openEntry(ENTRIES[0]);
    const input = c.openContentTab.mock.calls[0][0] as OpenTabInput;

    input.onClose?.();

    expect(entryTabs.openIds().has(ENTRIES[0].id)).toBe(false);
  });

  it('flags every open entry in place, and takes the flag away again', () => {
    const c = ctx();
    testbedContext.bind(c);
    entryTabs.openEntry(ENTRIES[0]);
    entryTabs.openEntry(ENTRIES[1]);

    entryTabs.toggleFlagOnOpenEntries();
    entryTabs.toggleFlagOnOpenEntries();

    expect(c.updateContentTab.mock.calls).toEqual([
      [
        `entry/${ENTRIES[0].id}`,
        { badge: { text: 'testbed.badge.flagged', tone: 'danger' } },
      ],
      [
        `entry/${ENTRIES[1].id}`,
        { badge: { text: 'testbed.badge.flagged', tone: 'danger' } },
      ],
      [`entry/${ENTRIES[0].id}`, { badge: null }],
      [`entry/${ENTRIES[1].id}`, { badge: null }],
    ]);
  });

  it('promotes a preview tab via keepEntry', () => {
    const c = ctx();
    testbedContext.bind(c);
    entryTabs.keepEntry(ENTRIES[1]);
    expect(c.keepContentTab).toHaveBeenCalledWith(`entry/${ENTRIES[1].id}`);
  });

  it('reveals the entry list', () => {
    const c = ctx();
    testbedContext.bind(c);
    entryTabs.revealList();
    expect(c.revealSurface).toHaveBeenCalledWith('testbed.list');
  });

  it('reset clears the open set, and an unbound context navigates nowhere', () => {
    const c = ctx();
    testbedContext.bind(c);
    entryTabs.openEntry(ENTRIES[0]);
    testbedContext.unbind();
    entryTabs.reset();

    expect(entryTabs.openIds().size).toBe(0);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    testbedContext.navigateTo('');
    expect(c.navigateContent).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
