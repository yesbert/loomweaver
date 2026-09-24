import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { PaneAdmission } from './pane-admission';

@Component({ selector: 'lw-admission-probe', template: '' })
class ProbeView {}

describe('PaneAdmission', () => {
  function setup(): {
    admission: PaneAdmission;
    registry: ContributionRegistry;
  } {
    const registry = TestBed.inject(ContributionRegistry);
    return { admission: TestBed.inject(PaneAdmission), registry };
  }

  it('a registered, ungated view is hostable; a gated one is not (anonymous session)', () => {
    const { admission, registry } = setup();
    registry.addView({
      id: 'v.open',
      region: 'primary',
      title: 't',
      component: ProbeView,
    });
    registry.addView({
      id: 'v.admin',
      region: 'primary',
      title: 't',
      component: ProbeView,
      access: { anyRole: ['admin'] },
    });

    expect(admission.canOfferAsPaneTarget('view:v.open')).toBe(true);
    expect(admission.canOfferAsPaneTarget('view:v.admin')).toBe(false);
    expect(admission.canOfferAsPaneTarget('view:v.unknown')).toBe(false);
  });

  it('an off-router-safe content route is hostable; a parameterised one is not', () => {
    const { admission, registry } = setup();
    registry.addContentRoute({ path: 'search', component: ProbeView });
    registry.addContentRoute({ path: 'doc/:id', component: ProbeView });

    expect(admission.canOfferAsPaneTarget('search')).toBe(true);
    expect(admission.canOfferAsPaneTarget('doc/abc')).toBe(false);
  });

  it('a gated route and view become hostable once the session qualifies (finding #32)', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AUTH_SOURCE,
          useValue: signal({
            authenticated: true,
            roles: ['admin'],
            claims: {},
          }),
        },
      ],
    });
    const { admission, registry } = setup();
    registry.addContentRoute({
      path: 'secret',
      component: ProbeView,
      access: { anyRole: ['admin'] },
    });
    registry.addView({
      id: 'v.admin',
      region: 'primary',
      title: 't',
      component: ProbeView,
      access: { anyRole: ['admin'] },
    });

    expect(admission.canOfferAsPaneTarget('secret')).toBe(true);
    expect(admission.canOfferAsPaneTarget('view:v.admin')).toBe(true);
  });
});
