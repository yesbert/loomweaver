import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  type ModuleArea,
  areaShowing,
  moduleOfPath,
  navSurfaceId,
} from './module-tree';
import { navigationActions } from './navigation-actions';

@Component({
  selector: 'lw-module-nav-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './module-nav-view.html',
})
export class ModuleNavView {
  protected readonly shown = computed(() => navigationActions.activePath());

  protected readonly module = computed(() => moduleOfPath(this.shown()));

  protected readonly waiting = computed(() =>
    this.module().areas.some((area) => area.views.length === 0),
  );

  constructor() {
    effect(() => {
      const module = this.module();
      const area = areaShowing(module, (path) => navigationActions.showingUnder(path));
      navigationActions.retitle(
        navSurfaceId(module.id),
        area?.titleKey ?? module.titleKey,
      );
    });
  }

  protected keyOf(area: ModuleArea): string {
    return `${this.module().id}/${area.id}`;
  }

  protected show(event: Event): void {
    navigationActions.open((event as CustomEvent<{ path: string }>).detail.path);
  }
}
