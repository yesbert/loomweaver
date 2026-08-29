import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { MenuListEntry, MenuService } from '../../menu/menu.service';
import { PaneTargetPicker } from './pane-target-picker.service';

@Component({ selector: 'lw-test-target', template: '' })
class TestTarget {}

const PUBLIC: ContentRoute = {
  path: 'search',
  component: TestTarget,
  title: 'testbed.search.title',
  icon: 'search',
};

const GATED: ContentRoute = {
  path: 'secret',
  component: TestTarget,
  title: 'testbed.secret.title',
  access: { anyRole: ['admin'] },
};

describe('PaneTargetPicker', () => {
  let opened: {
    entries: readonly MenuListEntry[];
    onPick: (key: string) => void;
  } | null;

  function setup(admin: boolean): PaneTargetPicker {
    opened = null;
    const menu = {
      openList(
        entries: readonly MenuListEntry[],
        _at: unknown,
        onPick: (key: string) => void,
      ) {
        opened = { entries, onPick };
      },
    } as unknown as MenuService;

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: MenuService, useValue: menu },
        {
          provide: AUTH_SOURCE,
          useValue: signal(
            admin
              ? { authenticated: true, roles: ['admin'], claims: {} }
              : ANONYMOUS,
          ),
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute(PUBLIC);
    registry.addContentRoute(GATED);
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'testbed.outline.title',
      component: TestTarget,
    });
    registry.addView({
      id: 'audit',
      region: 'primary',
      title: 'testbed.audit.title',
      component: TestTarget,
      access: { anyRole: ['admin'] },
    });
    return TestBed.inject(PaneTargetPicker);
  }

  it('offers gated routes to the navigation picker once the session qualifies', () => {
    const picker = setup(true);
    const picks: string[] = [];
    picker.openForNavigation(document.createElement('button'), (p) =>
      void picks.push(p),
    );

    expect(opened).not.toBeNull();
    expect(opened?.entries.map((e) => e.key)).toEqual(['search', 'secret']);
    opened?.onPick('secret');
    expect(picks).toEqual(['secret']);
  });

  it('withholds gated routes from the navigation picker for an anonymous session', () => {
    const picker = setup(false);
    picker.openForNavigation(document.createElement('button'), () => undefined);
    expect(opened?.entries.map((e) => e.key)).toEqual(['search']);
  });

  it('offers gated routes and views to the hosting picker once the session qualifies (finding #32)', () => {
    const picker = setup(true);
    picker.openForHosting(document.createElement('button'), () => undefined);
    expect(opened?.entries.map((e) => e.key)).toEqual([
      'search',
      'secret',
      'view:outline',
      'view:audit',
    ]);
  });

  it('withholds gated targets from the hosting picker for an anonymous session', () => {
    const picker = setup(false);
    picker.openForHosting(document.createElement('button'), () => undefined);
    expect(opened?.entries.map((e) => e.key)).toEqual([
      'search',
      'view:outline',
    ]);
  });

  it('withholds a parameterised child from the inner picker — a sibling opens it', () => {
    const picker = setup(true);
    picker.openForChildren(
      document.createElement('button'),
      {
        children: [
          { surface: 'outline', segment: 'list' },
          { surface: 'audit', segment: 'audit/:runId' },
        ],
      },
      () => undefined,
    );
    expect(opened?.entries.map((e) => e.key)).toEqual(['view:outline']);
  });
});
