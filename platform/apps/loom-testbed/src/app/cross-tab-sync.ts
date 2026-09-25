import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { StateSyncService } from '@loomweaver/shell';
import { testbedAuth, testbedTheme } from '@loomweaver/testbed-weaver';

export function provideTestbedCrossTabSync(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const sync = inject(StateSyncService);
    const announce = { announce: (key: string) => sync.announce(key) };
    for (const choice of [testbedAuth, testbedTheme]) {
      const link = choice.connectSync(announce);
      sync.register('external', link.key, () => link.refresh());
    }
  });
}
