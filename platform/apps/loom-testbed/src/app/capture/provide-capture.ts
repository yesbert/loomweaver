import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { WorkbenchCaptureService, WorkbenchPictureRequest } from '@loomweaver/shell';
import { bindCapture } from './testbed-capture-plugin';

export function provideTestbedCapture(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const service = inject(WorkbenchCaptureService);
    const capture = (request?: WorkbenchPictureRequest) => service.capture(request);
    bindCapture(capture);
    Object.defineProperty(globalThis, 'lwCapture', {
      configurable: true,
      value: capture,
    });
  });
}
