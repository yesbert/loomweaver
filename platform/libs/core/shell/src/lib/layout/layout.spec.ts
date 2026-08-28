import {
  DEFAULT_LAYOUT,
  SHELL_LAYOUT,
  ShellLayout,
  provideLayout,
} from './layout';
import { DEFAULT_BAR_ITEMS } from '../regions/bar/default-bar-items';

describe('layout', () => {
  it('defaults to a top bar over the content area, with a status bar under it', () => {
    expect(DEFAULT_LAYOUT.regions.map((r) => [r.dock, r.type])).toEqual([
      ['top', 'bar'],
      ['center', 'content'],
      ['bottom', 'bar'],
    ]);
  });

  it('declares every region a shell default bar item docks into, because one aimed at a missing region renders nothing and reports nothing — which is how the bare shell once shipped without its version display', () => {
    const declared = DEFAULT_LAYOUT.regions.map((region) => region.id);

    for (const item of DEFAULT_BAR_ITEMS) {
      expect(declared).toContain(item.bar);
    }
  });

  it('lets a distribution override the layout', () => {
    const custom: ShellLayout = {
      regions: [{ id: 'main', type: 'content', dock: 'center' }],
    };

    expect(provideLayout(custom)).toEqual({
      provide: SHELL_LAYOUT,
      useValue: custom,
    });
  });
});
