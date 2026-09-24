import { inject, Service } from '@angular/core';
import { UnsavedWork } from '../../regions/pane/unsaved-work/unsaved-work';
import { SurfaceCloseGuard } from '../../regions/pane/unsaved-work/surface-close-guard';
import { PluginEnablementService } from './plugin-enablement.service';

@Service()
export class PluginDisableGuard {
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly enablement = inject(PluginEnablementService);

  requestEnabled(id: string, enabled: boolean): Promise<boolean> {
    const candidates = enabled ? [] : this.unsavedWork.instancesOfPlugin(id);
    if (enabled || !this.closeGuard.anyDirty(candidates)) {
      this.enablement.setEnabled(id, enabled);
      return Promise.resolve(true);
    }
    return this.closeGuard.confirmDiscard(candidates).then((ok) => {
      if (ok) {
        this.enablement.setEnabled(id, false);
      }
      return ok;
    });
  }

  confirmRemoval(id: string): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.unsavedWork.instancesOfPlugin(id),
    );
  }
}
