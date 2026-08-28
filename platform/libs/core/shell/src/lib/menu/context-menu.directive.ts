import { Directive, inject, input } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuService } from './menu.service';

@Directive({
  selector: '[lwContextMenu]',
  host: { '(contextmenu)': 'onContextMenu($event)' },
})
export class ContextMenuDirective {
  private readonly menus = inject(MenuService);

  readonly menu = input<string | readonly string[] | undefined>(undefined, {
    alias: 'lwContextMenu',
  });

  readonly context = input<MenuContext>({}, { alias: 'lwContextMenuContext' });

  protected onContextMenu(event: MouseEvent): void {
    const slot = this.menu();
    if (!slot || slot.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.menus.open(slot, this.context(), {
      x: event.clientX,
      y: event.clientY,
    });
  }
}
