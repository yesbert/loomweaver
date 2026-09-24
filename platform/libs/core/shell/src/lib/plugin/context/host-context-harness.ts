import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot, Capability } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { CommandInvocationService } from '../../commands/command-invocation.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { DialogService } from '../../dialog/dialog.service';
import { IconRegistry } from '../../elements/icon/icon-registry';
import { COMMAND_INVOKER } from '../../foundation/command-invoker';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { MenuService } from '../../menu/menu.service';
import { NotificationService } from '../../notifications/notification.service';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { SettingsService } from '../../settings/settings.service';
import { ThemeRegistry } from '../../theme/theme-registry';
import { UpdateService } from '../../update/update.service';
import { VersionService } from '../../version/version.service';
import { HostContextFactory } from './host-context-factory';

export class DummyComponent {}

export const ALL: Capability[] = [
  'contributions',
  'ui',
  'host',
  'navigation',
  'session',
  'theme',
  'automation',
];

export const REGIONS: readonly LayoutRegion[] = [
  { id: 'primary', type: 'panel', dock: 'left' },
  { id: 'main', type: 'content', dock: 'center' },
];

const PLUGIN_STRINGS = {
  en: { 'test-plugin': { menu: { open: 'Open' } } },
  de: { 'test-plugin': { menu: { open: 'Öffnen' } } },
};

const DRAWN_MENUS = TranslocoTestingModule.forRoot({
  langs: PLUGIN_STRINGS,
  translocoConfig: { availableLangs: ['en', 'de'], defaultLang: 'en' },
  preloadLangs: true,
});

export function makeContext(
  granted: Capability[] = ALL,
  regions: readonly LayoutRegion[] = REGIONS,
  auth: WritableSignal<AuthSnapshot> = signal(ANONYMOUS),
  menus: 'stubbed' | 'drawn' = 'stubbed',
) {
  const shown = signal<{ path: string } | null>(null);
  const tabs = {
    navigate: vi.fn(),
    open: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
    activeContent: () => shown(),
    hasUnsavedWork: () => true,
  } as unknown as ContentTabsService;
  TestBed.configureTestingModule({
    imports: menus === 'drawn' ? [DRAWN_MENUS] : [],
    providers: [
      { provide: AUTH_SOURCE, useValue: auth },
      { provide: SHELL_LAYOUT, useValue: { regions } },
      { provide: ContentTabsService, useValue: tabs },
      { provide: COMMAND_INVOKER, useExisting: CommandInvocationService },
      ...(menus === 'stubbed'
        ? [{ provide: MenuService, useValue: { openList: vi.fn() } }]
        : []),
    ],
  });
  const grants = new Set(granted);
  const ctx = TestBed.inject(HostContextFactory).create(
    'test-plugin',
    (capability) => grants.has(capability),
  );
  return {
    ctx,
    grants,
    shown,
    tabs,
    registry: TestBed.inject(ContributionRegistry),
    dialogs: TestBed.inject(DialogService),
    notifications: TestBed.inject(NotificationService),
    settings: TestBed.inject(SettingsService),
    version: TestBed.inject(VersionService),
    update: TestBed.inject(UpdateService),
    icons: TestBed.inject(IconRegistry),
    menu: TestBed.inject(MenuService),
    themes: TestBed.inject(ThemeRegistry),
  };
}
