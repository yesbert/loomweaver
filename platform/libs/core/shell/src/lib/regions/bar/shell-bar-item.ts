import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Injector,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { DockPosition } from '../../layout/layout';
import { TooltipPosition } from '../../elements/tooltip/lw-tooltip.element';
import { CommandService } from '../../commands/command.service';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { SlotResolution } from '../../menu/slot-resolution.service';
import { MenuTriggerDirective } from '../../menu/menu-trigger.directive';
import {
  menuOnContext,
  warnMenuTriggerConflict,
} from '../../menu/chrome-item-menu';
import { MenuSide } from '../../elements/menu/lw-menu.element';
import {
  BarButtonItem,
  BarComponentItem,
  BarItem,
} from '../../foundation/bar-item';
import { BAR_CONTEXT, barMenuContext } from './bar-context';

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
  host: { class: 'min-w-0' },
  templateUrl: './shell-bar-item.html',
})
export class ShellBarItem {
  readonly item = input.required<BarItem>();

  readonly dock = input.required<DockPosition>();

  private readonly commands = inject(CommandService);
  private readonly slots = inject(SlotResolution);
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
  private readonly resolved = computed(() => {
    const button = this.asButton();
    return button
      ? this.slots.resolve([button], barMenuContext).at(0)
      : undefined;
  });

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
  protected readonly menuContext = computed<MenuContext>(() =>
    barMenuContext(this.item()),
  );
  protected readonly activateMenu = computed<string | undefined>(
    () => this.resolved()?.opensMenu,
  );

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

  protected readonly disabled = computed(
    () => this.resolved()?.disabled ?? false,
  );
  protected readonly shortcut = computed<string | undefined>(() =>
    this.asButton()?.showShortcut ? this.resolved()?.shortcut : undefined,
  );

  protected pictureOf(button: BarButtonItem): string | undefined {
    return this.brokenPicture() ? undefined : button.image;
  }

  protected onPictureError(): void {
    this.brokenPicture.set(true);
  }

  protected run(button: BarButtonItem): void {
    if (this.disabled()) return;
    warnMenuTriggerConflict(button);
    if (this.activateMenu()) {
      return;
    }
    this.commands.trigger(button);
  }
}
