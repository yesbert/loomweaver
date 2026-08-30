import { Component, CUSTOM_ELEMENTS_SCHEMA, Injector, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DockPosition } from '../../layout/layout';
import { TooltipPosition } from '../../elements/tooltip/lw-tooltip.element';
import { CommandService } from '../../commands/command.service';
import { AuthContext } from '../../auth/auth-context';
import { MenuTriggerDirective } from '../../menu/menu-trigger.directive';
import {
  menuOnActivate,
  menuOnContext,
  warnMenuTriggerConflict,
} from '../../menu/chrome-item-menu';
import { MenuSide } from '../../elements/menu/lw-menu.element';
import { BarButtonItem, BarComponentItem, BarItem } from '../../foundation/bar-item';
import { BAR_CONTEXT } from './bar-context';

const MENU_SIDE_BY_DOCK: Readonly<Record<DockPosition, MenuSide>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  center: 'bottom',
};

@Component({
  selector: 'lw-shell-bar-item',
  imports: [NgComponentOutlet, TranslocoPipe, MenuTriggerDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './shell-bar-item.html',
})
export class ShellBarItem {
  readonly item = input.required<BarItem>();

  readonly dock = input.required<DockPosition>();

  private readonly commands = inject(CommandService);
  private readonly auth = inject(AuthContext);
  private readonly injector = inject(Injector);

  protected readonly asComponent = computed<BarComponentItem | null>(() => {
    const item = this.item();
    return 'component' in item ? item : null;
  });
  protected readonly asButton = computed<BarButtonItem | null>(() => {
    const item = this.item();
    return 'component' in item ? null : item;
  });
  private readonly brokenPicture = signal(false);

  protected readonly tooltipPosition = computed<TooltipPosition>(() =>
    this.dock() === 'bottom' ? 'top' : 'bottom',
  );
  protected readonly menuSide = computed<MenuSide>(
    () => MENU_SIDE_BY_DOCK[this.dock()],
  );
  protected readonly contextMenu = computed<string | undefined>(() => {
    const button = this.asButton();
    return button ? menuOnContext(button) : undefined;
  });
  protected readonly activateMenu = computed<string | undefined>(() => {
    const button = this.asButton();
    return button ? menuOnActivate(button) : undefined;
  });

  protected readonly componentInjector = computed<Injector>(() => {
    const item = this.item();
    return Injector.create({
      parent: this.injector,
      providers: [
        {
          provide: BAR_CONTEXT,
          useValue: { bar: item.bar, dock: this.dock(), slot: item.slot },
        },
      ],
    });
  });

  protected readonly disabled = computed(() =>
    this.auth.disabled(this.asButton()?.access),
  );
  protected readonly shortcut = computed<string | undefined>(() => {
    const button = this.asButton();
    if (!button?.showShortcut || !button.command) {
      return;
    }
    return this.commands.shortcutOf(
      this.commands.commands().find((entry) => entry.id === button.command),
    );
  });

  protected pictureOf(button: BarButtonItem): string | undefined {
    return this.brokenPicture() ? undefined : button.image;
  }

  protected onPictureError(): void {
    this.brokenPicture.set(true);
  }

  protected run(button: BarButtonItem): void {
    if (this.disabled()) return;
    warnMenuTriggerConflict(button);
    if (menuOnActivate(button)) {
      return;
    }
    this.commands.trigger(button);
  }
}
