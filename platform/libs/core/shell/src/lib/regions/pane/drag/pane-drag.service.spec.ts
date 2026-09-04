import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { PaneDragService } from './pane-drag.service';

@Component({ selector: 'lw-drag-probe', template: '' })
class ProbeView {}

describe('PaneDragService (the one drag model)', () => {
  function setup(): { drag: PaneDragService; registry: ContributionRegistry } {
    const registry = TestBed.inject(ContributionRegistry);
    return { drag: TestBed.inject(PaneDragService), registry };
  }

  it('tracks the active drag payload', () => {
    const { drag } = setup();
    expect(drag.dragging()).toBeNull();
    drag.start('view:testbed.outline');
    expect(drag.dragging()).toBe('view:testbed.outline');
    drag.stop();
    expect(drag.dragging()).toBeNull();
  });

  it('registers and disposes drop-zone ids', () => {
    const { drag } = setup();
    const dispose = drag.registerZone('pane-zone:content:main:left');
    expect(drag.dropTargetIds()).toContain('pane-zone:content:main:left');
    dispose();
    expect(drag.dropTargetIds()).not.toContain('pane-zone:content:main:left');
  });

  it('a registered, ungated view is hostable; a gated one is not (anonymous session)', () => {
    const { drag, registry } = setup();
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

    expect(drag.canOfferAsPaneTarget('view:v.open')).toBe(true);
    expect(drag.canOfferAsPaneTarget('view:v.admin')).toBe(false);
    expect(drag.canOfferAsPaneTarget('view:v.unknown')).toBe(false);
  });

  it('an off-router-safe content route is hostable; a parameterised one is not', () => {
    const { drag, registry } = setup();
    registry.addContentRoute({ path: 'search', component: ProbeView });
    registry.addContentRoute({ path: 'doc/:id', component: ProbeView });

    expect(drag.canOfferAsPaneTarget('search')).toBe(true);
    expect(drag.canOfferAsPaneTarget('doc/abc')).toBe(false);
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
    const { drag, registry } = setup();
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

    expect(drag.canOfferAsPaneTarget('secret')).toBe(true);
    expect(drag.canOfferAsPaneTarget('view:v.admin')).toBe(true);
  });
});
