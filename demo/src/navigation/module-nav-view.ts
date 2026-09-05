import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  type ModuleArea,
  type ModuleView,
  areaOfPath,
  isUnder,
  moduleOfPath,
  navSurfaceId,
} from './module-tree';
import { foldState } from './fold-state';
import { navigationActions } from './navigation-actions';

@Component({
  selector: 'lw-module-nav-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './module-nav-view.html',
})
export class ModuleNavView {
  private readonly activePath = computed(() => navigationActions.activePath());

  protected readonly module = computed(() => moduleOfPath(this.activePath()));

  protected readonly waiting = computed(() =>
    this.module().areas.some((area) => area.views.length === 0),
  );

  constructor() {
    effect(() => {
      const module = this.module();
      const area = areaOfPath(this.activePath());
      navigationActions.retitle(
        navSurfaceId(module.id),
        area?.titleKey ?? module.titleKey,
        module.icon,
      );
    });
  }

  protected open(area: ModuleArea): boolean {
    return foldState.isOpen(this.keyOf(area), area.expanded ?? true);
  }

  protected toggle(area: ModuleArea): void {
    foldState.toggle(this.keyOf(area), area.expanded ?? true);
  }

  protected current(view: ModuleView): boolean {
    return isUnder(this.activePath(), view.path);
  }

  protected show(view: ModuleView): void {
    navigationActions.open(view.path);
  }

  private keyOf(area: ModuleArea): string {
    return `${this.module().id}/${area.id}`;
  }
}
