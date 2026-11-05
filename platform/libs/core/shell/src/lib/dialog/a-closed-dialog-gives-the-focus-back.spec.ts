import { DialogRef } from '@loomweaver/plugin-sdk';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogOutlet } from './dialog-outlet';
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

  function openFromInside(): DialogRef {
    const inside = [...host.querySelectorAll<HTMLButtonElement>('dialog button')].at(-1);
    inside?.focus();
    const ref = service.open(Body, { title: 'upper' });
    fixture.detectChanges();
    return ref;
  }

  return { host, opener, open, openFromInside, settled, fixture };
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

  it('returns the focus to the first opener when a dialog opened from inside another outlives it', async () => {
    const t = setup();
    const lower = t.open();
    const upper = t.openFromInside();

    lower.close();
    await t.settled(lower);
    expect(t.host.querySelectorAll('dialog')).toHaveLength(1);
    upper.close();
    await t.settled(upper);

    expect(document.activeElement).toBe(t.opener);
  });

  it('leaves the focus in the upper dialog while the lower one closes under it', async () => {
    const t = setup();
    const lower = t.open();
    t.openFromInside();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const held = [...t.host.querySelectorAll('dialog')[1].querySelectorAll('button')].at(-1) as HTMLElement;
    held.focus();

    lower.close();
    await t.settled(lower);

    expect(document.activeElement).toBe(held);
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
