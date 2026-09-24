import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { ContainerDockGc } from './container/container-dock-gc';
import { ParkedViewSweep } from './retention/parked-view-sweep';
import { RetentionUnloadGuard } from './unsaved-work/retention-unload-guard';

export function providePaneHousekeeping(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(ContainerDockGc).start();
    inject(ParkedViewSweep).start();
    inject(RetentionUnloadGuard).start();
  });
}
