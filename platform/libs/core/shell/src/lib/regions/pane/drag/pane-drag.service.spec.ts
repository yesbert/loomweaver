import { TestBed } from '@angular/core/testing';
import { PaneDragService } from './pane-drag.service';

describe('PaneDragService (the one drag model)', () => {
  function setup(): { drag: PaneDragService } {
    return { drag: TestBed.inject(PaneDragService) };
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

  it('keeps a strip registered when an earlier registration of the same pane is disposed', () => {
    const { drag } = setup();
    const earlier = drag.registerStrip('pane-strip:content:main');
    drag.registerStrip('pane-strip:content:main');
    earlier();
    expect(drag.dropTargetIds()).toContain('pane-strip:content:main');
  });

  it('keeps a zone registered when an earlier registration of the same id is disposed', () => {
    const { drag } = setup();
    const earlier = drag.registerZone('pane-zone:content:main:left');
    drag.registerZone('pane-zone:content:main:left');
    earlier();
    expect(drag.dropTargetIds()).toContain('pane-zone:content:main:left');
  });
});
