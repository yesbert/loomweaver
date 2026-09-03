import { computed, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DEFAULT_SHELL_FEATURES,
  provideShellFeatures,
  ShellFeatures,
  ShellFeaturesInput,
} from '../foundation/shell-features';
import { KeyValueStore } from '../persistence/key-value-store';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { FeatureSwitches } from './feature-switches.service';

type Group = keyof ShellFeatures;

const everySwitch = (Object.keys(DEFAULT_SHELL_FEATURES) as Group[]).flatMap(
  (group) =>
    Object.keys(DEFAULT_SHELL_FEATURES[group]).map(
      (name) => [group, name] as const,
    ),
);

function read(switches: FeatureSwitches, group: Group, name: string): boolean {
  const group_ = switches[group] as unknown as Readonly<
    Record<string, Signal<boolean>>
  >;
  return group_[name]();
}

function only(group: Group, name: string, value: boolean): ShellFeaturesInput {
  return { [group]: { [name]: value } } as ShellFeaturesInput;
}

function spyStore(): KeyValueStore {
  return {
    get: vi.fn(async () => undefined),
    set: vi.fn(async () => undefined),
    delete: vi.fn(async () => undefined),
  };
}

describe('FeatureSwitches', () => {
  it('starts from the declaration and leaves the rest on', () => {
    TestBed.configureTestingModule({
      providers: [provideShellFeatures({ content: { splitRight: false } })],
    });
    const switches = TestBed.inject(FeatureSwitches);

    expect(switches.content.splitRight()).toBe(false);
    expect(switches.content.splitDown()).toBe(true);
    expect(switches.current().content.splitRight).toBe(false);
  });

  it('answers the full workbench when nothing is declared', () => {
    const switches = TestBed.inject(FeatureSwitches);

    for (const [group, name] of everySwitch) {
      expect(read(switches, group, name)).toBe(true);
    }
  });

  it.each(everySwitch)('%s.%s flips alone and flips back', (group, name) => {
    const switches = TestBed.inject(FeatureSwitches);

    switches.update(only(group, name, false));

    for (const [otherGroup, otherName] of everySwitch) {
      const expected = !(otherGroup === group && otherName === name);
      expect(read(switches, otherGroup, otherName)).toBe(expected);
    }

    switches.update(only(group, name, true));
    expect(read(switches, group, name)).toBe(true);
  });

  it('a reader that depends on a switch re-evaluates', () => {
    const switches = TestBed.inject(FeatureSwitches);
    const canSplit = computed(
      () => switches.content.splitRight() || switches.content.splitDown(),
    );
    expect(canSplit()).toBe(true);

    switches.update({ content: { splitRight: false, splitDown: false } });

    expect(canSplit()).toBe(false);
  });

  it('writes nothing to any store', () => {
    const workingState = spyStore();
    const settings = spyStore();
    TestBed.configureTestingModule({
      providers: [
        { provide: WORKING_STATE_STORE, useValue: workingState },
        { provide: SETTINGS_STORE, useValue: settings },
      ],
    });
    const switches = TestBed.inject(FeatureSwitches);

    switches.update({ content: { close: false }, windows: { popout: false } });

    expect(workingState.set).not.toHaveBeenCalled();
    expect(settings.set).not.toHaveBeenCalled();
  });
});
