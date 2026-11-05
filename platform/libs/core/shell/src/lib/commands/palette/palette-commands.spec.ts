import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { DialogService } from '../../dialog/dialog.service';
import { PALETTE_COMMAND_ID, QUICK_OPEN_COMMAND_ID } from './command-palette';
import {
  registerPaletteCommand,
  registerQuickOpenCommand,
} from './palette-commands';

function setup() {
  TestBed.configureTestingModule({});
  const registry = TestBed.inject(ContributionRegistry);
  const dialogs = TestBed.inject(DialogService);
  registerPaletteCommand(registry, dialogs);
  registerQuickOpenCommand(registry, dialogs);
  const ask = (id: string): void => {
    void registry
      .commands()
      .find((command) => command.id === id)
      ?.run({});
  };
  return { dialogs, ask };
}

describe('asking for the search', () => {
  it.each([PALETTE_COMMAND_ID, QUICK_OPEN_COMMAND_ID])(
    'does not stack a second one while %s is open',
    (id) => {
      const { dialogs, ask } = setup();

      ask(id);
      ask(id);

      expect(dialogs.dialogs()).toHaveLength(1);
    },
  );

  it('opens it again once it was closed', async () => {
    const { dialogs, ask } = setup();
    ask(PALETTE_COMMAND_ID);
    const first = dialogs.dialogs()[0].ref;

    first.close();
    await first.closed;
    await Promise.resolve();
    ask(PALETTE_COMMAND_ID);

    expect(dialogs.dialogs()).toHaveLength(1);
    expect(dialogs.dialogs()[0].ref).not.toBe(first);
  });
});
