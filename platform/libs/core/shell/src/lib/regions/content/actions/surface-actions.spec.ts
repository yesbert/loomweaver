import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot, ViewAction } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import {
  entryToContentRoute,
  surfaceToEntry,
} from '../../../contributions/surface-normalize';
import { defineLwIcon } from '../../../elements/icon/lw-icon.element';
import { defineLwToolbar } from '../../../elements/toolbar/lw-toolbar.element';
import { defineLwTooltip } from '../../../elements/tooltip/lw-tooltip.element';
import { ToolbarHost } from '../../toolbar/toolbar-host.service';
import { MenuService } from '../../../menu/menu.service';
import { PopoutWindow } from '../../../popout/popout-window';
import { viewPanePath } from '../../pane/tree/pane-address';
import { SurfaceActions } from './surface-actions';

@Component({ selector: 'lw-test-body', template: 'body' })
class Body {}

@Component({
  imports: [SurfaceActions],
  template: `<lw-surface-actions [path]="path()" region="content" inStrip />`,
})
class Host {
  readonly path = signal<string | undefined>('reports');
}

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        add: 'Add',
        sort: 'Sort',
        pin: 'Pin',
        reports: { title: 'Reports' },
        ledger: { title: 'Ledger' },
      },
      de: {
        add: 'Hinzufügen',
        reports: { title: 'Berichte' },
        ledger: { title: 'Kassenbuch' },
      },
    },
    translocoConfig: {
      availableLangs: ['en', 'de'],
      defaultLang: 'en',
      reRenderOnLangChange: true,
    },
    preloadLangs: true,
  });
}

describe('SurfaceActions', () => {
  let fixture: ComponentFixture<Host>;
  let registry: ContributionRegistry;
  let ran: string[];
  const session = signal<AuthSnapshot>(ANONYMOUS);

  beforeAll(() => {
    defineLwIcon();
    defineLwTooltip();
    defineLwToolbar();
  });

  beforeEach(() => {
    ran = [];
    session.set(ANONYMOUS);
    TestBed.configureTestingModule({
      imports: [Host, transloco()],
      providers: [{ provide: AUTH_SOURCE, useValue: session }],
    });
    registry = TestBed.inject(ContributionRegistry);
    TestBed.inject(ToolbarHost);
  });

  function routable(actions: readonly ViewAction[], id = 'reports') {
    registry.addContentRoute(
      entryToContentRoute(
        surfaceToEntry({
          id,
          title: id,
          routable: { path: id },
          component: Body,
          actions,
        }),
      ),
    );
  }

  function render() {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.tick();
  }

  function labels(): string[] {
    fixture.detectChanges();
    TestBed.tick();
    return [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'button[data-lw-entry]',
      ),
    ].map((button) => button.getAttribute('aria-label') ?? '');
  }

  function button(id: string): HTMLButtonElement {
    fixture.detectChanges();
    TestBed.tick();
    return (fixture.nativeElement as HTMLElement).querySelector(
      `button[data-lw-entry="${CSS.escape(id)}"]`,
    ) as HTMLButtonElement;
  }

  const add: ViewAction = {
    id: 'add',
    icon: 'add',
    title: 'add',
    order: 2,
    run: () => {
      ran.push('add');
    },
  };
  const sort: ViewAction = {
    id: 'sort',
    icon: 'sort',
    title: 'sort',
    order: 1,
    run: () => {
      ran.push('sort');
    },
  };

  it("draws a routable surface's actions in their order and runs the one activated", () => {
    routable([add, sort]);
    render();

    expect(labels()).toEqual(['Sort', 'Add']);

    button('add').click();
    expect(ran).toEqual(['add']);
  });

  describe('the name of the toolbar', () => {
    const add: ViewAction = {
      id: 'add',
      title: 'add',
      icon: 'add',
      run: () => undefined,
    };

    function titled(title: string, titleIsLiteral?: boolean, id = 'reports') {
      registry.addContentRoute(
        entryToContentRoute(
          surfaceToEntry({
            id,
            title,
            routable: { path: id, title, titleIsLiteral },
            component: Body,
            actions: [add],
          }),
        ),
      );
    }

    function toolbarName(): string | null {
      fixture.detectChanges();
      TestBed.tick();
      return (
        (fixture.nativeElement as HTMLElement)
          .querySelector('lw-toolbar')
          ?.getAttribute('aria-label') ?? null
      );
    }

    it('is the surface title in words, not its key', () => {
      titled('reports.title');
      render();

      expect(toolbarName()).toBe('Reports');
    });

    it('is the title as written where the surface marks it literal', () => {
      titled('Quarterly figures', true);
      render();

      expect(toolbarName()).toBe('Quarterly figures');
    });

    it('follows the surface shown when it changes under a standing toolbar', () => {
      titled('reports.title');
      titled('ledger.title', false, 'ledger');
      render();
      expect(toolbarName()).toBe('Reports');

      fixture.componentInstance.path.set('ledger');

      expect(toolbarName()).toBe('Ledger');
    });

    it('follows a change of language', async () => {
      titled('reports.title');
      render();

      TestBed.inject(TranslocoService).setActiveLang('de');
      await fixture.whenStable();

      expect(toolbarName()).toBe('Berichte');
    });
  });

  it('draws the actions of a docked view shown under a pane path', () => {
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline',
      component: Body,
      actions: [sort],
    });
    render();
    fixture.componentInstance.path.set(viewPanePath('outline'));

    expect(labels()).toEqual(['Sort']);
  });

  it('changes with the surface shown, and draws nothing for one without actions', () => {
    routable([add]);
    routable([], 'plain');
    render();
    expect(labels()).toEqual(['Add']);

    fixture.componentInstance.path.set('plain');
    expect(labels()).toEqual([]);

    fixture.componentInstance.path.set(undefined);
    expect(labels()).toEqual([]);
  });

  it('follows an action replaced while the surface is shown, and one added later', () => {
    routable([{ ...add, pressed: false }]);
    render();
    expect(button('add').getAttribute('aria-pressed')).toBe('false');

    registry.updateSurfaceAction('reports', { ...add, pressed: true });
    expect(button('add').getAttribute('aria-pressed')).toBe('true');

    registry.updateSurfaceAction('reports', sort);
    expect(labels()).toEqual(['Sort', 'Add']);
  });

  it('announces a plain action without a pressed state', () => {
    routable([add]);
    render();

    expect(button('add').hasAttribute('aria-pressed')).toBe(false);
  });

  it('hides an action the session may not see and disables one it may see but not use', () => {
    routable([
      { ...add, access: { authenticated: true } },
      { ...sort, access: { authenticated: true, mode: 'disable' } },
    ]);
    render();

    expect(labels()).toEqual(['Sort']);
    button('sort').click();
    expect(ran).toEqual([]);
    expect(button('sort').disabled).toBe(true);
  });

  it('does not draw an action naming a command the session may not run until it may, with no requirement of its own', () => {
    registry.addCommand({
      id: 'reports.purge',
      title: 'add',
      access: { anyRole: ['admin'] },
      run: () => undefined,
    });
    routable([{ id: 'purge', icon: 'x', title: 'add', command: 'reports.purge' }]);
    render();
    expect(labels()).toEqual([]);

    session.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(labels()).toEqual(['Add']);
  });

  it('does not draw an action naming a command nothing registers', () => {
    routable([{ id: 'dead', icon: 'x', title: 'add', command: 'reports.missing' }, sort]);
    render();

    expect(labels()).toEqual(['Sort']);
  });

  describe('in a detached window', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host, transloco()],
        providers: [
          { provide: AUTH_SOURCE, useValue: session },
          { provide: PopoutWindow, useValue: { active: true } },
        ],
      });
      registry = TestBed.inject(ContributionRegistry);
      TestBed.inject(ToolbarHost);
      registry.addCommand({ id: 'c.main', title: 'add', run: () => undefined });
      registry.addCommand({
        id: 'c.popout',
        title: 'sort',
        popout: true,
        run: () => undefined,
      });
    });

    it('draws an action whose command belongs there and one with behaviour of its own, and no other', () => {
      routable([
        { id: 'main', icon: 'add', title: 'add', command: 'c.main' },
        { id: 'popout', icon: 'sort', title: 'sort', command: 'c.popout' },
        { id: 'inline', icon: 'pin', title: 'pin', run: () => undefined },
        { id: 'gone', icon: 'add', title: 'add', command: 'c.unregistered' },
      ]);
      render();

      expect(labels()).toEqual(['Sort', 'Pin']);
    });
  });

  describe('an action that names a menu', () => {
    const more: ViewAction = {
      id: 'more',
      icon: 'more',
      title: 'pin',
      menu: 'reports/more',
    };

    function fill() {
      return registry.addMenuItem({
        menu: 'reports/more',
        title: 'add',
        run: () => undefined,
      });
    }

    it('opens the slot against the action on a right-click', () => {
      routable([{ ...more, run: () => undefined }]);
      fill();
      render();
      const open = vi
        .spyOn(TestBed.inject(MenuService), 'open')
        .mockImplementation(() => undefined);

      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 5,
        clientY: 7,
      });
      const notCancelled = button('more').dispatchEvent(event);

      expect(notCancelled).toBe(false);
      expect(open).toHaveBeenCalledWith(
        'reports/more',
        {
          targetKind: 'view-action',
          id: 'more',
          region: 'content',
          surface: 'reports',
        },
        { x: 5, y: 7 },
      );
    });

    it('opens the slot beside the action when activation is its gesture, and announces that it does', () => {
      routable([
        {
          ...more,
          menuTrigger: 'primary',
          run: () => {
            ran.push('more');
          },
        },
      ]);
      fill();
      render();
      const open = vi
        .spyOn(TestBed.inject(MenuService), 'open')
        .mockImplementation(() => undefined);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(button('more').getAttribute('aria-haspopup')).toBe('menu');
      button('more').click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open.mock.calls[0][0]).toBe('reports/more');
      expect(open.mock.calls[0][3]).toEqual({
        trigger: button('more'),
        header: undefined,
      });
      expect(ran).toEqual([]);
    });

    it('is not drawn while its menu offers nothing, appears with an entry and goes with it', () => {
      routable([{ ...more, menuTrigger: 'primary' }]);
      render();
      expect(labels()).toEqual([]);

      const entry = fill();
      expect(labels()).toEqual(['Pin']);

      entry.dispose();
      expect(labels()).toEqual([]);
    });

    it('is not drawn while the only entry names a command the session may not use, and appears once it may', () => {
      registry.addCommand({
        id: 'reports.share',
        title: 'add',
        access: { authenticated: true },
        run: () => undefined,
      });
      registry.addMenuItem({ menu: 'reports/more', command: 'reports.share' });
      routable([{ ...more, menuTrigger: 'primary' }]);
      render();
      expect(labels()).toEqual([]);

      session.set({ authenticated: true, roles: [], claims: {} });
      expect(labels()).toEqual(['Pin']);
    });

    it('runs its own command while its menu is empty, and opens the menu once it has an entry', () => {
      registry.addCommand({
        id: 'reports.add',
        title: 'add',
        run: () => {
          ran.push('own');
        },
      });
      routable([
        {
          ...more,
          menuTrigger: 'primary',
          command: 'reports.add',
          menuHeader: { title: 'add', command: 'reports.add' },
        },
      ]);
      render();
      const open = vi
        .spyOn(TestBed.inject(MenuService), 'open')
        .mockImplementation(() => undefined);

      expect(labels()).toEqual(['Pin']);
      expect(button('more').getAttribute('aria-haspopup')).toBeNull();
      button('more').click();
      expect(ran).toEqual(['own']);
      expect(open).not.toHaveBeenCalled();

      fill();
      expect(button('more').getAttribute('aria-haspopup')).toBe('menu');
      button('more').click();
      expect(ran).toEqual(['own']);
      expect(open).toHaveBeenCalledTimes(1);
    });

    it('stays drawn with an empty menu when the menu is only on its right-click', () => {
      routable([{ ...more, run: () => undefined }]);
      render();

      expect(labels()).toEqual(['Pin']);
    });
  });
});
