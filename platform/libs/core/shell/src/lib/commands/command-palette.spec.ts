import {
  EnvironmentProviders,
  Provider,
  WritableSignal,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { CommandPalette, PALETTE_COMMAND_ID } from './command-palette';
import { CommandService } from './command.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { AUTH_SOURCE } from '../auth/auth-context';
import { DialogRef } from '../dialog/dialog-ref';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { QuickOpenTarget } from '../regions/content/tabs/quick-open-target';
import { MenuService } from '../menu/menu.service';
import { provideShellFeatures } from '../foundation/shell-features';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        cmd: {
          add: 'Add item',
          reset: 'Reset list',
          open: 'Open file',
          secret: 'Secret',
        },
        palette: {
          title: 'Command palette',
          placeholder: 'Type…',
          tabsPlaceholder: 'Go to open tab…',
          empty: 'No matching commands',
          tabsEmpty: 'No open tabs',
          quickOpenTitle: 'Go to open tab…',
          recent: 'Recently used',
          all: 'All commands',
          hint: {
            navigate: 'Select',
            run: 'Run',
            close: 'Close',
            toTabs: 'Tabs',
            toCommands: 'Commands',
            actions: 'Actions',
          },
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render(
  tabs: readonly QuickOpenTarget[] = [],
  mode: 'commands' | 'tabs' = 'commands',
  extra: (Provider | EnvironmentProviders)[] = [],
) {
  const ref = new DialogRef(mode === 'tabs' ? { mode } : undefined);
  vi.spyOn(ref, 'close');
  const contentTabs = {
    quickOpenTargets: signal<readonly QuickOpenTarget[]>(tabs),
    revealContentTab: vi.fn(),
  };
  const menu = { open: vi.fn() };
  TestBed.configureTestingModule({
    imports: [CommandPalette, transloco()],
    providers: [
      { provide: DialogRef, useValue: ref },
      { provide: ContentTabsService, useValue: contentTabs },
      { provide: MenuService, useValue: menu },
      ...extra,
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  const commands = TestBed.inject(CommandService);
  const execute = vi
    .spyOn(commands, 'execute')
    .mockImplementation(() => undefined);
  registry.addCommand({ id: 'do.add', title: 'cmd.add', run: () => undefined });
  registry.addCommand({
    id: 'do.reset',
    title: 'cmd.reset',
    run: () => undefined,
  });
  registry.addCommand({
    id: 'do.open',
    title: 'cmd.open',
    run: () => undefined,
  });
  const fixture = TestBed.createComponent(CommandPalette);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return { fixture, host, registry, ref, execute, contentTabs, menu };
}

function options(host: HTMLElement): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>('li[role="option"]')];
}

function type(fixture: ReturnType<typeof render>['fixture'], value: string) {
  const input = (fixture.nativeElement as HTMLElement).querySelector(
    'input',
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function key(fixture: ReturnType<typeof render>['fixture'], name: string) {
  const input = (fixture.nativeElement as HTMLElement).querySelector(
    'input',
  ) as HTMLInputElement;
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true }),
  );
  fixture.detectChanges();
}

describe('CommandPalette', () => {
  afterEach(() => localStorage.clear());

  it('lists every registered command by its translated label', () => {
    const { host } = render();
    const labels = options(host).map((li) => li.textContent?.trim());

    expect(labels).toEqual(['Add item', 'Reset list', 'Open file']);
  });

  it('excludes its own open command from the list', () => {
    const { host, registry, fixture } = render();
    registry.addCommand({
      id: PALETTE_COMMAND_ID,
      title: 'palette.title',
      run: () => undefined,
    });
    fixture.detectChanges();

    expect(
      options(host).some((li) => li.textContent?.includes('Command palette')),
    ).toBe(false);
  });

  it('excludes a paletteHidden command (context-only tab/view op)', () => {
    const { host, registry, fixture } = render();
    registry.addCommand({
      id: 'shell.tab.close',
      title: 'Close tab (context only)',
      paletteHidden: true,
      run: () => undefined,
    });
    fixture.detectChanges();

    const labels = options(host).map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Add item', 'Reset list', 'Open file']);
    expect(labels).not.toContain('Close tab (context only)');
  });

  it('filters by the translated label as the user types', () => {
    const { host, fixture } = render();

    type(fixture, 'reset');

    const labels = options(host).map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Reset list']);
  });

  it('shows the empty state when nothing matches', () => {
    const { host, fixture } = render();

    type(fixture, 'zzz');

    expect(host.textContent).toContain('No matching commands');
    expect(options(host)).toHaveLength(0);
  });

  it('moves the highlight with the arrow keys, wrapping around', () => {
    const { host, fixture } = render();
    expect(options(host)[0].getAttribute('aria-selected')).toBe('true');

    key(fixture, 'ArrowDown');
    expect(options(host)[1].getAttribute('aria-selected')).toBe('true');

    key(fixture, 'ArrowUp');
    key(fixture, 'ArrowUp');
    expect(options(host)[2].getAttribute('aria-selected')).toBe('true');
  });

  it('runs the highlighted command on Enter and closes', () => {
    const { fixture, ref, execute } = render();

    key(fixture, 'ArrowDown');
    key(fixture, 'Enter');

    expect(execute).toHaveBeenCalledWith('do.reset');
    expect(ref.close).toHaveBeenCalled();
  });

  it('runs a command on click and closes', () => {
    const { host, ref, execute } = render();

    options(host)[2].click();

    expect(execute).toHaveBeenCalledWith('do.open');
    expect(ref.close).toHaveBeenCalled();
  });

  it('omits a command the session may not run and reveals it once it qualifies', () => {
    const auth: WritableSignal<AuthSnapshot> = signal(ANONYMOUS);
    TestBed.configureTestingModule({
      imports: [CommandPalette, transloco()],
      providers: [
        { provide: DialogRef, useValue: new DialogRef() },
        { provide: AUTH_SOURCE, useValue: auth },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand({
      id: 'do.add',
      title: 'cmd.add',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'secret',
      title: 'cmd.secret',
      access: { anyRole: ['admin'] },
      run: () => undefined,
    });
    const fixture = TestBed.createComponent(CommandPalette);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const labels = () => options(host).map((li) => li.textContent?.trim());

    expect(labels()).toEqual(['Add item']);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    fixture.detectChanges();
    expect(labels()).toEqual(['Add item', 'Secret']);
  });

  it('matches a subsequence, not only a substring (fuzzy)', () => {
    const { host, fixture } = render();

    type(fixture, 'rst');

    const labels = options(host).map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Reset list']);
  });

  it('a run command leads the next open under a "Recently used" section', () => {
    const first = render();
    options(first.host)[1].click();
    first.fixture.detectChanges();

    TestBed.resetTestingModule();
    const { host } = render();
    const labels = options(host).map((li) => li.textContent?.trim());

    expect(labels).toEqual(['Reset list', 'Add item', 'Open file']);
    expect(
      host.querySelector('[data-testid="palette-section-recent"]')?.textContent,
    ).toContain('Recently used');
    expect(
      host.querySelector('[data-testid="palette-section-all"]')?.textContent,
    ).toContain('All commands');
  });

  it('keeps no history where the distribution switched "recently used" off (K1d)', () => {
    const off = [provideShellFeatures({ commands: { recentlyUsed: false } })];
    const first = render([], 'commands', off);
    options(first.host)[1].click();
    first.fixture.detectChanges();

    TestBed.resetTestingModule();
    const { host } = render([], 'commands', off);
    const labels = options(host).map((li) => li.textContent?.trim());

    expect(labels).toEqual(['Add item', 'Reset list', 'Open file']);
    expect(
      host.querySelector('[data-testid="palette-section-recent"]'),
    ).toBeNull();
    expect(localStorage.getItem('lw.shell.command-mru')).toBeNull();
  });

  it('shows no section headers while nothing was used yet', () => {
    const { host } = render();

    expect(host.querySelector('[data-testid="palette-section-recent"]')).toBeNull();
    expect(host.querySelector('[data-testid="palette-section-all"]')).toBeNull();
  });

  it('clamps the highlight when the list shrinks without a query change (live access loss)', () => {
    const auth: WritableSignal<AuthSnapshot> = signal({
      authenticated: true,
      roles: ['admin'],
      claims: {},
    });
    TestBed.configureTestingModule({
      imports: [CommandPalette, transloco()],
      providers: [
        { provide: DialogRef, useValue: new DialogRef() },
        { provide: AUTH_SOURCE, useValue: auth },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand({
      id: 'do.add',
      title: 'cmd.add',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'secret',
      title: 'cmd.secret',
      access: { anyRole: ['admin'] },
      run: () => undefined,
    });
    const fixture = TestBed.createComponent(CommandPalette);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;

    key(fixture, 'ArrowDown');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      'lw-palette-option-1',
    );

    auth.set(ANONYMOUS);
    fixture.detectChanges();

    expect(input.getAttribute('aria-activedescendant')).toBe(
      'lw-palette-option-0',
    );
    expect(options(host)[0].getAttribute('aria-selected')).toBe('true');
  });

  it('re-translates its labels once a translation file arrives after open (boot race)', () => {
    const { host, registry, fixture } = render();
    registry.addCommand({
      id: 'do.late',
      title: 'cmd.late',
      run: () => undefined,
    });
    fixture.detectChanges();
    const labels = () => options(host).map((li) => li.textContent?.trim());
    expect(labels()).toContain('cmd.late');

    const transloco = TestBed.inject(TranslocoService);
    transloco.setTranslation({ cmd: { late: 'Late command' } }, 'en');
    fixture.detectChanges();

    expect(labels()).toContain('Late command');
    expect(labels()).not.toContain('cmd.late');
  });

  it('renders the keyboard hint footer', () => {
    const { host } = render();
    const footer = host.querySelector('[data-testid="palette-footer"]');

    expect(footer?.textContent).toContain('Select');
    expect(footer?.textContent).toContain('Run');
    expect(footer?.textContent).toContain('Close');
  });

  it('keeps the keyboard highlight in view but never scrolls on hover', () => {
    const scrolled = vi.fn();
    Element.prototype.scrollIntoView = scrolled;
    const { host, fixture } = render();

    key(fixture, 'ArrowDown');
    expect(scrolled).toHaveBeenCalledWith({ block: 'nearest' });

    scrolled.mockClear();
    options(host)[2].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(scrolled).not.toHaveBeenCalled();
  });

  it('resets the list scroll when the query changes', () => {
    const { host, fixture } = render();
    const list = host.querySelector('#lw-palette-list') as HTMLElement;
    list.scrollTop = 40;

    type(fixture, 'o');

    expect(list.scrollTop).toBe(0);
  });

  const OPEN_TABS: readonly QuickOpenTarget[] = [
    {
      path: 'doc/one',
      navPath: 'doc/one',
      title: 'Older note',
      literalTitle: true,
      pinned: false,
      closable: true,
      lastActive: 1000,
    },
    {
      path: 'doc/two',
      navPath: 'doc/two/preview',
      title: 'Newer note',
      literalTitle: true,
      pinned: false,
      closable: true,
      lastActive: 5000,
    },
    {
      path: 'dashboard/overview',
      navPath: 'dashboard/overview',
      title: 'Overview',
      literalTitle: true,
      pinned: false,
      closable: false,
    },
  ];

  it('opens in Quick-Open mode from dialog data, listing targets most recent first (static last)', () => {
    const { host } = render(OPEN_TABS, 'tabs');

    expect(
      options(host).map((li) => li.querySelector('span')?.textContent?.trim()),
    ).toEqual(['Newer note', 'Older note', 'Overview']);
  });

  it('lists only commands (no tabs) in command mode', () => {
    const { host } = render(OPEN_TABS);

    expect(options(host).map((li) => li.textContent?.trim())).toEqual([
      'Add item',
      'Reset list',
      'Open file',
    ]);
  });

  it('reveals the tab where it lives (its full nav path) on Enter, without recording command MRU', () => {
    const { fixture, contentTabs, execute } = render(OPEN_TABS, 'tabs');

    key(fixture, 'Enter');

    expect(contentTabs.revealContentTab).toHaveBeenCalledWith('doc/two/preview');
    expect(execute).not.toHaveBeenCalled();
  });

  it('fuzzy-filters targets by title', () => {
    const { host, fixture } = render(OPEN_TABS, 'tabs');

    type(fixture, 'over');

    expect(
      options(host).map((li) => li.querySelector('span')?.textContent?.trim()),
    ).toEqual(['Overview']);
  });

  it('opens the tab context menu at the active row on ArrowRight (carrying closable), then closes', () => {
    const { fixture, menu, ref } = render(OPEN_TABS, 'tabs');

    key(fixture, 'ArrowRight');

    expect(ref.close).toHaveBeenCalled();
    expect(menu.open).toHaveBeenCalledWith(
      'content/tab/context',
      expect.objectContaining({ tabId: 'doc/two/preview', closable: true }),
      expect.anything(),
    );
  });

  it('hides the Actions hint in command mode', () => {
    const { host } = render(OPEN_TABS);
    expect(
      host.querySelector('[data-testid="palette-hint-actions"]'),
    ).toBeNull();
  });

  it('shows the Actions hint in Quick-Open mode', () => {
    const { host } = render(OPEN_TABS, 'tabs');
    expect(
      host.querySelector('[data-testid="palette-hint-actions"]'),
    ).not.toBeNull();
  });

  it('names the field for searching commands in command mode', () => {
    const { host } = render(OPEN_TABS);
    const input = host.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBe('Command palette');
  });

  it('names the field for searching open work in Quick-Open mode', () => {
    const { host } = render(OPEN_TABS, 'tabs');
    const input = host.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBe('Go to open tab…');
  });

  it('keeps the Quick-Open name once typing has removed the placeholder', () => {
    const { host, fixture } = render(OPEN_TABS, 'tabs');
    type(fixture, 'two');
    const input = host.querySelector('input') as HTMLInputElement;

    expect(input.value).not.toBe('');
    expect(input.hasAttribute('aria-label')).toBe(true);
    expect(input.getAttribute('aria-label')).toBe('Go to open tab…');
  });

  it('names the command search from its own label, not from its placeholder', () => {
    const { host, fixture } = render(OPEN_TABS);
    type(fixture, 'reset');
    const input = host.querySelector('input') as HTMLInputElement;

    expect(input.value).not.toBe('');
    expect(input.placeholder).toBe('Type…');
    expect(input.getAttribute('aria-label')).toBe('Command palette');
  });
});
