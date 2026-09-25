import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { SettingsDialog } from './settings-dialog';
import { SettingsService } from './settings.service';
import { SettingsSection } from './settings-model';
import { DialogRef } from '../dialog/dialog-ref';

@Component({
  selector: 'lw-probe',
  template: 'probe-control',
})
class ProbeControl {}

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        sec: { title: 'Section', row: 'Row', act: 'Act' },
        opt: { a: 'Alpha' },
        dialog: { close: 'Close' },
        settings: { title: 'Settings', empty: 'No settings available' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render(section?: SettingsSection) {
  TestBed.configureTestingModule({
    imports: [SettingsDialog, transloco()],
    providers: [{ provide: DialogRef, useValue: new DialogRef() }],
  });
  if (section) {
    TestBed.inject(SettingsService).register(section);
  }
  const fixture = TestBed.createComponent(SettingsDialog);
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('SettingsDialog', () => {
  it('shows the empty state when no section is registered', () => {
    const { host } = render();

    expect(host.textContent).toContain('No settings available');
  });

  it('renders a select control from a section', () => {
    const value = signal('a');
    const { host } = render({
      id: 'sec',
      title: 'sec.title',
      rows: [
        {
          id: 'sec.row',
          label: 'sec.row',
          control: {
            kind: 'select',
            options: [{ value: 'a', label: 'opt.a' }],
            value,
            set: (next) => value.set(next),
          },
        },
      ],
    });

    expect(host.querySelector('lw-select')).not.toBeNull();
    expect(host.querySelectorAll('lw-option')).toHaveLength(1);
    expect(host.textContent).toContain('Section');
  });

  it('runs a button control on click', () => {
    const run = vi.fn();
    const { host } = render({
      id: 'sec',
      title: 'sec.title',
      rows: [
        {
          id: 'sec.row',
          label: 'sec.row',
          control: { kind: 'button', label: 'sec.act', run },
        },
      ],
    });

    const button = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Act'),
    ) as HTMLButtonElement;
    button.click();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('embeds a component control', () => {
    const { host } = render({
      id: 'sec',
      title: 'sec.title',
      rows: [
        {
          id: 'sec.row',
          label: 'sec.row',
          control: { kind: 'component', component: ProbeControl },
        },
      ],
    });

    expect(host.textContent).toContain('probe-control');
  });

  it('marks the first section active on open without a click', () => {
    const value = signal('a');
    const row = {
      id: 'r',
      label: 'sec.row',
      control: {
        kind: 'select' as const,
        options: [{ value: 'a', label: 'opt.a' }],
        value,
        set: (next: string) => value.set(next),
      },
    };
    const { host } = render({ id: 'first', title: 'sec.title', rows: [row] });

    const navButton = host.querySelector('nav button') as HTMLButtonElement;
    expect(navButton.className).toContain('text-brand');
    expect(navButton.getAttribute('aria-current')).toBe('true');
  });

  it('drops a button row whose command nobody registered, and the section with it', () => {
    const { host } = render({
      id: 'sec',
      title: 'sec.title',
      rows: [
        {
          id: 'sec.row',
          label: 'sec.row',
          control: {
            kind: 'button',
            label: 'sec.act',
            command: 'shell.app.reset',
          },
        },
      ],
    });

    expect(host.textContent).toContain('No settings available');
    expect(host.querySelector('nav button')).toBeNull();
  });
});
