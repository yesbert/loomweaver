import { LayoutRegion, ShellLayout, provideLayout } from './layout';

function layoutWith(region: LayoutRegion): ShellLayout {
  return {
    regions: [{ id: 'main', type: 'content', dock: 'center' }, region],
  };
}

describe('a panel region declaring its own widths', () => {
  it('can be declared on a panel region, and only there', () => {
    const panel: LayoutRegion = {
      id: 'right-panel',
      type: 'panel',
      dock: 'right',
      width: 360,
      minWidth: 280,
      maxWidth: 640,
    };
    const bar: LayoutRegion = {
      id: 'top-bar',
      type: 'bar',
      dock: 'top',
      // @ts-expect-error a width is declarable on a panel region only
      width: 300,
    };

    expect(panel.type).toBe('panel');
    expect(bar.type).toBe('bar');
  });

  it('accepts a panel declaring some, all or none of its widths', () => {
    expect(() =>
      provideLayout(
        layoutWith({ id: 'p', type: 'panel', dock: 'left', width: 360, maxWidth: 640 }),
      ),
    ).not.toThrow();
    expect(() =>
      provideLayout(layoutWith({ id: 'p', type: 'panel', dock: 'left' })),
    ).not.toThrow();
  });

  it('refuses a narrowest width above the widest, naming the region', () => {
    expect(() =>
      provideLayout(
        layoutWith({
          id: 'right-panel',
          type: 'panel',
          dock: 'right',
          minWidth: 500,
          maxWidth: 400,
        }),
      ),
    ).toThrow(/right-panel/);
  });

  it('refuses a start width outside its own bounds once the workbench values are filled in', () => {
    expect(() =>
      provideLayout(
        layoutWith({ id: 'wide', type: 'panel', dock: 'right', width: 700 }),
      ),
    ).toThrow(/wide/);
    expect(() =>
      provideLayout(
        layoutWith({ id: 'narrow', type: 'panel', dock: 'left', minWidth: 500 }),
      ),
    ).toThrow(/narrow/);
  });
});
