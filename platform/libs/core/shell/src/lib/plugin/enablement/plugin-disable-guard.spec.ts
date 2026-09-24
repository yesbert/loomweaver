import { TestBed } from '@angular/core/testing';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../dialog/dialog.service';
import { UnsavedWork } from '../../regions/pane/unsaved-work/unsaved-work';
import { PluginDisableGuard } from './plugin-disable-guard';
import { PluginEnablementService } from './plugin-enablement.service';

class DirtyProbe implements DirtySurface {
  surfaceDirty(): boolean {
    return true;
  }
}

function topDialog() {
  const dialogs = TestBed.inject(DialogService).dialogs();
  const top = dialogs.at(-1);
  if (!top) {
    throw new Error('expected a dialog to be open');
  }
  return top;
}

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('PluginDisableGuard (programmatic destruction)', () => {
  let setEnabled: ReturnType<typeof vi.fn>;
  let candidates: unknown[];

  function setup(): PluginDisableGuard {
    setEnabled = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UnsavedWork,
          useValue: { instancesOfPlugin: () => candidates },
        },
        { provide: PluginEnablementService, useValue: { setEnabled } },
      ],
    });
    return TestBed.inject(PluginDisableGuard);
  }

  it('enables immediately and disables synchronously when nothing is dirty', () => {
    candidates = [{}];
    const guard = setup();

    void guard.requestEnabled('testbed', true);
    expect(setEnabled).toHaveBeenCalledWith('testbed', true);

    void guard.requestEnabled('testbed', false);
    expect(setEnabled).toHaveBeenCalledWith('testbed', false);
  });

  it('cancelling the unsaved-changes ask keeps the plugin enabled and reports it, so the switch reverts', async () => {
    candidates = [new DirtyProbe()];
    const guard = setup();

    const changed = guard.requestEnabled('testbed', false);
    expect(setEnabled).not.toHaveBeenCalled();
    topDialog().ref.close('cancel');
    await settle();

    expect(setEnabled).not.toHaveBeenCalled();
    await expect(changed).resolves.toBe(false);
  });

  it('discarding proceeds with the disable', async () => {
    candidates = [new DirtyProbe()];
    const guard = setup();

    void guard.requestEnabled('testbed', false);
    topDialog().ref.close('discard');
    await settle();

    expect(setEnabled).toHaveBeenCalledWith('testbed', false);
  });

  it('confirmRemoval asks for the plugin instances and reports the answer', async () => {
    candidates = [new DirtyProbe()];
    const guard = setup();

    const pending = guard.confirmRemoval('testbed');
    topDialog().ref.close('discard');

    await expect(pending).resolves.toBe(true);
  });
});
