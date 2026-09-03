import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppResetService } from './app-reset.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PanelSizeService } from '../panel/panel-size.service';
import { PanelState } from '../panel/panel-state';
import { RailItemsService } from '../rail/rail-items.service';
import { UserOrderService } from '../reorder/user-order.service';
import { ViewInstanceService } from '../../views/view-instance.service';
import { ViewStateService } from '../../views/view-state.service';

@Component({ selector: 'lw-stub', template: '' })
class Stub {}

function setUp() {
  localStorage.clear();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  TestBed.inject(ContributionRegistry).addView({
    id: 'outline',
    region: 'primary',
    title: 'outline',
    order: 0,
    component: Stub,
    instanceable: true,
  });
  return {
    reset: TestBed.inject(AppResetService),
    railItems: TestBed.inject(RailItemsService),
    panels: TestBed.inject(PanelState),
    sizes: TestBed.inject(PanelSizeService),
    order: TestBed.inject(UserOrderService),
    instances: TestBed.inject(ViewInstanceService),
    states: TestBed.inject(ViewStateService),
  };
}

describe('AppResetService (K6)', () => {
  it('puts the app-wide arrangement back and drops its keys', async () => {
    const app = setUp();
    app.railItems.hide('notes');
    app.panels.toggle('primary');
    app.sizes.setWidth('primary', 400);
    app.sizes.commit();
    app.order.setOrder('rail:left', ['b', 'a']);

    await app.reset.reset();

    expect(app.railItems.isVisible('notes')).toBe(true);
    expect(app.panels.isCollapsed('primary')).toBe(false);
    expect(app.sizes.width('primary')).not.toBe(400);
    expect(app.order.applyOrder('rail:left', ['a', 'b'], (id) => id)).toEqual([
      'a',
      'b',
    ]);
    for (const key of [
      'lw.shell.rail-items',
      'lw.shell.panels',
      'lw.shell.panel-sizes',
      'lw.shell.item-order',
    ]) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it('takes named view instances with it, along with their state', async () => {
    const app = setUp();
    app.instances.create('outline', 'Mine');
    const created = app.instances.activeId('outline')();
    app.states.handle(created).set({ sort: 'alpha' });
    app.states.handle('outline').set({ sort: 'alpha' });

    await app.reset.reset();

    expect(app.instances.instances('outline')()).toEqual([
      { id: 'outline', name: '' },
    ]);
    expect(app.instances.activeId('outline')()).toBe('outline');
    expect(app.states.handle('outline').value()).toBeUndefined();
  });

  it('leaves choices alone: theme, language and saved workspaces are none of its business', async () => {
    const app = setUp();
    localStorage.setItem('lw.shell.theme', '"dark"');
    localStorage.setItem('lw.shell.lang', '"de"');
    localStorage.setItem('lw.shell.workspaces', '[{"id":"a"}]');
    localStorage.setItem('lw.shell.pane-trees:default', '{"content":{}}');

    await app.reset.reset();

    expect(localStorage.getItem('lw.shell.theme')).toBe('"dark"');
    expect(localStorage.getItem('lw.shell.lang')).toBe('"de"');
    expect(localStorage.getItem('lw.shell.workspaces')).toBe('[{"id":"a"}]');
    expect(localStorage.getItem('lw.shell.pane-trees:default')).toBe(
      '{"content":{}}',
    );
  });
});
