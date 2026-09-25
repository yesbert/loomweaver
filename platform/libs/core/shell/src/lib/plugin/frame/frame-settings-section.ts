import { signal } from '@angular/core';
import {
  FrameSettingRow,
  FrameSettingsSection,
  SettingControl,
  SettingsSection,
} from '@loomweaver/plugin-sdk';
import { KeyValueStore } from '../../persistence/key-value-store';
import { hydrateAsync } from '../../persistence/stored-values/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';
import { PluginInstallService } from '../../plugin-store/lifecycle/plugin-install.service';

export type FrameSettingValue = boolean | string | number;
export type FrameSettingValues = Readonly<Record<string, FrameSettingValue>>;

function defaultsOf(wire: FrameSettingsSection): FrameSettingValues {
  const defaults: Record<string, FrameSettingValue> = {};
  for (const row of wire.rows) {
    defaults[row.id] = row.control.value;
  }
  return defaults;
}

function typedOverlay(
  defaults: FrameSettingValues,
  raw: string | undefined,
): FrameSettingValues {
  if (!raw) {
    return defaults;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return defaults;
    }
    const merged: Record<string, FrameSettingValue> = { ...defaults };
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (
        Object.hasOwn(defaults, key) &&
        typeof value === typeof defaults[key]
      ) {
        merged[key] = value as FrameSettingValue;
      }
    }
    return merged;
  } catch {
    return defaults;
  }
}

interface FrameSectionDeps {
  readonly pluginId: string;
  readonly wire: FrameSettingsSection;
  readonly group: string;
  readonly store: KeyValueStore;
  readonly sync: StateSyncService;
  readonly notify: (sectionId: string, values: FrameSettingValues) => void;
}

export interface FrameSectionHandle {
  readonly section: SettingsSection;
  readonly disposeSync: () => void;
}

export const INSTALLED_PLUGINS_SETTINGS_GROUP = 'settings.group.community';

export function frameSettingsGroup(
  installs: PluginInstallService,
  pluginId: string,
): string {
  return installs.isInstalled(pluginId)
    ? INSTALLED_PLUGINS_SETTINGS_GROUP
    : 'settings.group.plugins';
}

export function buildFrameSection(deps: FrameSectionDeps): FrameSectionHandle {
  const { pluginId, wire, group, store, sync, notify } = deps;
  const key = `lw.plugin-settings:${pluginId}:${wire.id}`;
  const defaults = defaultsOf(wire);
  const values = signal<FrameSettingValues>(
    typedOverlay(defaults, store.peek?.(key)),
  );
  const applyStored = (raw: string | undefined): void => {
    values.set(typedOverlay(defaults, raw));
    notify(wire.id, values());
  };
  if (store.peek) {
    notify(wire.id, values());
  } else {
    hydrateAsync(store, key, applyStored);
  }
  const disposeSync = sync.register('settings', key, applyStored);
  const set = (rowId: string, value: FrameSettingValue): void => {
    values.update((current) => ({ ...current, [rowId]: value }));
    void store.set(key, JSON.stringify(values()));
    notify(wire.id, values());
  };
  const section: SettingsSection = {
    id: `${pluginId}.${wire.id}`,
    title: wire.title,
    group,
    order: wire.order,
    rows: wire.rows.map((row) => ({
      id: `${pluginId}.${wire.id}.${row.id}`,
      label: row.label,
      description: row.description,
      control: hostControl(row, values, set),
    })),
  };
  return { section, disposeSync };
}

function hostControl(
  row: FrameSettingRow,
  values: () => FrameSettingValues,
  set: (rowId: string, value: FrameSettingValue) => void,
): SettingControl {
  const control = row.control;
  switch (control.kind) {
    case 'toggle': {
      return {
        kind: 'toggle',
        value: () => values()[row.id] === true,
        set: (value) => set(row.id, value),
      };
    }
    case 'text': {
      return {
        kind: 'text',
        inputType: control.inputType,
        placeholder: control.placeholder,
        value: () => String(values()[row.id] ?? ''),
        set: (value) => set(row.id, value),
      };
    }
    case 'select': {
      return {
        kind: 'select',
        options: control.options,
        value: () => String(values()[row.id] ?? control.value),
        set: (value) => set(row.id, value),
      };
    }
    case 'slider': {
      return {
        kind: 'slider',
        min: control.min,
        max: control.max,
        step: control.step,
        value: () => Number(values()[row.id] ?? control.value),
        set: (value) => set(row.id, value),
      };
    }
  }
}
