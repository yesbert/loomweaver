import { TestBed } from '@angular/core/testing';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../dialog/dialog.service';
import { RetentionCandidates } from '../../regions/pane/retention/retention-candidates';
import { PluginDisableGuard } from './plugin-disable-guard';
import { PluginEnablementService } from './plugin-enablement.service';

class DirtyProbe implements DirtySurface {
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

describe('PluginDisableGuard (programmatic destruction)', () => {
  let setEnabled: ReturnType<typeof vi.fn>;
  let candidates: unknown[];

  function setup(): PluginDisableGuard {
    setEnabled = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RetentionCandidates,
          useValue: { ofPlugin: () => candidates },
        },
        { provide: PluginEnablementService, useValue: { setEnabled } },
      ],
    });
    return TestBed.inject(PluginDisableGuard);
  }

  function checkbox(checked: boolean): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    return input;
  }

  it('enables immediately and disables synchronously when nothing is dirty', () => {
    candidates = [{}];
    const guard = setup();

    guard.toggle('testbed', checkbox(true));
    expect(setEnabled).toHaveBeenCalledWith('testbed', true);

    guard.toggle('testbed', checkbox(false));
    expect(setEnabled).toHaveBeenCalledWith('testbed', false);
  });

  it('cancelling the unsaved-changes ask keeps the plugin enabled and reverts the switch', async () => {
    candidates = [new DirtyProbe()];
    const guard = setup();
    const input = checkbox(false);

    guard.toggle('testbed', input);
    expect(setEnabled).not.toHaveBeenCalled();
    topDialog().ref.close('cancel');
    await settle();

    expect(setEnabled).not.toHaveBeenCalled();
    expect(input.checked).toBe(true);
  });

  it('discarding proceeds with the disable', async () => {
    candidates = [new DirtyProbe()];
    const guard = setup();

    guard.toggle('testbed', checkbox(false));
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
