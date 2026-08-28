import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { ContextMenuDirective } from './context-menu.directive';
import { MenuService } from './menu.service';
import type { Mock } from 'vitest';

@Component({
  imports: [ContextMenuDirective],
  template: `
    <button [lwContextMenu]="slot()" [lwContextMenuContext]="context()">
      target
    </button>
  `,
})
class HostCmp {
  readonly slot = signal<string | undefined>('demo/context');
  readonly context = signal<MenuContext>({ targetKind: 'rail-item', id: 'x' });
}

describe('ContextMenuDirective', () => {
  let fixture: ComponentFixture<HostCmp>;
  let host: HostCmp;
  let open: Mock;

  beforeEach(() => {
    open = vi.fn();
    TestBed.configureTestingModule({
      imports: [HostCmp],
      providers: [{ provide: MenuService, useValue: { open } }],
    });
    fixture = TestBed.createComponent(HostCmp);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function rightClick(): boolean {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 12,
      clientY: 34,
    });
    return fixture.nativeElement.querySelector('button').dispatchEvent(event);
  }

  it('opens the slot at the cursor with the context, and prevents the native menu', () => {
    const notCancelled = rightClick();
    expect(open).toHaveBeenCalledWith(
      'demo/context',
      { targetKind: 'rail-item', id: 'x' },
      { x: 12, y: 34 },
    );
    expect(notCancelled).toBe(false);
  });

  it('does nothing when the slot is empty (attaching unconditionally is safe)', () => {
    host.slot.set(undefined);
    fixture.detectChanges();
    const notCancelled = rightClick();
    expect(open).not.toHaveBeenCalled();
    expect(notCancelled).toBe(true);
  });
});
