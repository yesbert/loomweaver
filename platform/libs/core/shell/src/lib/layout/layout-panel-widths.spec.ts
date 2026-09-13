import { LayoutRegion, ShellLayout, provideLayout } from './layout';
import { overlayWidthStyle } from './panel-widths';

describe('the width of a panel presented as an overlay', () => {
  it('is the workbench overlay width when the panel declares none, capped by the screen', () => {
    expect(overlayWidthStyle({})).toBe('min(288px, calc(100vw - 3rem))');
  });

  it('is the declared overlay width, capped by the screen', () => {
    expect(overlayWidthStyle({ overlayWidth: 400 })).toBe('min(400px, calc(100vw - 3rem))');
  });
});

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

  it('accepts a positive overlay width, whatever the widths beside the content', () => {
    expect(() =>
      provideLayout(
        layoutWith({
          id: 'p',
          type: 'panel',
          dock: 'right',
          width: 420,
          minWidth: 400,
          overlayWidth: 320,
        }),
      ),
    ).not.toThrow();
  });

  it.each([0, -1, NaN, Infinity])(
    'refuses an overlay width of %s, naming the region',
    (overlayWidth) => {
      expect(() =>
        provideLayout(
          layoutWith({ id: 'chat-panel', type: 'panel', dock: 'right', overlayWidth }),
        ),
      ).toThrow(/chat-panel/);
    },
  );

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
