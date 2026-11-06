import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaneTreeService } from './tree/pane-tree.service';
import { leafOf } from './tree/pane-node';
import { stripIdOf } from './drag/pane-move.service';
import { panelIdIn } from './chrome/strip-tab';
import { MAIN_CONTENT_ID, minimizedIdOf, PaneFocus } from './pane-focus';

const SIDE = { dock: 'content', paneId: 'p2' };
const ADDRESS = { dock: 'content', paneId: 'main' };

describe('PaneFocus', () => {
  let held: string[];
  let focus: PaneFocus;

  beforeEach(() => {
    held = ['main', 'p2'];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PaneTreeService,
          useValue: {
            tree: () => ({
              kind: 'split',
              id: 's',
              orientation: 'row',
              ratio: 0.5,
              first: leafOf(held[0] ?? 'gone', 'a'),
              second: leafOf(held[1] ?? 'gone', 'b'),
            }),
            primaryId: () => 'main',
            carriesAddress: (pane: { paneId: string }) =>
              pane.paneId === 'main',
            sourceOf: (path: string) => (path === 'doc/b' ? SIDE : null),
          },
        },
      ],
    });
    focus = TestBed.inject(PaneFocus);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  function strip(pane: { dock: string; paneId: string }, ...tabs: string[]) {
    const list = document.createElement('div');
    list.id = stripIdOf(pane);
    list.setAttribute('role', 'tablist');
    for (const [index, path] of tabs.entries()) {
      const tab = document.createElement('button');
      tab.setAttribute('role', 'tab');
      tab.dataset['tabPath'] = path;
      tab.setAttribute('aria-selected', String(index === tabs.length - 1));
      list.append(tab);
    }
    document.body.append(list);
    return list;
  }

  function element(id: string, tag = 'div'): HTMLElement {
    const made = document.createElement(tag);
    made.id = id;
    made.tabIndex = -1;
    document.body.append(made);
    return made;
  }

  function settle(): void {
    TestBed.inject(ApplicationRef).tick();
  }

  it('puts the focus on the selected tab of the pane once the pane has been drawn', () => {
    const list = strip(SIDE, 'doc/a', 'doc/b');

    focus.settleOn(SIDE);
    expect(document.activeElement).toBe(document.body);
    settle();

    expect(document.activeElement).toBe(list.lastElementChild);
  });

  it('puts the focus on the body of a pane whose strip is gone', () => {
    const body = element(panelIdIn(stripIdOf(SIDE)));

    focus.settleOn(SIDE);
    settle();

    expect(document.activeElement).toBe(body);
  });

  it('puts the focus on the body of the address pane by the id that pane carries', () => {
    const body = element(MAIN_CONTENT_ID);

    focus.settleOn(ADDRESS);
    settle();

    expect(document.activeElement).toBe(body);
  });

  it('puts the focus on the button of a pane that was minimised', () => {
    const button = element(minimizedIdOf(SIDE), 'button');

    focus.settleOn(SIDE);
    settle();

    expect(document.activeElement).toBe(button);
  });

  it('puts the focus on the pane that remains where the pane named is gone', () => {
    held = ['main'];
    const list = strip(ADDRESS, 'doc/a');

    focus.settleOn(SIDE);
    settle();

    expect(document.activeElement).toBe(list.firstElementChild);
  });

  it('follows a moved tab into the pane that now holds it, even where it is not yet the selected one', () => {
    strip(ADDRESS, 'doc/a');
    const list = strip(SIDE, 'doc/b', 'doc/c');

    focus.settleOnTab('doc/b', ADDRESS);
    settle();

    expect(document.activeElement).toBe(list.firstElementChild);
  });
});
