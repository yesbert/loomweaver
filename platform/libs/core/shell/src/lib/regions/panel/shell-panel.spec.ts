import { Component, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ShellPanel } from './shell-panel';
import { LayoutRegion } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { View } from '../../layout/view';
import { SURFACE_PADDING } from '../../foundation/surface-padding';

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
    langs: { en: { nav: 'Nav', act: 'Act' } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

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
