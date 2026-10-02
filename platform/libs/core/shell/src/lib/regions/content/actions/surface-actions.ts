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
import { AuthContext } from '../../../auth/auth-context';
import { CommandService } from '../../../commands/command.service';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import {
  menuOnActivate,
  menuOnContext,
  warnMenuTriggerConflict,
} from '../../../menu/chrome-item-menu';
import { MenuTriggerDirective } from '../../../menu/menu-trigger.directive';
import { ChromeItemOffers } from '../../../menu/chrome-item-offers';
import { PopoutWindow } from '../../../popout/popout-window';
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

  private readonly auth = inject(AuthContext);

  private readonly offers = inject(ChromeItemOffers);

  private readonly popout = inject(PopoutWindow).active;

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
    this.registry
      .actionsOf(this.surfaceId())
      .filter((action) => this.auth.visible(action.access))
      .filter((action) => this.belongsInThisWindow(action))
      .filter(
        (action) =>
          menuOnActivate(action) === undefined ||
          this.offers.offered(action, this.contextOf(action)),
      )
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  );

  protected contextMenuOf(action: ViewAction): string | undefined {
    return menuOnContext(action);
  }

  protected activateMenuOf(action: ViewAction): string | undefined {
    return this.offers.menuOnActivation(action, this.contextOf(action));
  }

  protected contextOf(action: ViewAction): MenuContext {
    return {
      targetKind: 'view-action',
      id: action.id,
      region: this.region(),
      surface: this.surfaceId() ?? '',
    };
  }

  protected disabled(action: ViewAction): boolean {
    return this.auth.disabled(action.access);
  }

  protected run(action: ViewAction): void {
    if (this.disabled(action)) {
      return;
    }
    warnMenuTriggerConflict(action);
    if (this.activateMenuOf(action)) {
      return;
    }
    this.commands.trigger(action);
  }

  private belongsInThisWindow(action: ViewAction): boolean {
    if (!this.popout || action.command === undefined) {
      return true;
    }
    const command = this.commands
      .commands()
      .find((candidate) => candidate.id === action.command);
    return command !== undefined && this.commands.available(command);
  }
}
