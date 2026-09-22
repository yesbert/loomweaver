import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogDismiss, DirtySurface } from '@loomweaver/plugin-sdk';
import {
  BEFORE_CLOSE_TIMEOUT_MS,
  SurfaceCloseGuard,
} from '../regions/pane/close/surface-close-guard';
import { defineLwSelect } from '../elements/select/lw-select.element';
import { DIALOG_CLOSE_GUARD } from './dialog-close-guard';
import { DialogOutlet } from './dialog-outlet';
import { DialogRef } from './dialog-ref';
import { DialogService } from './dialog.service';

@Component({ template: '' })
class CleanBody {}

@Component({ template: '' })
class UnsavedBody implements DirtySurface {
  dirty = true;

  surfaceDirty(): boolean {
    return this.dirty;
  }
}

@Component({ template: '' })
class SavingBody implements DirtySurface {
  dirty = true;
  saveFails = false;

  surfaceDirty(): boolean {
    return this.dirty;
  }

  surfaceSave(): Promise<void> {
    if (this.saveFails) {
      return Promise.reject(new Error('save failed'));
    }
    this.dirty = false;
    return Promise.resolve();
  }
}

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<lw-select label="Parent tag"
    ><lw-option value="a">A</lw-option><lw-option value="b">B</lw-option></lw-select
  >`,
})
class SelectBody implements DirtySurface {
  surfaceDirty(): boolean {
    return true;
  }
}

@Component({ template: '' })
class HangingVetoBody implements DirtySurface {
  surfaceBeforeClose(): Promise<boolean> {
    return new Promise<boolean>(() => undefined);
  }

  surfaceDirty(): boolean {
    return false;
  }
}

function setup() {
  TestBed.configureTestingModule({
    imports: [
      DialogOutlet,
      TranslocoTestingModule.forRoot({
        langs: { en: { dialog: { close: 'Close' } } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [{ provide: DIALOG_CLOSE_GUARD, useExisting: SurfaceCloseGuard }],
  });
  const service = TestBed.inject(DialogService);
  const fixture = TestBed.createComponent(DialogOutlet);
  const host = fixture.nativeElement as HTMLElement;

  function open(
    component: new (...args: never[]) => unknown,
    dismiss?: DialogDismiss,
    buttons?: { label: string; value?: unknown }[],
  ): { ref: DialogRef; closed: () => boolean } {
    const ref = service.open(component, { title: 't', dismiss, buttons });
    let settled = false;
    void ref.closed.then(() => (settled = true));
    fixture.detectChanges();
    return { ref, closed: () => settled };
  }

  function scrims(): HTMLButtonElement[] {
    return [...host.querySelectorAll<HTMLButtonElement>('button.lw-scrim')];
  }

  function closeControls(): HTMLButtonElement[] {
    return [
      ...host.querySelectorAll<HTMLButtonElement>('dialog button[aria-label="Close"]'),
    ];
  }

  function pressEscape(target: EventTarget = document): void {
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
  }

  function titles(): (string | undefined)[] {
    return service.dialogs().map((dialog) => dialog.title);
  }

  function answer(choice: 'save' | 'discard' | 'cancel'): void {
    service.dialogs().at(-1)?.ref.close(choice);
  }

  return { service, fixture, open, scrims, closeControls, pressEscape, titles, answer };
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('DialogOutlet: how the user may close a dialog', () => {
  it('keeps a dialog allowing only deliberate ways open on a click beside it, and closes it on Escape and the close control', async () => {
    const t = setup();

    const first = t.open(CleanBody, 'explicit');
    expect(t.scrims()[0].disabled).toBe(true);
    t.scrims()[0].click();
    await settle();
    expect(first.closed()).toBe(false);

    t.pressEscape();
    await settle();
    expect(first.closed()).toBe(true);

    const second = t.open(CleanBody, 'explicit');
    expect(t.closeControls()).toHaveLength(1);
    t.closeControls()[0].click();
    await settle();
    expect(second.closed()).toBe(true);
  });

  it('closes a dialog with nothing chosen on a click beside it', async () => {
    const t = setup();
    const dialog = t.open(CleanBody);

    t.scrims()[0].click();
    await settle();

    expect(dialog.closed()).toBe(true);
  });

  it('closes a dialog allowing no way only from code, and draws no close control', async () => {
    const t = setup();
    const dialog = t.open(CleanBody, 'none');
    expect(t.closeControls()).toHaveLength(0);

    t.scrims()[0].click();
    t.pressEscape();
    await settle();
    expect(dialog.closed()).toBe(false);

    dialog.ref.close();
    await settle();
    expect(dialog.closed()).toBe(true);
  });

  it('leaves declared buttons working whatever was chosen', async () => {
    const t = setup();
    const dialog = t.open(CleanBody, 'none', [{ label: 'Done', value: 'done' }]);

    const done = [...(t.fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Done',
    ) as HTMLButtonElement;
    done.click();

    await expect(dialog.ref.closed).resolves.toBe('done');
  });

  it('gives the convenience dialogs every way and progress none', () => {
    const t = setup();
    void t.service.confirm({ message: 'q' });
    void t.service.alert({ message: 'a' });
    void t.service.prompt({ message: 'p' });
    t.service.progress({ message: 'busy' });

    expect(t.service.dialogs().map((dialog) => dialog.dismiss)).toEqual([
      'any',
      'any',
      'any',
      'none',
    ]);
  });
});

describe('DialogOutlet: Escape closes only what it was pressed in', () => {
  beforeAll(() => defineLwSelect());

  it('leaves the dialog open for an Escape something inside already handled', async () => {
    const t = setup();
    const dialog = t.open(UnsavedBody, 'explicit');
    const body = t.fixture.nativeElement.querySelector('dialog') as HTMLElement;
    body.addEventListener('keydown', (event) => event.preventDefault());

    t.pressEscape(body);
    await settle();

    expect(dialog.closed()).toBe(false);
    expect(t.titles()).toEqual(['t']);
  });

  it('closes the open list of a select first, and the dialog on the next Escape', async () => {
    const t = setup();
    const dialog = t.open(SelectBody, 'explicit');
    const host = t.fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.lw-select-trigger') as HTMLButtonElement;

    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    t.pressEscape(host.querySelector('[role="listbox"]') as HTMLElement);
    await settle();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(dialog.closed()).toBe(false);
    expect(t.titles()).toEqual(['t']);

    t.pressEscape(trigger);
    await settle();

    expect(t.titles().at(-1)).toBe('retention.unsavedTitle');
  });
});

describe('DialogOutlet: a dialog holding unsaved work asks', () => {
  it('asks on the close control, Escape and a click beside it while work is unsaved', async () => {
    const t = setup();
    const dialog = t.open(UnsavedBody);

    t.closeControls()[0].click();
    expect(t.titles().at(-1)).toBe('retention.unsavedTitle');
    t.answer('cancel');
    await settle();
    expect(dialog.closed()).toBe(false);

    t.pressEscape();
    expect(t.titles().at(-1)).toBe('retention.unsavedTitle');
    t.answer('cancel');
    await settle();

    t.scrims()[0].click();
    expect(t.titles().at(-1)).toBe('retention.unsavedTitle');
    t.answer('discard');
    await settle();
    expect(dialog.closed()).toBe(true);
  });

  it('offers save only where the content can save', () => {
    const t = setup();
    t.open(UnsavedBody);
    t.closeControls()[0].click();
    expect(t.service.dialogs().at(-1)?.buttons.map((b) => b.value)).toEqual([
      'cancel',
      'discard',
    ]);
  });

  it('closes after a successful save and stays open when the save fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const t = setup();

    const failing = t.open(SavingBody);
    const failingBody = t.fixture.debugElement.query(
      (node) => node.componentInstance instanceof SavingBody,
    ).componentInstance as SavingBody;
    failingBody.saveFails = true;
    t.closeControls()[0].click();
    expect(t.service.dialogs().at(-1)?.buttons.map((b) => b.value)).toContain('save');
    t.answer('save');
    await settle();
    expect(failing.closed()).toBe(false);

    failingBody.saveFails = false;
    t.closeControls()[0].click();
    t.answer('save');
    await settle();
    expect(failing.closed()).toBe(true);
  });

  it('closes content reporting no unsaved work at once', async () => {
    const t = setup();
    const dialog = t.open(UnsavedBody);
    const body = t.fixture.debugElement.query(
      (node) => node.componentInstance instanceof UnsavedBody,
    ).componentInstance as UnsavedBody;
    body.dirty = false;

    t.closeControls()[0].click();

    expect(t.titles()).not.toContain('retention.unsavedTitle');
    await settle();
    expect(dialog.closed()).toBe(true);
  });

  it('closes content that reports nothing at once, by every allowed way', async () => {
    const t = setup();

    for (const dismiss of [
      () => t.pressEscape(),
      () => t.scrims().at(-1)?.click(),
      () => t.closeControls().at(-1)?.click(),
    ]) {
      const dialog = t.open(CleanBody);
      dismiss();
      expect(t.titles()).not.toContain('retention.unsavedTitle');
      await settle();
      t.fixture.detectChanges();
      expect(dialog.closed()).toBe(true);
    }
  });

  it('does not ask when the content closes its own dialog', async () => {
    const t = setup();
    const dialog = t.open(UnsavedBody);

    dialog.ref.close();
    await settle();

    expect(dialog.closed()).toBe(true);
    expect(t.titles()).not.toContain('retention.unsavedTitle');
  });

  it('offers to close anyway when the veto hangs', async () => {
    vi.useFakeTimers();
    try {
      const t = setup();
      t.open(HangingVetoBody);

      t.closeControls()[0].click();
      await vi.advanceTimersByTimeAsync(BEFORE_CLOSE_TIMEOUT_MS);

      expect(t.titles().at(-1)).toBe('retention.vetoPendingTitle');
    } finally {
      vi.useRealTimers();
    }
  });

  it('asks nothing for a way that is not allowed', async () => {
    const t = setup();
    const dialog = t.open(UnsavedBody, 'explicit');

    t.scrims()[0].click();
    await settle();

    expect(t.service.dialogs()).toHaveLength(1);
    expect(dialog.closed()).toBe(false);
  });

  it('closes on a declared button with a result without asking, and asks on one without', async () => {
    const t = setup();
    const host = t.fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...host.querySelectorAll('button')].find(
        (candidate) => candidate.textContent?.trim() === label,
      ) as HTMLButtonElement;

    const withResult = t.open(UnsavedBody, 'any', [{ label: 'Apply', value: 'apply' }]);
    button('Apply').click();
    await expect(withResult.ref.closed).resolves.toBe('apply');

    t.open(UnsavedBody, 'any', [{ label: 'Leave' }]);
    button('Leave').click();
    expect(t.titles().at(-1)).toBe('retention.unsavedTitle');
  });

  it('asks only once while a question is already open', () => {
    const t = setup();
    t.open(UnsavedBody);

    t.closeControls()[0].click();
    t.scrims()[0].click();

    expect(t.titles().filter((title) => title === 'retention.unsavedTitle')).toHaveLength(1);
  });
});
