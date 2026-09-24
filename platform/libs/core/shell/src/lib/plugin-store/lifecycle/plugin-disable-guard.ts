import { inject, Service } from '@angular/core';
import { UnsavedWork } from '../../regions/pane/unsaved-work/unsaved-work';
import { SurfaceCloseGuard } from '../../regions/pane/unsaved-work/surface-close-guard';
import { PluginEnablementService } from './plugin-enablement.service';

@Service()
export class PluginDisableGuard {
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly enablement = inject(PluginEnablementService);

  toggle(id: string, input: HTMLInputElement): void {
    if (input.checked) {
      this.enablement.setEnabled(id, true);
      return;
    }
    const candidates = this.unsavedWork.instancesOfPlugin(id);
    if (!this.closeGuard.anyDirty(candidates)) {
      this.enablement.setEnabled(id, false);
      return;
    }
    void this.closeGuard.confirmDiscard(candidates).then((ok) => {
      if (ok) {
        this.enablement.setEnabled(id, false);
      } else {
        input.checked = true;
      }
    });
  }

  confirmRemoval(id: string): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.unsavedWork.instancesOfPlugin(id),
    );
  }
}
