import { Plugin } from '@loomweaver/plugin-sdk';
import { WorkbenchPicture, WorkbenchPictureRequest } from '@loomweaver/shell';
import { CaptureDialog } from './capture-dialog';

export type CaptureWorkbench = (
  request?: WorkbenchPictureRequest,
) => Promise<WorkbenchPicture>;

let captureWorkbench: CaptureWorkbench | undefined;

export function bindCapture(capture: CaptureWorkbench): void {
  captureWorkbench = capture;
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
      title: 'product.capture.title',
      icon: 'testbedDocument',
      shortcut: 'mod+alt+p',
      run: async () => {
        if (!captureWorkbench) {
          return;
        }
        const picture = await captureWorkbench();
        ctx.ui.open(CaptureDialog, {
          data: picture,
          title: 'product.capture.title',
          size: 'xl',
          maximizable: true,
        });
      },
    });
  },
};
