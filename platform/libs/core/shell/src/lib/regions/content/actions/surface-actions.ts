import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MenuContext, ViewAction } from '@loomweaver/plugin-sdk';
import { CommandService } from '../../../commands/command.service';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import {
  menuOnContext,
  warnMenuTriggerConflict,
} from '../../../menu/chrome-item-menu';
import { MenuTriggerDirective } from '../../../menu/menu-trigger.directive';
import { ResolvedEntry } from '../../../menu/menu-resolution';
import { SlotResolution } from '../../../menu/slot-resolution.service';
import { surfaceForPanePath } from '../../pane/pane-surface';

@Component({
  selector: 'lw-surface-actions',
  imports: [TranslocoPipe, MenuTriggerDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'contents' },
  templateUrl: './surface-actions.html',
})
export class SurfaceActions {
  private readonly registry = inject(ContributionRegistry);

  private readonly commands = inject(CommandService);

  private readonly slots = inject(SlotResolution);

  readonly path = input<string | undefined>();

  readonly region = input.required<string>();

  readonly inStrip = input(false, { transform: booleanAttribute });

  private readonly surfaceId = computed(() => {
    const path = this.path();
    return path === undefined
      ? undefined
      : surfaceForPanePath(
          this.registry.contentRoutes(),
          this.registry.views(),
          path,
        )?.id;
  });

  protected readonly actions = computed(() =>
    this.slots.resolve(this.registry.actionsOf(this.surfaceId()), (action) =>
      this.contextOf(action),
    ),
  );

  protected contextMenuOf(action: ViewAction): string | undefined {
    return menuOnContext(action);
  }

  protected contextOf(action: ViewAction): MenuContext {
    return {
      targetKind: 'view-action',
      id: action.id,
      region: this.region(),
      surface: this.surfaceId() ?? '',
    };
  }

  protected run(entry: ResolvedEntry<ViewAction>): void {
    if (entry.disabled) {
      return;
    }
    warnMenuTriggerConflict(entry.item);
    if (entry.opensMenu) {
      return;
    }
    this.commands.trigger(entry.item);
  }
}
