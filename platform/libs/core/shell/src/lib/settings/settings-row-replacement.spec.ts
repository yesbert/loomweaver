import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { SettingRow, SettingsSection } from './settings-model';

function row(id: string, label = `${id}.label`): SettingRow {
  const value = signal(false);
  return {
    id,
    label,
    control: { kind: 'toggle', value, set: (next: boolean) => value.set(next) },
  };
}

function general(): SettingsSection {
  return {
    id: 'shell.general',
    title: 'settings.general',
    rows: [row('shell.theme'), row('shell.language'), row('shell.textSize')],
  };
}

function visibleRows(settings: SettingsService): string[] {
  return settings
    .all()
    .flatMap((section) => section.rows.map((entry) => `${entry.id}:${entry.label}`));
}

describe('replacing a single settings row', () => {
  it('draws the replacement where the row was and leaves the rest of the section', () => {
    const settings = TestBed.inject(SettingsService);
    settings.register(general());

    settings.replaceRow(row('shell.language', 'product.language'));

    expect(visibleRows(settings)).toEqual([
      'shell.theme:shell.theme.label',
      'shell.language:product.language',
      'shell.textSize:shell.textSize.label',
    ]);
  });

  it('applies to the section when it is contributed again later', () => {
    const settings = TestBed.inject(SettingsService);
    settings.replaceRow(row('shell.language', 'product.language'));

    settings.register(general());
    settings.register(general());

    expect(visibleRows(settings)).toContain('shell.language:product.language');
    expect(visibleRows(settings)).not.toContain('shell.language:shell.language.label');
  });

  it('loses to a removal of the same row', () => {
    const settings = TestBed.inject(SettingsService);
    settings.register(general());

    settings.replaceRow(row('shell.language', 'product.language'));
    settings.omit(['shell.language']);

    expect(visibleRows(settings).some((entry) => entry.startsWith('shell.language'))).toBe(
      false,
    );
  });

  it('gives the contributed row back once the replacement is disposed', () => {
    const settings = TestBed.inject(SettingsService);
    settings.register(general());

    const replacement = settings.replaceRow(row('shell.language', 'product.language'));
    replacement.dispose();

    expect(visibleRows(settings)).toContain('shell.language:shell.language.label');
  });

  it('keeps what was contributed readable, replacement or not', () => {
    const settings = TestBed.inject(SettingsService);
    settings.register(general());

    settings.replaceRow(row('shell.language', 'product.language'));

    expect(
      settings.registered()[0].rows.map((entry) => entry.label),
    ).toContain('shell.language.label');
  });
});
