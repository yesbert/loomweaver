import { OpenTabInput, PluginContext } from '@loomweaver/plugin-sdk';
import { ENTRIES } from '../views/testbed-entries';
import { testbedContent } from './testbed-content';
import type { Mock } from 'vitest';

type Ctx = {
  openContentTab: Mock;
  keepContentTab: Mock;
  navigateContent: Mock;
  revealSurface: Mock;
  ui: PluginContext['ui'];
};

function ctx(): Ctx {
  return {
    openContentTab: vi.fn(),
    keepContentTab: vi.fn(),
    navigateContent: vi.fn(),
    revealSurface: vi.fn(),
    ui: {} as PluginContext['ui'],
  };
}

describe('testbedContent (TestbedWeaver content-navigation bridge)', () => {
  afterEach(() => testbedContent.unbind());

  it('exposes a list of entries', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
    expect(ENTRIES.map((d) => d.id)).toContain('e-01');
  });

  it('warns and no-ops when a view acts before the context is bound', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    testbedContent.goHome();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('opens a entry as a preview tab and marks it open', () => {
    const c = ctx();
    testbedContent.bind(c);

    testbedContent.openEntry(ENTRIES[0], 'preview');

    const input = c.openContentTab.mock.calls[0][0] as OpenTabInput;
    expect(input).toMatchObject({
      path: `entry/${ENTRIES[0].id}`,
      title: ENTRIES[0].reference,
      titleIsLiteral: true,
      preview: true,
    });
    expect(testbedContent.openEntryIds().has(ENTRIES[0].id)).toBe(true);
  });

  it("clears the open mark when the tab's onClose fires", () => {
    const c = ctx();
    testbedContent.bind(c);
    testbedContent.openEntry(ENTRIES[0]);
    const input = c.openContentTab.mock.calls[0][0] as OpenTabInput;

    input.onClose?.();

    expect(testbedContent.openEntryIds().has(ENTRIES[0].id)).toBe(false);
  });

  it('promotes a preview tab via keepEntry', () => {
    const c = ctx();
    testbedContent.bind(c);
    testbedContent.keepEntry(ENTRIES[1]);
    expect(c.keepContentTab).toHaveBeenCalledWith(`entry/${ENTRIES[1].id}`);
  });

  it('navigates to the built-in perspectives', () => {
    const c = ctx();
    testbedContent.bind(c);

    testbedContent.goHome();
    testbedContent.goDashboard();
    testbedContent.goSearch();

    expect(c.navigateContent).toHaveBeenNthCalledWith(1, '');
    expect(c.navigateContent).toHaveBeenNthCalledWith(2, 'dashboard/overview');
    expect(c.navigateContent).toHaveBeenNthCalledWith(3, 'search');
  });

  it('opens the sandbox route as a preview tab', () => {
    const c = ctx();
    testbedContent.bind(c);
    testbedContent.goSandbox();
    expect(c.openContentTab).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'sandbox-rpc', preview: true }),
    );
  });

  it('unbind drops the context and clears the open set', () => {
    const c = ctx();
    testbedContent.bind(c);
    testbedContent.openEntry(ENTRIES[0]);
    testbedContent.unbind();

    expect(testbedContent.openEntryIds().size).toBe(0);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    testbedContent.goHome();
    expect(c.navigateContent).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
