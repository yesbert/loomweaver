import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogOutlet } from './dialog-outlet';
import { DialogService } from './dialog.service';

@Component({ template: '' })
class EmptyBody {}

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        dialog: { ok: 'OK', cancel: 'Cancel', close: 'Close' },
        progress: { busy: 'Working' },
        guard: { label: 'Type ok', err: 'must be ok' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function setup() {
  TestBed.configureTestingModule({
    imports: [DialogOutlet, transloco()],
    providers: [],
  });
  const service = TestBed.inject(DialogService);
  const fixture = TestBed.createComponent(DialogOutlet);
  return { service, fixture };
}

describe('DialogOutlet confirm guard', () => {
  it('keeps confirm disabled + shows the error until the guard validates', () => {
    const { service, fixture } = setup();
    void service.confirm({
      message: 'x',
      tone: 'danger',
      confirmLabel: 'dialog.ok',
      requireConfirmation: {
        label: 'guard.label',
        validate: (value) => (value === 'ok' ? null : 'guard.err'),
      },
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const confirm = [...host.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'OK',
    ) as HTMLButtonElement;
    const input = host.querySelector('input') as HTMLInputElement;

    expect(confirm.disabled).toBe(true);

    input.value = 'bad';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(true);
    expect(host.textContent).toContain('must be ok');

    input.value = 'ok';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(false);
    expect(host.textContent).not.toContain('must be ok');
  });

  it('cycles focus within the panel (Tab wraps last→first, Shift+Tab first→last)', () => {
    const { service, fixture } = setup();
    void service.confirm({
      message: 'x',
      confirmLabel: 'dialog.ok',
      cancelLabel: 'dialog.cancel',
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const buttons = [...host.querySelectorAll('button')];
    const cancel = buttons.find(
      (b) => b.textContent?.trim() === 'Cancel',
    ) as HTMLButtonElement;
    const confirm = buttons.find(
      (b) => b.textContent?.trim() === 'OK',
    ) as HTMLButtonElement;

    confirm.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(cancel);

    cancel.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(confirm);
  });

  it('blocks silently when validate returns an empty string', () => {
    const { service, fixture } = setup();
    void service.confirm({
      message: 'x',
      confirmLabel: 'dialog.ok',
      requireConfirmation: {
        label: 'guard.label',
        validate: (value) => (value === 'ok' ? null : ''),
      },
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const confirm = [...host.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'OK',
    ) as HTMLButtonElement;
    const input = host.querySelector('input') as HTMLInputElement;

    input.value = 'bad';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(true);
    expect(host.querySelector('p.text-negative')).toBeNull();
  });
});

describe('DialogOutlet vertical anchor', () => {
  it('centers a dialog by default and pins a top-aligned one to the top edge', () => {
    const { service, fixture } = setup();
    void service.alert({ message: 'centered' });
    service.open(EmptyBody, { bare: true, align: 'top' });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const wrappers = [
      ...host.querySelectorAll<HTMLElement>('div.fixed.inset-0'),
    ];
    expect(wrappers).toHaveLength(2);

    expect(wrappers[0].className).toContain('items-end');
    expect(wrappers[0].className).toContain('sm:items-center');
    expect(wrappers[0].className).not.toContain('items-start');

    expect(wrappers[1].className).toContain('items-start');
    expect(wrappers[1].className).toContain('pt-[8vh]');
    expect(wrappers[1].className).toContain('sm:pt-[12vh]');
    expect(wrappers[1].className).not.toContain('items-end');
    expect(wrappers[1].className).not.toContain('sm:items-center');
  });
});
