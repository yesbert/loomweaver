import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { ContainerDockGc } from './container/container-dock-gc';
import { RetentionGc } from './retention/retention-gc';
import { RetentionUnloadGuard } from './unsaved-work/retention-unload-guard';

export function providePaneHousekeeping(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(ContainerDockGc).start();
    inject(RetentionGc).start();
    inject(RetentionUnloadGuard).start();
  });
}
