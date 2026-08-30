import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuTriggerDirective } from './menu-trigger.directive';
import { MenuService } from './menu.service';
import type { Mock } from 'vitest';

@Component({
  imports: [MenuTriggerDirective],
  template: `
    <button
      [lwMenu]="slot()"
      [lwMenuOnActivate]="activateSlot()"
      [lwMenuContext]="context()"
      [lwMenuSide]="'right'"
    >
      target
    </button>
  `,
})
class HostCmp {
  readonly slot = signal<string | undefined>('demo/context');
  readonly activateSlot = signal<string | undefined>(undefined);
  readonly context = signal<MenuContext>({ targetKind: 'rail-item', id: 'x' });
}

describe('MenuTriggerDirective', () => {
  let fixture: ComponentFixture<HostCmp>;
  let host: HostCmp;
  let open: Mock;
  const openTrigger = signal<HTMLElement | null>(null);

  beforeEach(() => {
    open = vi.fn();
    openTrigger.set(null);
    TestBed.configureTestingModule({
      imports: [HostCmp],
      providers: [{ provide: MenuService, useValue: { open, openTrigger } }],
    });
    fixture = TestBed.createComponent(HostCmp);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  function rightClick(): boolean {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 12,
      clientY: 34,
    });
    return button().dispatchEvent(event);
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

  it('ignores activation while no activation slot is named', () => {
    button().click();
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the activation slot beside the control, naming the control (the click Enter and Space produce)', () => {
    host.activateSlot.set('demo/account');
    fixture.detectChanges();

    button().click();

    expect(open).toHaveBeenCalledWith(
      'demo/account',
      { targetKind: 'rail-item', id: 'x' },
      { rect: button().getBoundingClientRect(), side: 'right' },
      { trigger: button(), header: undefined },
    );
  });

  it('keeps the two gestures apart', () => {
    host.activateSlot.set('demo/account');
    fixture.detectChanges();

    rightClick();

    expect(open).toHaveBeenCalledWith(
      'demo/context',
      expect.anything(),
      { x: 12, y: 34 },
    );
  });

  it('announces a menu only where activation opens one, and follows its open state', () => {
    expect(button().getAttribute('aria-haspopup')).toBeNull();
    expect(button().getAttribute('aria-expanded')).toBeNull();

    host.activateSlot.set('demo/account');
    fixture.detectChanges();
    expect(button().getAttribute('aria-haspopup')).toBe('menu');
    expect(button().getAttribute('aria-expanded')).toBe('false');

    openTrigger.set(button());
    fixture.detectChanges();
    expect(button().getAttribute('aria-expanded')).toBe('true');

    openTrigger.set(null);
    fixture.detectChanges();
    expect(button().getAttribute('aria-expanded')).toBe('false');
  });
});
