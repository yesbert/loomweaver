import { EnvironmentInjector, inject, Injector, Service } from '@angular/core';
import { VIEW_STATE } from '@loomweaver/plugin-sdk';
import { View } from '../layout/view';
import { ViewStateService } from './view-state.service';
import { ViewInstanceService } from './view-instance.service';

@Service()
export class ViewMountService {
  private readonly env = inject(EnvironmentInjector);
  private readonly viewStates = inject(ViewStateService);
  private readonly viewInstances = inject(ViewInstanceService);
  private readonly injectors = new Map<string, Injector>();

  injectorFor(view: View): Injector {
    return this.injectorForInstance(this.instanceIdFor(view));
  }

  instanceIdFor(view: View): string {
    return view.instanceable ? this.viewInstances.activeId(view.id)() : view.id;
  }

  injectorForInstance(instanceId: string): Injector {
    let injector = this.injectors.get(instanceId);
    if (!injector) {
      injector = Injector.create({
        parent: this.env,
        providers: [
          { provide: VIEW_STATE, useValue: this.viewStates.handle(instanceId) },
        ],
      });
      this.injectors.set(instanceId, injector);
    }
    return injector;
  }
}
