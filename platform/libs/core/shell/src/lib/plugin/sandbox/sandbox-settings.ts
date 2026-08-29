import { signal } from '@angular/core';
import {
  FrameSettingControl,
  FrameSettingRow,
  FrameSettingsSection,
  SelectOption,
  SettingControl,
  SettingsSection,
} from '@loomweaver/plugin-sdk';
import { KeyValueStore } from '../../persistence/key-value-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';

export type FrameSettingValue = boolean | string | number;
export type FrameSettingValues = Readonly<
  Record<string, FrameSettingValue>
>;

const INPUT_TYPES = ['text', 'date', 'email', 'number', 'password'] as const;

function sanitizeOptions(raw: unknown): readonly SelectOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (option): option is { value: string; label: string } =>
        typeof option === 'object' &&
        option !== null &&
        typeof (option as Record<string, unknown>)['value'] === 'string' &&
        typeof (option as Record<string, unknown>)['label'] === 'string',
    )
    .map((option) => ({ value: option.value, label: option.label }));
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function buildTextControl(
  value: string,
  control: Record<string, unknown>,
): FrameSettingControl {
  return {
    kind: 'text',
    value,
    inputType: INPUT_TYPES.find((type) => type === control['inputType']),
    placeholder: optionalString(control['placeholder']),
  };
}

function buildSelectControl(
  pluginId: string,
  value: string,
  control: Record<string, unknown>,
): FrameSettingControl {
  const options = sanitizeOptions(control['options']);
  if (options.length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": a select control needs at least one { value, label } option.`,
    );
  }
  return { kind: 'select', value, options };
}

function buildSliderControl(
  value: number,
  control: Record<string, unknown>,
): FrameSettingControl {
  return {
    kind: 'slider',
    value,
    min: optionalNumber(control['min']),
    max: optionalNumber(control['max']),
    step: optionalNumber(control['step']),
  };
}

function sanitizeControl(
  pluginId: string,
  raw: unknown,
): FrameSettingControl {
  const control = (raw ?? {}) as Record<string, unknown>;
  const kind = control['kind'];
  const value = control['value'];
  if (kind === 'toggle' && typeof value === 'boolean') {
    return { kind, value };
  }
  if (kind === 'text' && typeof value === 'string') {
    return buildTextControl(value, control);
  }
  if (kind === 'select' && typeof value === 'string') {
    return buildSelectControl(pluginId, value, control);
  }
  if (kind === 'slider' && typeof value === 'number') {
    return buildSliderControl(value, control);
  }
  throw new Error(
    `Sandbox plugin "${pluginId}": a settings control must be toggle/text/select/slider with a matching default 'value'.`,
  );
}

function sanitizeRow(pluginId: string, raw: unknown): FrameSettingRow {
  const row = (raw ?? {}) as Record<string, unknown>;
  if (typeof row['id'] !== 'string' || row['id'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": every settings row needs a non-empty 'id'.`,
    );
  }
  if (typeof row['label'] !== 'string' || row['label'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": every settings row needs a non-empty 'label'.`,
    );
  }
  return {
    id: row['id'],
    label: row['label'],
    description:
      typeof row['description'] === 'string' ? row['description'] : undefined,
    control: sanitizeControl(pluginId, row['control']),
  };
}

export function sanitizeRpcSettingsSection(
  pluginId: string,
  section: FrameSettingsSection,
): FrameSettingsSection {
  const raw = (section ?? {}) as unknown as Record<string, unknown>;
  if (typeof raw['id'] !== 'string' || raw['id'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSettingsSection requires a non-empty 'id'.`,
    );
  }
  if (typeof raw['title'] !== 'string' || raw['title'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSettingsSection requires a non-empty 'title'.`,
    );
  }
  if (!Array.isArray(raw['rows']) || raw['rows'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSettingsSection requires at least one row.`,
    );
  }
  return {
    id: raw['id'],
    title: raw['title'],
    order: typeof raw['order'] === 'number' ? raw['order'] : undefined,
    rows: raw['rows'].map((row) => sanitizeRow(pluginId, row)),
  };
}

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
      if (key in defaults && typeof value === typeof defaults[key]) {
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

export function buildFrameSection(
  deps: FrameSectionDeps,
): FrameSectionHandle {
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
