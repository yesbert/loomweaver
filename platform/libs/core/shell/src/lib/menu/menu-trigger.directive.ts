import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuSide } from '../elements/menu/lw-menu.element';
import { MenuService } from './menu.service';

type MenuSlots = string | readonly string[] | undefined;

function names(slots: MenuSlots): slots is string | readonly string[] {
  return slots !== undefined && slots.length > 0;
}

@Directive({
  selector: '[lwMenu], [lwMenuOnActivate], [lwMenuState]',
  host: {
    '(contextmenu)': 'onContextMenu($event)',
    '(click)': 'onActivate($event)',
    '[attr.aria-haspopup]': 'hasPopup()',
    '[attr.aria-expanded]': 'expanded()',
  },
})
export class MenuTriggerDirective {
  private readonly menus = inject(MenuService);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly menu = input<MenuSlots>(undefined, { alias: 'lwMenu' });

  readonly onActivateMenu = input<MenuSlots>(undefined, {
    alias: 'lwMenuOnActivate',
  });

  readonly context = input<MenuContext>({}, { alias: 'lwMenuContext' });

  readonly side = input<MenuSide>('bottom', { alias: 'lwMenuSide' });

  readonly state = input(false, {
    alias: 'lwMenuState',
    transform: booleanAttribute,
  });

  private readonly announces = computed(
    () => this.state() || names(this.onActivateMenu()),
  );

  protected readonly hasPopup = computed(() =>
    this.announces() ? 'menu' : null,
  );

  protected readonly expanded = computed(() =>
    this.announces()
      ? String(this.menus.openTrigger() === this.host.nativeElement)
      : null,
  );

  protected onContextMenu(event: MouseEvent): void {
    const slots = this.menu();
    if (!names(slots)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.menus.open(slots, this.context(), {
      x: event.clientX,
      y: event.clientY,
    });
  }

  protected onActivate(event: MouseEvent): void {
    const slots = this.onActivateMenu();
    if (!names(slots)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const control = this.host.nativeElement;
    this.menus.open(
      slots,
      this.context(),
      { rect: control.getBoundingClientRect(), side: this.side() },
      control,
    );
  }
}
