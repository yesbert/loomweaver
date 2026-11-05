import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogOutlet } from '../../dialog/dialog-outlet';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
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

describe('asking for the other search while one is open', () => {
  afterEach(() => document.body.replaceChildren());

  function tick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function bothAsked() {
    TestBed.configureTestingModule({
      imports: [
        DialogOutlet,
        TranslocoTestingModule.forRoot({
          langs: { en: { dialog: { close: 'Close' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        {
          provide: ContentTabsService,
          useValue: { quickOpenTargets: signal([]), revealContentTab: () => undefined },
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    const dialogs = TestBed.inject(DialogService);
    registerPaletteCommand(registry, dialogs);
    registerQuickOpenCommand(registry, dialogs);
    const fixture = TestBed.createComponent(DialogOutlet);
    const opener = document.createElement('button');
    document.body.append(opener, fixture.nativeElement as HTMLElement);
    const settle = async (): Promise<void> => {
      fixture.detectChanges();
      await tick();
      fixture.detectChanges();
      await tick();
    };
    const ask = async (id: string): Promise<void> => {
      void registry
        .commands()
        .find((command) => command.id === id)
        ?.run({});
      await settle();
    };
    opener.focus();
    await ask(PALETTE_COMMAND_ID);
    await ask(QUICK_OPEN_COMMAND_ID);
    return { dialogs, opener, ask, settle };
  }

  it('replaces the open one instead of stacking a second dialog', async () => {
    const { dialogs } = await bothAsked();

    expect(dialogs.dialogs().map((dialog) => dialog.title)).toEqual([
      'palette.quickOpenTitle',
    ]);
  });

  it('gives the keyboard back to where the first was opened from when the second closes', async () => {
    const { dialogs, opener, settle } = await bothAsked();

    dialogs.dialogs()[0].ref.close();
    await settle();

    expect(dialogs.dialogs()).toEqual([]);
    expect(document.activeElement).toBe(opener);
  });

  it('opens the first again when it is asked for after the swap', async () => {
    const { dialogs, ask } = await bothAsked();

    await ask(PALETTE_COMMAND_ID);

    expect(dialogs.dialogs().map((dialog) => dialog.title)).toEqual(['palette.title']);
  });
});
