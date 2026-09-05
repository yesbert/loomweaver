import { TestBed } from '@angular/core/testing';
import { registerDefaultSettings } from './default-settings';
import { SettingsService } from './settings/settings.service';
import { SettingRow } from './settings/settings-model';
import { ShellLayout, provideLayout } from './layout/layout';
import { RailLabelsService } from './regions/rail/rail-labels.service';

const bar: ShellLayout['regions'][number] = {
  id: 'top-bar',
  type: 'bar',
  dock: 'top',
};

function generalRows(...regions: ShellLayout['regions']): readonly SettingRow[] {
  TestBed.configureTestingModule({
    providers: [provideLayout({ regions: [bar, ...regions] })],
  });
  const settings = TestBed.inject(SettingsService);
  TestBed.runInInjectionContext(() => registerDefaultSettings(settings));
  return (
    settings.all().find((section) => section.id === 'shell.general')?.rows ?? []
  );
}

function railLabelRows(...regions: ShellLayout['regions']) {
  return generalRows(...regions).filter((row) =>
    row.id.startsWith('shell.railLabels.'),
  );
}

describe('default settings: names in the rail', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers one switch per declared rail, each naming its side', () => {
    const rows = railLabelRows(
      { id: 'primary', type: 'rail', dock: 'left' },
      { id: 'secondary', type: 'rail', dock: 'right' },
    );

    expect(rows.map((row) => row.id)).toEqual([
      'shell.railLabels.primary',
      'shell.railLabels.secondary',
    ]);
    expect(rows.map((row) => row.label)).toEqual([
      'rail.labelLeft',
      'rail.labelRight',
    ]);
  });

  it('names a lone rail without saying a side', () => {
    const rows = railLabelRows({ id: 'primary', type: 'rail', dock: 'left' });

    expect(rows.map((row) => row.label)).toEqual(['rail.label']);
  });

  it('offers nothing where the frame declares no rail', () => {
    expect(railLabelRows()).toEqual([]);
  });

  it('sits directly under the text size', () => {
    const rows = generalRows({ id: 'primary', type: 'rail', dock: 'left' });
    const ids = rows.map((row) => row.id);

    expect(ids.indexOf('shell.railLabels.primary')).toBe(
      ids.indexOf('shell.textSize') + 1,
    );
  });

  it('starts off and switches only the rail it names', () => {
    const rows = railLabelRows(
      { id: 'primary', type: 'rail', dock: 'left' },
      { id: 'secondary', type: 'rail', dock: 'right' },
    );
    const labels = TestBed.inject(RailLabelsService);
    const control = (row: SettingRow) => {
      if (row.control.kind !== 'toggle') {
        throw new Error(`${row.id} is not a switch`);
      }
      return row.control;
    };

    expect(control(rows[0]).value()).toBe(false);

    control(rows[0]).set(true);

    expect(labels.labelled('primary')).toBe(true);
    expect(labels.labelled('secondary')).toBe(false);
    expect(control(rows[1]).value()).toBe(false);
  });
});
