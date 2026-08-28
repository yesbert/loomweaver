import { inject, Service } from '@angular/core';
import { DialogButton, DirtySurface } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../../dialog/dialog.service';
import { NotificationService } from '../../../notifications/notification.service';
import { CloseVetoDialog } from './close-veto-dialog';
import { UnsavedChangesDialog } from './unsaved-changes-dialog';
import {
  beforeCloseOf,
  dirtySurfaceOf,
  instanceDirty,
} from '../retention/retention-policy';

type CloseChoice = 'save' | 'discard' | 'cancel';

type VetoHook = () => boolean | Promise<boolean>;

export const BEFORE_CLOSE_TIMEOUT_MS = 5000;

@Service()
export class SurfaceCloseGuard {
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationService);

  anyDirty(candidates: readonly unknown[]): boolean {
    return candidates.some((candidate) => instanceDirty(candidate));
  }

  guarded(candidates: readonly unknown[], proceed: () => void): void {
    if (
      !this.anyDirty(candidates) &&
      this.vetoHooksOf(candidates).length === 0
    ) {
      proceed();
      return;
    }
    void this.confirmClose(candidates).then((ok) => {
      if (ok) {
        proceed();
      }
    });
  }

  async confirmClose(candidates: readonly unknown[]): Promise<boolean> {
    for (const hook of this.vetoHooksOf(candidates)) {
      if (!(await this.veto(hook))) {
        return false;
      }
    }
    return this.confirmDiscard(candidates);
  }

  async confirmDiscard(candidates: readonly unknown[]): Promise<boolean> {
    const dirty = this.dirtyOf(candidates);
    if (dirty.length === 0) {
      return true;
    }
    const savable = dirty.every(
      (surface) => typeof surface.surfaceSave === 'function',
    );
    const choice = await this.ask(savable);
    if (choice === 'discard') {
      return true;
    }
    if (choice !== 'save') {
      return false;
    }
    return this.saveAll(dirty);
  }

  private vetoHooksOf(candidates: readonly unknown[]): VetoHook[] {
    const hooks: VetoHook[] = [];
    for (const candidate of new Set(candidates)) {
      const hook = beforeCloseOf(candidate);
      if (hook) {
        hooks.push(hook);
      }
    }
    return hooks;
  }

  private async veto(hook: VetoHook): Promise<boolean> {
    let result: boolean | Promise<boolean>;
    try {
      result = hook();
    } catch (error) {
      console.error('surfaceBeforeClose() threw — closing anyway', error);
      return true;
    }
    if (typeof result === 'boolean') {
      return result;
    }
    const settled = result.then(
      (value) => value !== false,
      (error: unknown) => {
        console.error('surfaceBeforeClose() rejected — closing anyway', error);
        return true;
      },
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), BEFORE_CLOSE_TIMEOUT_MS);
    });
    try {
      const outcome = await Promise.race([settled, timeout]);
      if (outcome !== 'timeout') {
        return outcome;
      }
      return await this.closeAnyway(settled);
    } finally {
      clearTimeout(timer);
    }
  }

  private closeAnyway(settled: Promise<boolean>): Promise<boolean> {
    const ref = this.dialogs.open<'force' | 'keep'>(CloseVetoDialog, {
      title: 'retention.vetoPendingTitle',
      tone: 'warning',
      buttons: [
        { label: 'dialog.cancel', value: 'keep' },
        { label: 'retention.closeAnyway', variant: 'danger', value: 'force' },
      ],
    });
    void settled.then((approved) => ref.close(approved ? 'force' : 'keep'));
    return ref.closed.then((choice) => choice === 'force');
  }

  private dirtyOf(candidates: readonly unknown[]): DirtySurface[] {
    const dirty = new Set<DirtySurface>();
    for (const candidate of candidates) {
      const surface = dirtySurfaceOf(candidate);
      if (surface && instanceDirty(candidate)) {
        dirty.add(surface);
      }
    }
    return [...dirty];
  }

  private ask(savable: boolean): Promise<CloseChoice> {
    const buttons: DialogButton[] = [
      { label: 'dialog.cancel', value: 'cancel' },
      { label: 'retention.discard', variant: 'danger', value: 'discard' },
    ];
    if (savable) {
      buttons.push({
        label: 'retention.save',
        variant: 'primary',
        value: 'save',
      });
    }
    const ref = this.dialogs.open<CloseChoice>(UnsavedChangesDialog, {
      title: 'retention.unsavedTitle',
      tone: 'warning',
      buttons,
    });
    return ref.closed.then((choice) => choice ?? 'cancel');
  }

  private async saveAll(dirty: readonly DirtySurface[]): Promise<boolean> {
    try {
      await Promise.all(dirty.map((surface) => surface.surfaceSave?.()));
    } catch (error) {
      console.error('Save before closing failed', error);
      this.notifications.show({
        message: 'retention.saveFailed',
        kind: 'warning',
      });
      return false;
    }
    if (this.anyDirty([...dirty])) {
      console.error('surfaceSave resolved but the surface still reports dirty');
      this.notifications.show({
        message: 'retention.stillDirty',
        kind: 'warning',
      });
      return false;
    }
    return true;
  }
}
