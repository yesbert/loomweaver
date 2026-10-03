import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  surfaceActionsSlot,
  surfaceOfActionsSlot,
  ToolbarRegistry,
} from './toolbar-registry';

@Component({ selector: 'lw-cell', template: 'cell' })
class Cell {}

describe('ToolbarRegistry', () => {
  let registry: ToolbarRegistry;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    registry = TestBed.inject(ToolbarRegistry);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  it('holds a toolbar under its slot with the owner the host stamped', () => {
    registry.addToolbar({ slot: 'acme.records/toolbar', title: 'acme.records' }, 'acme');

    expect(registry.toolbars()).toEqual([
      { toolbar: { slot: 'acme.records/toolbar', title: 'acme.records' }, ownerId: 'acme' },
    ]);
    expect(registry.titleOf('acme.records/toolbar')).toBe('acme.records');
  });

  it('refuses a second owner for the same slot, names both, and leaves the first in place', () => {
    registry.addToolbar({ slot: 'acme.records/toolbar', title: 'first' }, 'acme');
    const refused = registry.addToolbar(
      { slot: 'acme.records/toolbar', title: 'second' },
      'intruder',
    );
    refused.dispose();

    expect(registry.titleOf('acme.records/toolbar')).toBe('first');
    expect(String(warn.mock.calls[0][0])).toContain('"acme"');
    expect(String(warn.mock.calls[0][0])).toContain('"intruder"');
  });

  it('lets the same owner replace its toolbar, and takes it away with its plugin', () => {
    registry.addToolbar({ slot: 'acme.records/toolbar', title: 'first' }, 'acme');
    const second = registry.addToolbar(
      { slot: 'acme.records/toolbar', title: 'second' },
      'acme',
    );
    expect(registry.titleOf('acme.records/toolbar')).toBe('second');
    expect(warn).not.toHaveBeenCalled();

    second.dispose();
    expect(registry.toolbars()).toEqual([]);
  });

  it('holds cells by id, last registration winning, and drops one with its handle', () => {
    registry.addCell({ id: 'acme.filter', slot: 's', component: Cell, order: 2 });
    const replaced = registry.addCell({ id: 'acme.filter', slot: 's', component: Cell, order: 5 });

    expect(registry.cells().map((cell) => cell.order)).toEqual([5]);

    replaced.dispose();
    expect(registry.cells()).toEqual([]);
  });

  it('names the slot a surface’s actions are drawn from, and reads the surface back', () => {
    expect(surfaceActionsSlot('acme.records')).toBe('acme.records/actions');
    expect(surfaceOfActionsSlot('acme.records/actions')).toBe('acme.records');
    expect(surfaceOfActionsSlot('acme.records/toolbar')).toBeUndefined();
    expect(surfaceOfActionsSlot('/actions')).toBeUndefined();
  });
});
