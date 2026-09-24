import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogOutlet } from './dialog-outlet';
import { DialogRef } from './dialog-ref';
import { DialogService } from './dialog.service';

@Component({ template: '<button type="button">Inside</button>' })
class Body {
  readonly ref = inject(DialogRef);
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
  });
  const service = TestBed.inject(DialogService);
  const fixture = TestBed.createComponent(DialogOutlet);
  const host = fixture.nativeElement as HTMLElement;
  const opener = document.createElement('button');
  opener.textContent = 'Open';
  document.body.append(opener);

  function open(): DialogRef {
    opener.focus();
    const ref = service.open(Body, { title: 't' });
    fixture.detectChanges();
    return ref;
  }

  async function settled(ref: DialogRef): Promise<void> {
    await ref.closed;
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  return { host, opener, open, settled, fixture };
}

describe('a closed dialog gives the focus back', () => {
  afterEach(() => document.body.replaceChildren());

  it('returns the focus to the opener when the body asks for the close', async () => {
    const t = setup();
    const ref = t.open();

    await ref.requestClose();
    await t.settled(ref);

    expect(document.activeElement).toBe(t.opener);
  });

  it('returns the focus to the opener when Escape closes the dialog', async () => {
    const t = setup();
    const ref = t.open();
    expect(document.activeElement).not.toBe(t.opener);

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    await t.settled(ref);

    expect(t.host.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(t.opener);
  });

  it('returns the focus to the opener when the close control closes the dialog', async () => {
    const t = setup();
    const ref = t.open();

    t.host
      .querySelector<HTMLButtonElement>('dialog button[aria-label="Close"]')
      ?.click();
    await t.settled(ref);

    expect(document.activeElement).toBe(t.opener);
  });

  it('returns the focus to the opener when the content closes the dialog', async () => {
    const t = setup();
    const ref = t.open();

    ref.close('done');
    await t.settled(ref);

    expect(document.activeElement).toBe(t.opener);
  });

  it('leaves the focus alone when the opener has left the page', async () => {
    const t = setup();
    const ref = t.open();
    t.opener.remove();

    ref.close();
    await t.settled(ref);

    expect(document.activeElement).not.toBe(t.opener);
  });
});
