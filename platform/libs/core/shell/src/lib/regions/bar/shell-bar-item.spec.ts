import { Component, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ShellBarItem } from './shell-bar-item';
import { BarItem } from '../../foundation/bar-item';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { formatChord } from '../../commands/format-chord';
import { defineLwTooltip } from '../../elements/tooltip/lw-tooltip.element';
import { MenuService } from '../../menu/menu.service';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
} from '../../elements/menu/lw-menu.element';

@Component({ selector: 'lw-dummy', template: 'dummy' })
class Dummy {}

beforeAll(() => defineLwTooltip());

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { status: { add: 'Add item' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render(item: BarItem) {
  TestBed.configureTestingModule({
    imports: [ShellBarItem, transloco()],
    providers: [],
  });
  const fixture = TestBed.createComponent(ShellBarItem);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('dock', 'bottom');
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ShellBarItem', () => {
  it('renders a declarative button that runs its command and shows a tooltip', () => {
    let ran = 0;
    const host = render({
      id: 'a',
      bar: 'status-bar',
      slot: 'start',
      icon: 'add',
      tooltip: 'status.add',
      run: () => (ran += 1),
    });

    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Add item');
    expect(host.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe(
      'Add item',
    );

    button.click();
    expect(ran).toBe(1);
  });

  it('renders the bound command shortcut hint when showShortcut is set (LWF-04)', () => {
    TestBed.configureTestingModule({ imports: [ShellBarItem, transloco()] });
    TestBed.inject(ContributionRegistry).addCommand({
      id: 'testbed.act',
      title: 'status.add',
      shortcut: 'mod+enter',
      run: () => undefined,
    });
    const fixture = TestBed.createComponent(ShellBarItem);
    fixture.componentRef.setInput('item', {
      id: 'a',
      bar: 'status-bar',
      slot: 'start',
      icon: 'add',
      tooltip: 'status.add',
      command: 'testbed.act',
      showShortcut: true,
    } satisfies BarItem);
    fixture.componentRef.setInput('dock', 'bottom');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('kbd')?.textContent?.trim()).toBe(
      formatChord('mod+enter'),
    );
  });

  it('omits the shortcut hint when the command has none', () => {
    TestBed.configureTestingModule({ imports: [ShellBarItem, transloco()] });
    TestBed.inject(ContributionRegistry).addCommand({
      id: 'testbed.plain',
      title: 'status.add',
      run: () => undefined,
    });
    const fixture = TestBed.createComponent(ShellBarItem);
    fixture.componentRef.setInput('item', {
      id: 'a',
      bar: 'status-bar',
      slot: 'start',
      icon: 'add',
      tooltip: 'status.add',
      command: 'testbed.plain',
      showShortcut: true,
    } satisfies BarItem);
    fixture.componentRef.setInput('dock', 'bottom');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('kbd'),
    ).toBeNull();
  });

  it('renders a component item via ngComponentOutlet', () => {
    const host = render({
      id: 'b',
      bar: 'top-bar',
      slot: 'start',
      component: Dummy,
    });

    expect(host.textContent).toContain('dummy');
    expect(host.querySelector('button')).toBeNull();
  });

  it('disables a button whose access is unmet in disable mode, enabling it when met', () => {
    let ran = 0;
    const auth: WritableSignal<AuthSnapshot> = signal(ANONYMOUS);
    TestBed.configureTestingModule({
      imports: [ShellBarItem, transloco()],
      providers: [{ provide: AUTH_SOURCE, useValue: auth }],
    });
    const fixture = TestBed.createComponent(ShellBarItem);
    fixture.componentRef.setInput('item', {
      id: 'a',
      bar: 'status-bar',
      slot: 'start',
      icon: 'add',
      tooltip: 'status.add',
      access: { authenticated: true, mode: 'disable' },
      run: () => (ran += 1),
    } satisfies BarItem);
    fixture.componentRef.setInput('dock', 'bottom');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    button.click();
    expect(ran).toBe(0);

    auth.set({ authenticated: true, roles: [], claims: {} });
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    button.click();
    expect(ran).toBe(1);
  });
  describe('a menu opened by activating the button', () => {
    beforeAll(() => defineLwMenu());
    afterEach(() => document.body.querySelector(LW_MENU_TAG)?.remove());

    function renderWithMenu(item: BarItem) {
      TestBed.configureTestingModule({
        imports: [ShellBarItem, transloco()],
      });
      const registry = TestBed.inject(ContributionRegistry);
      registry.addCommand({
        id: 'c.profile',
        title: 'status.add',
        run: () => undefined,
      });
      registry.addMenuItem({ menu: 'acme/overflow', command: 'c.profile' });
      const fixture = TestBed.createComponent(ShellBarItem);
      fixture.componentRef.setInput('item', item);
      fixture.componentRef.setInput('dock', 'top');
      fixture.detectChanges();
      return fixture;
    }

    function offered(): string[] {
      return [
        ...(document.body
          .querySelector(LW_MENU_TAG)
          ?.querySelectorAll(LW_MENU_ITEM_TAG) ?? []),
      ].map((entry) => entry.getAttribute('command') ?? '');
    }

    it('opens the menu instead of running the action the button also names', () => {
      let ran = 0;
      const fixture = renderWithMenu({
        id: 'overflow',
        bar: 'top-bar',
        slot: 'end',
        icon: 'add',
        tooltip: 'status.add',
        menu: 'acme/overflow',
        menuTrigger: 'primary',
        run: () => (ran += 1),
      });
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(button.getAttribute('aria-haspopup')).toBe('menu');

      button.click();
      fixture.detectChanges();

      expect(offered()).toEqual(['c.profile']);
      expect(ran).toBe(0);
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('opens beside the bar rather than over it, whichever edge the bar sits on', () => {
      const open = vi.fn();
      TestBed.configureTestingModule({
        imports: [ShellBarItem, transloco()],
        providers: [
          {
            provide: MenuService,
            useValue: { open, openTrigger: signal(null) },
          },
        ],
      });
      const item: BarItem = {
        id: 'account',
        bar: 'left-footer',
        slot: 'end',
        icon: 'add',
        tooltip: 'status.add',
        menu: 'acme/account',
        menuTrigger: 'primary',
      };
      const sideFor = (dock: 'top' | 'bottom' | 'left' | 'right') => {
        const fixture = TestBed.createComponent(ShellBarItem);
        fixture.componentRef.setInput('item', item);
        fixture.componentRef.setInput('dock', dock);
        fixture.detectChanges();
        (fixture.nativeElement as HTMLElement)
          .querySelector('button')
          ?.click();
        return open.mock.lastCall?.[2].side;
      };

      expect(sideFor('bottom')).toBe('top');
      expect(sideFor('top')).toBe('bottom');
      expect(sideFor('left')).toBe('right');
      expect(sideFor('right')).toBe('left');
    });

    it('keeps a button that declares no gesture on the right-click', () => {
      let ran = 0;
      const fixture = renderWithMenu({
        id: 'overflow',
        bar: 'top-bar',
        slot: 'end',
        icon: 'add',
        tooltip: 'status.add',
        menu: 'acme/overflow',
        run: () => (ran += 1),
      });
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      ) as HTMLButtonElement;

      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-haspopup')).toBeNull();
      expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
      expect(ran).toBe(1);
    });
  });
});
