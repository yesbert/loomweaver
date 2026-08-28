import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';

@Component({ template: '' })
class DummyBody {}

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    service = TestBed.inject(DialogService);
  });

  it('confirm resolves true only when closed with true, and clears the stack', async () => {
    const yes = service.confirm({ message: 'x' });
    expect(service.dialogs().length).toBe(1);
    service.dialogs()[0].ref.close(true);
    await expect(yes).resolves.toBe(true);
    expect(service.dialogs().length).toBe(0);

    const no = service.confirm({ message: 'x' });
    service.dialogs()[0].ref.close(undefined);
    await expect(no).resolves.toBe(false);
  });

  it('prompt resolves the text, or null when dismissed', async () => {
    const text = service.prompt({ message: 'x' });
    service.dialogs()[0].ref.close('hi');
    await expect(text).resolves.toBe('hi');

    const cancelled = service.prompt({ message: 'x' });
    service.dialogs()[0].ref.close(undefined);
    await expect(cancelled).resolves.toBeNull();
  });

  it('derives the confirm button colour and icon from the tone', () => {
    service.confirm({ message: 'x', tone: 'danger' });
    const dialog = service.dialogs()[0];
    expect(dialog.icon).toBe('warning');
    expect(dialog.buttons.at(-1)?.variant).toBe('danger');
    expect(dialog.tone).toBe('danger');
  });

  it('shows no leading icon for the default tone', () => {
    service.confirm({ message: 'x' });
    expect(service.dialogs()[0].icon).toBeUndefined();
  });

  it('sets a validated guard input when requireConfirmation is given', () => {
    const validate = (value: string) => (value === 'Acme' ? null : 'nope');
    service.confirm({
      message: 'x',
      tone: 'danger',
      requireConfirmation: { label: 'Type Acme', validate },
    });
    const dialog = service.dialogs()[0];
    expect(dialog.requireValidate).toBe(validate);
    expect(dialog.requireValidate?.('Acme')).toBeNull();
    expect(dialog.requireValidate?.('nope')).toBe('nope');
    expect(dialog.promptValue?.()).toBe('');
    expect(dialog.buttons.at(-1)?.autofocus).toBe(false);
  });

  it('alert resolves once acknowledged', async () => {
    const done = service.alert({ message: 'x' });
    expect(service.dialogs()[0].buttons.length).toBe(1);
    service.dialogs()[0].ref.close();
    await expect(done).resolves.toBeUndefined();
  });

  it('progress shows a non-dismissable dialog whose text updates and closes on demand', async () => {
    const handle = service.progress({ message: 'Saving…' });
    const dialog = service.dialogs()[0];
    expect(dialog.kind).toBe('progress');
    expect(dialog.dismissable).toBe(false);
    expect(dialog.buttons.length).toBe(0);
    expect(dialog.progressMessage?.()).toBe('Saving…');

    handle.update('Almost done…');
    expect(dialog.progressMessage?.()).toBe('Almost done…');

    handle.close();
    await Promise.resolve();
    expect(service.dialogs().length).toBe(0);
  });

  it('withProgress auto-closes the dialog once the work settles (also on failure)', async () => {
    await service.withProgress({ message: 'x' }, Promise.resolve('ok'));
    expect(service.dialogs().length).toBe(0);

    await expect(
      service.withProgress({ message: 'x' }, Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    expect(service.dialogs().length).toBe(0);
  });

  it('open mounts a custom body and resolves with the close result', async () => {
    const ref = service.open<string>(DummyBody, {
      data: 42,
      buttons: [{ label: 'x', value: 'picked' }],
    });
    const instance = service.dialogs()[0];
    expect(instance.component).toBe(DummyBody);
    expect(instance.injector).toBeDefined();
    expect(ref.data).toBe(42);

    ref.close('picked');
    await expect(ref.closed).resolves.toBe('picked');
    expect(service.dialogs().length).toBe(0);
  });
});
