import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { surfaceActionsSlot } from '../../../contributions/toolbar-registry';
import { ToolbarHost } from '../../toolbar/toolbar-host.service';
import { surfaceForPanePath } from '../../pane/pane-surface';

@Component({
  selector: 'lw-surface-actions',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'contents' },
  templateUrl: './surface-actions.html',
})
export class SurfaceActions {
  private readonly registry = inject(ContributionRegistry);

  private readonly host = inject(ToolbarHost);

  readonly path = input<string | undefined>();

  readonly region = input.required<string>();

  readonly inStrip = input(false, { transform: booleanAttribute });

  private readonly surface = computed(() => {
    const path = this.path();
    return path === undefined
      ? undefined
      : surfaceForPanePath(
          this.registry.contentRoutes(),
          this.registry.views(),
          path,
        );
  });

  protected readonly slot = computed(() => {
    const id = this.surface()?.id;
    return id === undefined ? undefined : surfaceActionsSlot(id);
  });

  protected readonly title = computed(() => this.surface()?.title ?? '');

  protected readonly context = computed<MenuContext>(() => ({
    targetKind: 'view-action',
    region: this.region(),
    surface: this.surface()?.id ?? '',
  }));
}
