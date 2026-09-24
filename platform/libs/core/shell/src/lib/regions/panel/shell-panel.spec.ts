import { Component, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ShellPanel } from './shell-panel';
import { LayoutRegion, provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { View } from '../../views/view';
import { SURFACE_PADDING } from '../../foundation/surface-padding';
import { ViewportService } from '../../layout/viewport.service';

let built = 0;

@Component({ selector: 'lw-nav-stub', template: 'nav' })
class NavStub {
  constructor() {
    built += 1;
  }
}

const panelRegion: LayoutRegion = {
  id: 'primary',
  type: 'panel',
  dock: 'left',
};

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { nav: 'Nav', act: 'Act', float: 'Float', dock: 'Dock' } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('a panel with a declared width', () => {
  const wide: LayoutRegion = {
    id: 'chat',
    type: 'panel',
    dock: 'right',
    width: 360,
  };

  function asideWidth(compact: boolean, region: LayoutRegion = wide): string {
    TestBed.configureTestingModule({
      imports: [ShellPanel, transloco()],
      providers: [
        provideLayout({ regions: [region] }),
        { provide: ViewportService, useValue: { compact: signal(compact) } },
      ],
    });
    const fixture = TestBed.createComponent(ShellPanel);
    fixture.componentRef.setInput('region', region);
    fixture.detectChanges();
    return (fixture.nativeElement.querySelector('aside') as HTMLElement).style
      .width;
  }

  beforeEach(() => localStorage.clear());

  it('stands beside the content at its declared width', () => {
    expect(asideWidth(false)).toBe('360px');
  });

  it('keeps the overlay width of its own on a narrow viewport', () => {
    const width = asideWidth(true);

    expect(width).toContain('288px');
    expect(width).not.toContain('360px');
  });

  it('takes its declared overlay width on a narrow viewport', () => {
    expect(asideWidth(true, { ...wide, overlayWidth: 400 })).toContain('400px');
  });

  it('does not carry a width stored beside the content into the overlay', () => {
    localStorage.setItem('lw.shell.panel-sizes', JSON.stringify({ chat: 500 }));

    const width = asideWidth(true, { ...wide, overlayWidth: 400 });

    expect(width).toContain('400px');
    expect(width).not.toContain('500px');
  });
});

describe('ShellPanel', () => {
  let ran = 0;
  const navView: View = {
    id: 'nav',
    region: 'primary',
    title: 'nav',
    icon: 'navigator',
    order: 0,
    actions: [{ id: 'a', icon: 'add', title: 'act', run: () => (ran += 1) }],
    component: NavStub,
  };

  function render() {
    localStorage.clear();
    ran = 0;
    TestBed.configureTestingModule({
      imports: [ShellPanel, transloco()],
      providers: [],
    });
    TestBed.inject(ContributionRegistry).addView(navView);
    const fixture = TestBed.createComponent(ShellPanel);
    fixture.componentRef.setInput('region', panelRegion);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it("runs the active view's own header action", () => {
    const host = render();

    (host.querySelector('[aria-label="Act"]') as HTMLButtonElement).click();

    expect(ran).toBe(1);
  });

  it('renders no view tabs (switching lives in the sidebar header)', () => {
    expect(render().querySelectorAll('[role="tab"]').length).toBe(0);
  });

  describe('a view renamed while it is mounted', () => {
    it('is named by the new title in the panel header, and is not rebuilt', () => {
      localStorage.clear();
      built = 0;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ShellPanel, transloco()],
        providers: [],
      });
      const registry = TestBed.inject(ContributionRegistry);
      registry.addView(navView);
      const fixture = TestBed.createComponent(ShellPanel);
      fixture.componentRef.setInput('region', panelRegion);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.textContent).toContain('Nav');
      const builtOnce = built;

      registry.retitleSurface('nav', 'act');
      fixture.detectChanges();

      expect(host.textContent).toContain('Act');
      expect(host.textContent).not.toContain('Nav');
      expect(built).toBe(builtOnce);
    });
  });

  describe("a view's action that carries a toggle state", () => {
    function renderWith(actions: View['actions']) {
      localStorage.clear();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ShellPanel, transloco()],
        providers: [],
      });
      const registry = TestBed.inject(ContributionRegistry);
      registry.addView({ ...navView, actions });
      const fixture = TestBed.createComponent(ShellPanel);
      fixture.componentRef.setInput('region', panelRegion);
      fixture.detectChanges();
      return { fixture, registry, host: fixture.nativeElement as HTMLElement };
    }

    function pressedOf(host: HTMLElement, label: string): string | null {
      return (
        [...host.querySelectorAll('button[aria-label]')]
          .find((button) => button.getAttribute('aria-label') === label)
          ?.getAttribute('aria-pressed') ?? null
      );
    }

    it('is announced pressed when it stands on, unpressed when off, and as a plain button without one', () => {
      const { host } = renderWith([
        { id: 'on', icon: 'pin', title: 'float', pressed: true },
        { id: 'off', icon: 'pin', title: 'dock', pressed: false },
        { id: 'plain', icon: 'add', title: 'act' },
      ]);

      expect(pressedOf(host, 'Float')).toBe('true');
      expect(pressedOf(host, 'Dock')).toBe('false');
      expect(pressedOf(host, 'Act')).toBeNull();
    });

    it('flips its announced state when replaced with the opposite one, without a rebuild', () => {
      built = 0;
      const { fixture, registry, host } = renderWith([
        { id: 'float', icon: 'pin', title: 'float', pressed: false },
      ]);
      const builtOnce = built;

      registry.updateSurfaceAction('nav', {
        id: 'float',
        icon: 'pin',
        title: 'dock',
        pressed: true,
      });
      fixture.detectChanges();

      expect(pressedOf(host, 'Dock')).toBe('true');
      expect(host.querySelector('[aria-label="Float"]')).toBeNull();
      expect(built).toBe(builtOnce);
    });

    it('draws an action added later in the place its order gives it', () => {
      const { fixture, registry, host } = renderWith([
        { id: 'a', icon: 'add', title: 'act', order: 10 },
      ]);

      registry.updateSurfaceAction('nav', {
        id: 'z',
        icon: 'pin',
        title: 'float',
        order: 0,
      });
      fixture.detectChanges();

      const labels = [...host.querySelectorAll('button[aria-label]')]
        .map((button) => button.getAttribute('aria-label'))
        .filter((label) => label === 'Float' || label === 'Act');
      expect(labels).toEqual(['Float', 'Act']);
    });
  });

  describe('the inset a docked view gets', () => {
    function surfaceOf(
      padded: boolean | undefined,
      composition: 'none' | 'inset',
    ): HTMLElement | null {
      localStorage.clear();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ShellPanel, transloco()],
        providers: [{ provide: SURFACE_PADDING, useValue: composition }],
      });
      TestBed.inject(ContributionRegistry).addView({ ...navView, padded });
      const fixture = TestBed.createComponent(ShellPanel);
      fixture.componentRef.setInput('region', panelRegion);
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector(
        String.raw`.\@container\/surface`,
      );
    }

    it('is none where neither the view nor the composition asks', () => {
      expect(surfaceOf(undefined, 'none')?.classList).not.toContain('p-3');
    });

    it('is applied where the composition asks and the view says nothing', () => {
      expect(surfaceOf(undefined, 'inset')?.classList).toContain('p-3');
    });

    it('is none where the view owns its edges against a composition that asks', () => {
      expect(surfaceOf(false, 'inset')?.classList).not.toContain('p-3');
    });

    it('is applied where the view asks against a composition that does not', () => {
      expect(surfaceOf(true, 'none')?.classList).toContain('p-3');
    });
  });

  describe('auth gating', () => {
    let acted = 0;
    const gatedView: View = {
      id: 'nav',
      region: 'primary',
      title: 'nav',
      order: 0,
      actions: [
        {
          id: 'a',
          icon: 'add',
          title: 'act',
          access: { authenticated: true, mode: 'disable' },
          run: () => (acted += 1),
        },
      ],
      component: NavStub,
    };

    function renderWith(auth: WritableSignal<AuthSnapshot>) {
      localStorage.clear();
      acted = 0;
      TestBed.configureTestingModule({
        imports: [ShellPanel, transloco()],
        providers: [{ provide: AUTH_SOURCE, useValue: auth }],
      });
      TestBed.inject(ContributionRegistry).addView(gatedView);
      const fixture = TestBed.createComponent(ShellPanel);
      fixture.componentRef.setInput('region', panelRegion);
      fixture.detectChanges();
      return fixture;
    }

    it('keeps a disable-mode header action visible but inert until the session qualifies', () => {
      const auth = signal<AuthSnapshot>(ANONYMOUS);
      const fixture = renderWith(auth);
      const button = fixture.nativeElement.querySelector(
        '[aria-label="Act"]',
      ) as HTMLButtonElement;

      expect(button.disabled).toBe(true);
      button.click();
      expect(acted).toBe(0);

      auth.set({ authenticated: true, roles: [], claims: {} });
      fixture.detectChanges();
      expect(button.disabled).toBe(false);
      button.click();
      expect(acted).toBe(1);
    });
  });
});
