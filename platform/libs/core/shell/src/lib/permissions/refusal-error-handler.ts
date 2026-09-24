import { ErrorHandler, inject, Injectable } from '@angular/core';
import { CapabilityRefusalReporter } from './capability-refusal';

@Injectable()
export class CapabilityRefusalErrorHandler extends ErrorHandler {
  private readonly refusals = inject(CapabilityRefusalReporter);

  override handleError(error: unknown): void {
    if (this.refusals.report(error)) {
      return;
    }
    super.handleError(error);
  }
}
