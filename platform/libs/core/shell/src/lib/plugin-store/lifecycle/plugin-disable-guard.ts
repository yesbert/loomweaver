import { inject, Service } from '@angular/core';
import { RetentionCandidates } from '../../regions/pane/retention/retention-candidates';
import { SurfaceCloseGuard } from '../../regions/pane/close/surface-close-guard';
import { PluginEnablementService } from './plugin-enablement.service';

@Service()
export class PluginDisableGuard {
  private readonly candidates = inject(RetentionCandidates);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly enablement = inject(PluginEnablementService);

  toggle(id: string, input: HTMLInputElement): void {
    if (input.checked) {
      this.enablement.setEnabled(id, true);
      return;
    }
    const candidates = this.candidates.ofPlugin(id);
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
    return this.closeGuard.confirmDiscard(this.candidates.ofPlugin(id));
  }
}
