import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DialogService } from '../dialog/dialog.service';
import { SettingsService } from './settings.service';
import { SettingsSection } from './settings-model';

function section(id: string, order?: number): SettingsSection {
  const value = signal('a');
  return {
    id,
    title: `${id}.title`,
    order,
    rows: [
      {
        id: `${id}.row`,
        label: `${id}.label`,
        control: {
          kind: 'select',
          options: [{ value: 'a', label: 'a' }],
          value,
          set: (next) => value.set(next),
        },
      },
    ],
  };
}

function sectionWithRows(
  id: string,
  rowIds: readonly string[],
): SettingsSection {
  const value = signal('a');
  return {
    id,
    title: `${id}.title`,
    rows: rowIds.map((rowId) => ({
      id: rowId,
      label: `${rowId}.label`,
      control: {
        kind: 'select' as const,
        options: [{ value: 'a', label: 'a' }],
        value,
        set: (next: string) => value.set(next),
      },
    })),
  };
}

describe('SettingsService', () => {
  function setup() {
    return {
      settings: TestBed.inject(SettingsService),
      dialogs: TestBed.inject(DialogService),
    };
  }

  it('registers a section and exposes it via all()', () => {
    const { settings } = setup();

    settings.register(section('one'));

    expect(settings.all().map((s) => s.id)).toEqual(['one']);
  });

  it('orders sections by order, defaulting to 0', () => {
    const { settings } = setup();

    settings.register(section('late', 10));
    settings.register(section('early', -5));
    settings.register(section('mid'));

    expect(settings.all().map((s) => s.id)).toEqual(['early', 'mid', 'late']);
  });

  it('removes a section when its handle is disposed', () => {
    const { settings } = setup();

    const handle = settings.register(section('gone'));
    handle.dispose();

    expect(settings.all()).toEqual([]);
  });

  it('open() mounts the settings dialog', () => {
    const { settings, dialogs } = setup();

    settings.open();

    expect(dialogs.dialogs().length).toBe(1);
  });

  it('registering an existing id overrides the section in place', () => {
    const { settings } = setup();

    settings.register(section('dup'));
    settings.register({ ...section('dup'), title: 'replaced' });

    expect(settings.all().length).toBe(1);
    expect(settings.all()[0].title).toBe('replaced');
  });

  it('omit drops a whole section by id', () => {
    const { settings } = setup();

    settings.register(section('keep'));
    settings.register(section('drop'));
    settings.omit(['drop']);

    expect(settings.all().map((s) => s.id)).toEqual(['keep']);
  });

  it('omit drops a single row and keeps the rest of the section', () => {
    const { settings } = setup();

    settings.register(
      sectionWithRows('general', ['theme', 'language', 'textSize']),
    );
    settings.omit(['textSize']);

    expect(settings.all()[0].rows.map((r) => r.id)).toEqual([
      'theme',
      'language',
    ]);
  });

  it('hides a section whose rows are all omitted', () => {
    const { settings } = setup();

    settings.register(sectionWithRows('general', ['only']));
    settings.omit(['only']);

    expect(settings.all()).toEqual([]);
  });

  it('omit also covers a section registered afterwards', () => {
    const { settings } = setup();

    settings.omit(['late']);
    settings.register(section('late'));

    expect(settings.all()).toEqual([]);
  });
});
