import {
  inject,
  Injector,
  runInInjectionContext,
  Service,
} from '@angular/core';
import { Capability } from '@loomweaver/plugin-sdk';
import { HostPluginContext } from './host-plugin-context';

@Service()
export class HostContextFactory {
  private readonly injector = inject(Injector);

  create(
    pluginId: string,
    isGranted: (capability: Capability) => boolean,
  ): HostPluginContext {
    return runInInjectionContext(
      this.injector,
      () => new HostPluginContext(pluginId, isGranted),
    );
  }
}
