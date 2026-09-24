import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogDismiss, DirtySurface } from '@loomweaver/plugin-sdk';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { DIALOG_CLOSE_GUARD } from './dialog-close-guard';
import { DialogOutlet } from './dialog-outlet';
import { DialogRef } from './dialog-ref';
import { DialogService } from './dialog.service';

@Component({ template: '' })
class CleanBody {}

@Component({ template: '' })
class UnsavedBody implements DirtySurface {
  surfaceDirty(): boolean {
    return true;
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

@Component({ template: '' })
class VetoingBody implements DirtySurface {
  surfaceBeforeClose(): boolean {
    return false;
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

  function open(
    component: new (...args: never[]) => unknown,
    dismiss?: DialogDismiss,
  ): DialogRef {
    const ref = service.open(component, { title: 't', dismiss });
    fixture.detectChanges();
    return ref;
  }

  function body<T>(type: new (...args: never[]) => T): T {
    return fixture.debugElement.query(
      (node) => node.componentInstance instanceof type,
    ).componentInstance as T;
  }

  function question(): number {
    return service
      .dialogs()
      .filter((dialog) => dialog.title === 'retention.unsavedTitle').length;
  }

  function answer(choice: 'save' | 'discard' | 'cancel'): void {
    service.dialogs().at(-1)?.ref.close(choice);
  }

  return { service, open, body, question, answer };
}

describe("a dialog's content asks for the close the person would make", () => {
  it('asks the close control question while work is unsaved, and discard closes', async () => {
    const t = setup();
    const ref = t.open(UnsavedBody);

    const outcome = ref.requestClose();
    expect(t.question()).toBe(1);
    t.answer('discard');

    await expect(outcome).resolves.toBe(true);
  });

  it('keeps the dialog when the person cancels, and says so', async () => {
    const t = setup();
    const ref = t.open(UnsavedBody);
    let closed = false;
    void ref.closed.then(() => (closed = true));

    const outcome = ref.requestClose();
    t.answer('cancel');

    await expect(outcome).resolves.toBe(false);
    expect(closed).toBe(false);
  });

  it('closes clean content at once, without a question', async () => {
    const t = setup();
    const ref = t.open(CleanBody);

    await expect(ref.requestClose()).resolves.toBe(true);
    expect(t.question()).toBe(0);
  });

  it('closes after a successful save, and stays open where the save fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const t = setup();
    const ref = t.open(SavingBody);
    t.body(SavingBody).saveFails = true;

    const failed = ref.requestClose();
    expect(t.service.dialogs().at(-1)?.buttons.map((b) => b.value)).toContain(
      'save',
    );
    t.answer('save');
    await expect(failed).resolves.toBe(false);

    t.body(SavingBody).saveFails = false;
    const saved = ref.requestClose();
    t.answer('save');
    await expect(saved).resolves.toBe(true);
  });

  it('keeps the dialog where the veto holds', async () => {
    const t = setup();
    const ref = t.open(VetoingBody);

    await expect(ref.requestClose()).resolves.toBe(false);
  });

  it('is handled like the close control where the person has no way of closing', async () => {
    const t = setup();
    const ref = t.open(UnsavedBody, 'none');

    const outcome = ref.requestClose();
    expect(t.question()).toBe(1);
    t.answer('discard');

    await expect(outcome).resolves.toBe(true);
  });

  it('asks once for two requests while the question is open', async () => {
    const t = setup();
    const ref = t.open(UnsavedBody);

    const first = ref.requestClose();
    const second = ref.requestClose();
    expect(t.question()).toBe(1);
    t.answer('discard');

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
  });
});

describe('a dialog handle with no host behind it', () => {
  it('closes on a request and says it did', async () => {
    const ref = new DialogRef();
    let closed = false;
    void ref.closed.then(() => (closed = true));

    await expect(ref.requestClose()).resolves.toBe(true);
    expect(closed).toBe(true);
  });
});
