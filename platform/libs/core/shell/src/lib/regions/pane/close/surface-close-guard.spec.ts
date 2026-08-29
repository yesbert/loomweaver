import { TestBed } from '@angular/core/testing';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../../dialog/dialog.service';
import { NotificationService } from '../../../notifications/notification.service';
import {
  BEFORE_CLOSE_TIMEOUT_MS,
  SurfaceCloseGuard,
} from './surface-close-guard';

class Probe implements DirtySurface {
  dirty = true;
  saveCalls = 0;
  saveFails = false;

  surfaceDirty(): boolean {
    return this.dirty;
  }

  surfaceSave(): Promise<void> {
    this.saveCalls += 1;
    if (this.saveFails) {
      return Promise.reject(new Error('save failed'));
    }
    this.dirty = false;
    return Promise.resolve();
  }
}

class SaveLessProbe implements DirtySurface {
  surfaceDirty(): boolean {
    return true;
  }
}

function topDialog() {
  const dialogs = TestBed.inject(DialogService).dialogs();
  return dialogs[dialogs.length - 1];
}

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('SurfaceCloseGuard', () => {
  it('proceeds synchronously without a dialog when nothing is dirty', () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();

    guard.guarded([{}, new SaveLessProbe(), undefined], proceed);

    expect(proceed).not.toHaveBeenCalled();

    const clean = new Probe();
    clean.dirty = false;
    guard.guarded([clean], proceed);

    expect(proceed).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(DialogService).dialogs().length).toBeGreaterThan(0);
  });

  it('Discard proceeds, Cancel and dismissing abort', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();

    guard.guarded([new Probe()], proceed);
    topDialog().ref.close('discard');
    await settle();
    expect(proceed).toHaveBeenCalledTimes(1);

    guard.guarded([new Probe()], proceed);
    topDialog().ref.close('cancel');
    await settle();
    expect(proceed).toHaveBeenCalledTimes(1);

    guard.guarded([new Probe()], proceed);
    topDialog().ref.close(undefined);
    await settle();
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('Save saves every dirty instance and proceeds once clean', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();
    const probe = new Probe();

    guard.guarded([probe, probe], proceed);
    const dialog = topDialog();
    expect(dialog.buttons.map((button) => button.label)).toEqual([
      'dialog.cancel',
      'retention.discard',
      'retention.save',
    ]);

    dialog.ref.close('save');
    await settle();

    expect(probe.saveCalls).toBe(1);
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('a failed save aborts the close, keeps the instance and reports visibly', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();
    const probe = new Probe();
    probe.saveFails = true;

    guard.guarded([probe], proceed);
    topDialog().ref.close('save');
    await settle();

    expect(proceed).not.toHaveBeenCalled();
    expect(probe.dirty).toBe(true);
    expect(
      TestBed.inject(NotificationService)
        .notifications()
        .map((toast) => toast.message),
    ).toContain('retention.saveFailed');
  });

  it('a save that resolves but stays dirty aborts the close and reports visibly', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();
    const probe = new Probe();
    probe.surfaceSave = () => {
      probe.saveCalls += 1;
      return Promise.resolve();
    };

    guard.guarded([probe], proceed);
    topDialog().ref.close('save');
    await settle();

    expect(probe.saveCalls).toBe(1);
    expect(proceed).not.toHaveBeenCalled();
    expect(
      TestBed.inject(NotificationService)
        .notifications()
        .map((toast) => toast.message),
    ).toContain('retention.stillDirty');
  });

  it('offers no Save button when a dirty instance cannot save', () => {
    const guard = TestBed.inject(SurfaceCloseGuard);

    guard.guarded([new SaveLessProbe()], vi.fn());

    expect(topDialog().buttons.map((button) => button.label)).toEqual([
      'dialog.cancel',
      'retention.discard',
    ]);
  });

  it('a beforeClose veto of false cancels the close without any host dialog', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();

    guard.guarded([new VetoProbe(false)], proceed);
    await settle();

    expect(proceed).not.toHaveBeenCalled();
    expect(TestBed.inject(DialogService).dialogs()).toHaveLength(0);

    guard.guarded([new VetoProbe(Promise.resolve(false))], proceed);
    await settle();

    expect(proceed).not.toHaveBeenCalled();
    expect(TestBed.inject(DialogService).dialogs()).toHaveLength(0);
  });

  it('a beforeClose veto of true lets a clean close proceed, and a throwing veto never blocks', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();

    guard.guarded([new VetoProbe(true)], proceed);
    await settle();
    expect(proceed).toHaveBeenCalledTimes(1);

    const throwing = new VetoProbe(true);
    throwing.surfaceBeforeClose = () => {
      throw new Error('broken veto');
    };
    guard.guarded([throwing], proceed);
    await settle();
    expect(proceed).toHaveBeenCalledTimes(2);
  });

  it('an approved veto does not bypass the unsaved-changes dialog', async () => {
    const guard = TestBed.inject(SurfaceCloseGuard);
    const proceed = vi.fn();
    const probe = new VetoProbe(true);
    probe.dirty = true;

    guard.guarded([probe], proceed);
    await settle();

    expect(proceed).not.toHaveBeenCalled();
    const dialog = topDialog();
    expect(dialog.buttons.map((button) => button.label)).toEqual([
      'dialog.cancel',
      'retention.discard',
    ]);
    dialog.ref.close('discard');
    await settle();
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it('a hung veto gets the escape dialog and "Close anyway" proceeds', async () => {
    vi.useFakeTimers();
    try {
      const guard = TestBed.inject(SurfaceCloseGuard);
      const proceed = vi.fn();

      guard.guarded(
        [new VetoProbe(new Promise<boolean>(() => undefined))],
        proceed,
      );
      await vi.advanceTimersByTimeAsync(BEFORE_CLOSE_TIMEOUT_MS - 1);
      expect(TestBed.inject(DialogService).dialogs()).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(1);
      const dialog = topDialog();
      expect(dialog.buttons.map((button) => button.label)).toEqual([
        'dialog.cancel',
        'retention.closeAnyway',
      ]);

      dialog.ref.close('force');
      await vi.advanceTimersByTimeAsync(0);
      expect(proceed).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a veto that settles while the escape dialog is open wins over it', async () => {
    vi.useFakeTimers();
    try {
      const guard = TestBed.inject(SurfaceCloseGuard);
      const proceed = vi.fn();
      let answer: ((approved: boolean) => void) | undefined;

      guard.guarded(
        [new VetoProbe(new Promise<boolean>((resolve) => (answer = resolve)))],
        proceed,
      );
      await vi.advanceTimersByTimeAsync(BEFORE_CLOSE_TIMEOUT_MS);
      expect(TestBed.inject(DialogService).dialogs()).toHaveLength(1);

      answer?.(false);
      await vi.advanceTimersByTimeAsync(0);

      expect(proceed).not.toHaveBeenCalled();
      expect(TestBed.inject(DialogService).dialogs()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

class VetoProbe implements DirtySurface {
  dirty = false;

  constructor(private readonly result: boolean | Promise<boolean>) {}

  surfaceDirty(): boolean {
    return this.dirty;
  }

  surfaceBeforeClose(): boolean | Promise<boolean> {
    return this.result;
  }
}
