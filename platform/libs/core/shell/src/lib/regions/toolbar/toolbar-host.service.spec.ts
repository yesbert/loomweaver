import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot, MenuContext, TOOLBAR_CONTEXT } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { ToolbarRegistry } from '../../contributions/toolbar-registry';
import { defineLwIcon } from '../../elements/icon/lw-icon.element';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
} from '../../elements/menu/lw-menu.element';
import {
  defineLwToolbar,
  LW_TOOLBAR_TAG,
  LwToolbarElement,
} from '../../elements/toolbar/lw-toolbar.element';
import { defineLwTooltip } from '../../elements/tooltip/lw-tooltip.element';
import { MenuService } from '../../menu/menu.service';
import { ToolbarHost } from './toolbar-host.service';

@Component({
  selector: 'lw-filter-cell',
  template: '<input aria-label="Filter" class="lw-field" /> {{ where }}',
})
class FilterCell {
  protected readonly where = JSON.stringify(inject(TOOLBAR_CONTEXT));
}

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        bar: { more: 'More' },
        records: { toolbar: 'Record tools', share: 'Share', star: 'Star', sources: 'Sources' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('ToolbarHost', () => {
  const SLOT = 'acme.records/toolbar';
  const session = signal<AuthSnapshot>(ANONYMOUS);
  let registry: ContributionRegistry;
  let toolbars: ToolbarRegistry;
  let ran: MenuContext[];

  beforeAll(() => {
    defineLwIcon();
    defineLwTooltip();
    defineLwMenu();
    defineLwToolbar();
  });

  beforeEach(() => {
    ran = [];
    session.set(ANONYMOUS);
    TestBed.configureTestingModule({
      imports: [transloco()],
      providers: [{ provide: AUTH_SOURCE, useValue: session }],
    });
    registry = TestBed.inject(ContributionRegistry);
    toolbars = TestBed.inject(ToolbarRegistry);
    TestBed.inject(ToolbarHost);
    toolbars.addToolbar({ slot: SLOT, title: 'records.toolbar' }, 'acme');
    registry.addCommand({
      id: 'scanner.share',
      title: 'records.share',
      icon: 'share',
      shortcut: 'mod+s',
      run: (context) => {
        ran.push(context ?? {});
      },
    });
  });

  afterEach(() => {
    TestBed.inject(MenuService).close();
    document.body.replaceChildren();
  });

  function place(context: MenuContext, attributes: Record<string, string> = {}): LwToolbarElement {
    const toolbar = document.createElement(LW_TOOLBAR_TAG) as LwToolbarElement;
    toolbar.setAttribute('menu', SLOT);
    for (const [name, value] of Object.entries(attributes)) {
      toolbar.setAttribute(name, value);
    }
    toolbar.context = context;
    document.body.append(toolbar);
    TestBed.tick();
    return toolbar;
  }

  function labels(toolbar: LwToolbarElement): string[] {
    TestBed.tick();
    return [...toolbar.querySelectorAll('button[data-lw-entry]')].map(
      (button) => button.getAttribute('aria-label') ?? '',
    );
  }

  it('draws what another plugin contributed, worded, with the command’s icon and shortcut, and runs it with the placement', () => {
    registry.addMenuItem({ menu: SLOT, command: 'scanner.share' }, 'scanner');
    const toolbar = place({ record: 'r1' });

    expect(labels(toolbar)).toEqual(['Share']);
    expect(toolbar.getAttribute('aria-label')).toBe('Record tools');
    const button = toolbar.querySelector<HTMLButtonElement>('button[data-lw-entry]') as HTMLButtonElement;
    expect(button.querySelector('lw-icon')?.getAttribute('name')).toBe('share');
    expect(button.querySelector('lw-tooltip')?.getAttribute('text')).toMatch(/^Share \(.+S\)$/);

    button.click();
    expect(ran).toEqual([{ record: 'r1', id: `${SLOT}#scanner.share` }]);
  });

  it('matches each placement against its own description', () => {
    registry.addMenuItem({ menu: SLOT, command: 'scanner.share', when: { kind: 'note' } }, 'scanner');
    const note = place({ record: 'r1', kind: 'note' });
    const task = place({ record: 'r2', kind: 'task' });

    expect(labels(note)).toEqual(['Share']);
    expect(labels(task)).toEqual([]);
    expect(task.hasAttribute('hidden')).toBe(true);
  });

  it('follows the session and the entries without a reload', () => {
    registry.addCommand({
      id: 'scanner.star',
      title: 'records.star',
      access: { authenticated: true },
      run: () => undefined,
    });
    const entry = registry.addMenuItem({ menu: SLOT, command: 'scanner.star' }, 'scanner');
    const toolbar = place({ record: 'r1' });
    expect(labels(toolbar)).toEqual([]);

    session.set({ authenticated: true, roles: [], claims: {} });
    expect(labels(toolbar)).toEqual(['Star']);

    entry.dispose();
    expect(labels(toolbar)).toEqual([]);
  });

  it('opens an entry’s nested menu beside it, headed, and announces the open state', () => {
    registry.addMenuItem({ menu: `${SLOT}/sources`, command: 'scanner.share' }, 'scanner');
    registry.addMenuItem(
      {
        id: 'acme.sources',
        menu: SLOT,
        title: 'records.sources',
        icon: 'more',
        submenu: `${SLOT}/sources`,
        menuHeader: { title: 'records.sources' },
      },
      'acme',
    );
    const toolbar = place({ record: 'r1' });
    const button = toolbar.querySelector<HTMLButtonElement>('button[data-lw-entry="acme.sources"]') as HTMLButtonElement;
    expect(button.getAttribute('aria-haspopup')).toBe('menu');

    button.click();
    TestBed.tick();

    const menu = document.body.querySelector(LW_MENU_TAG);
    expect(menu).not.toBeNull();
    expect([...(menu?.querySelectorAll(LW_MENU_ITEM_TAG) ?? [])].map((item) => item.getAttribute('command'))).toEqual(['scanner.share']);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('is not drawn while a menu-only entry’s slot offers nothing', () => {
    registry.addMenuItem({ id: 'acme.sources', menu: SLOT, title: 'records.sources', submenu: `${SLOT}/sources` }, 'acme');
    const toolbar = place({ record: 'r1' });
    expect(labels(toolbar)).toEqual([]);

    registry.addMenuItem({ menu: `${SLOT}/sources`, command: 'scanner.share' }, 'scanner');
    expect(labels(toolbar)).toEqual(['Sources']);
  });

  it('mounts another plugin’s cell, told the slot and the placement, hidden while its requirement is unmet', () => {
    toolbars.addCell({ id: 'scanner.filter', slot: SLOT, component: FilterCell, order: 1, access: { authenticated: true } });
    const toolbar = place({ record: 'r1' });
    expect(toolbar.querySelector('lw-filter-cell')).toBeNull();

    session.set({ authenticated: true, roles: [], claims: {} });
    TestBed.tick();
    const cell = toolbar.querySelector('lw-filter-cell') as HTMLElement;
    expect(cell).not.toBeNull();
    expect(cell.getAttribute('order')).toBe('1');
    expect(cell.textContent).toContain('"record":"r1"');
    expect(cell.textContent).toContain(`"slot":"${SLOT}"`);
    expect(toolbar.hasAttribute('hidden')).toBe(false);
  });

  it('takes the placement’s own label over the registered title', () => {
    registry.addMenuItem({ menu: SLOT, command: 'scanner.share' }, 'scanner');
    const toolbar = place({ record: 'r1' }, { label: 'records.share' });

    expect(labels(toolbar)).toEqual(['Share']);
    expect(toolbar.getAttribute('aria-label')).toBe('Share');
  });
});
