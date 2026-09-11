import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Plugin } from '@loomweaver/plugin-sdk';
import { WorkbenchCaptureService } from '@loomweaver/shell';
import { CaptureDialog } from './capture-dialog';

let injector: EnvironmentInjector | undefined;

export function bindCaptureInjector(next: EnvironmentInjector): void {
  injector = next;
}

export const testbedCapturePlugin: Plugin = {
  manifest: {
    id: 'testbed-capture',
    name: 'Picture of the workbench',
    capabilities: ['contributions', 'ui'],
  },
  activate(ctx) {
    ctx.registerCommand({
      id: 'testbed.capture',
      title: 'Picture of the workbench',
      icon: 'testbedDocument',
      shortcut: 'mod+shift+s',
      run: async () => {
        if (!injector) {
          return;
        }
        const picture = await runInInjectionContext(injector, () =>
          injector!.get(WorkbenchCaptureService).capture(),
        );
        ctx.ui.open(CaptureDialog, {
          data: picture,
          title: 'Picture of the workbench',
          size: 'xl',
          maximizable: true,
        });
      },
    });
  },
};
