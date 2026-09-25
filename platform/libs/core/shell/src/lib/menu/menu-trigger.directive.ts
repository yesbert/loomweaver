import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { MenuContext, MenuHeader } from '@loomweaver/plugin-sdk';
import { MenuSide } from '../elements/menu/lw-menu.element';
import { MenuService } from './menu.service';

type MenuIds = string | readonly string[] | undefined;

function hasMenuIds(ids: MenuIds): ids is string | readonly string[] {
  return ids !== undefined && ids.length > 0;
}

@Directive({
  selector: '[lwMenu], [lwMenuOnActivate], [lwMenuAnnounced]',
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

  readonly menu = input<MenuIds>(undefined, { alias: 'lwMenu' });

  readonly onActivateMenu = input<MenuIds>(undefined, {
    alias: 'lwMenuOnActivate',
  });

  readonly context = input<MenuContext>({}, { alias: 'lwMenuContext' });

  readonly side = input<MenuSide>('bottom', { alias: 'lwMenuSide' });

  readonly header = input<MenuHeader | undefined>(undefined, {
    alias: 'lwMenuHeader',
  });

  readonly announced = input(false, {
    alias: 'lwMenuAnnounced',
    transform: booleanAttribute,
  });

  private readonly announcesMenu = computed(
    () => this.announced() || hasMenuIds(this.onActivateMenu()),
  );

  protected readonly hasPopup = computed(() =>
    this.announcesMenu() ? 'menu' : null,
  );

  protected readonly expanded = computed(() =>
    this.announcesMenu()
      ? String(this.menus.openTrigger() === this.host.nativeElement)
      : null,
  );

  protected onContextMenu(event: MouseEvent): void {
    const menuIds = this.menu();
    if (!hasMenuIds(menuIds)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.menus.open(menuIds, this.context(), {
      x: event.clientX,
      y: event.clientY,
    });
  }

  protected onActivate(event: MouseEvent): void {
    const menuIds = this.onActivateMenu();
    if (!hasMenuIds(menuIds)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const control = this.host.nativeElement;
    this.menus.open(
      menuIds,
      this.context(),
      { rect: control.getBoundingClientRect(), side: this.side() },
      { trigger: control, header: this.header() },
    );
  }
}
