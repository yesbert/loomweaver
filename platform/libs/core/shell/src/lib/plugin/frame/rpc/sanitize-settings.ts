import {
  FrameSettingControl,
  FrameSettingRow,
  FrameSettingsSection,
  SelectOption,
} from '@loomweaver/plugin-sdk';
import {
  WireRecord,
  isWireObject,
  optionalNumber,
  optionalText,
  requiredText,
  wireRecord,
} from './wire-fields';

const INPUT_TYPES = ['text', 'date', 'email', 'number', 'password'] as const;

export function sanitizeRpcSettingsSection(
  pluginId: string,
  section: FrameSettingsSection,
): FrameSettingsSection {
  const raw = wireRecord(section);
  const id = requiredText(
    raw['id'],
    `Sandbox plugin "${pluginId}": registerSettingsSection requires a non-empty 'id'.`,
  );
  const title = requiredText(
    raw['title'],
    `Sandbox plugin "${pluginId}": registerSettingsSection requires a non-empty 'title'.`,
  );
  const rows = raw['rows'];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSettingsSection requires at least one row.`,
    );
  }
  return {
    id,
    title,
    order: optionalNumber(raw['order']),
    rows: rows.map((row) => sanitizeRow(pluginId, row)),
  };
}

function sanitizeRow(pluginId: string, value: unknown): FrameSettingRow {
  const row = wireRecord(value);
  return {
    id: requiredText(
      row['id'],
      `Sandbox plugin "${pluginId}": every settings row needs a non-empty 'id'.`,
    ),
    label: requiredText(
      row['label'],
      `Sandbox plugin "${pluginId}": every settings row needs a non-empty 'label'.`,
    ),
    description: optionalText(row['description']),
    control: sanitizeControl(pluginId, row['control']),
  };
}

function sanitizeControl(
  pluginId: string,
  value: unknown,
): FrameSettingControl {
  const control = wireRecord(value);
  const kind = control['kind'];
  const initial = control['value'];
  if (kind === 'toggle' && typeof initial === 'boolean') {
    return { kind, value: initial };
  }
  if (kind === 'text' && typeof initial === 'string') {
    return textControl(initial, control);
  }
  if (kind === 'select' && typeof initial === 'string') {
    return selectControl(pluginId, initial, control);
  }
  if (kind === 'slider' && typeof initial === 'number') {
    return sliderControl(initial, control);
  }
  throw new Error(
    `Sandbox plugin "${pluginId}": a settings control must be toggle/text/select/slider with a matching default 'value'.`,
  );
}

function textControl(value: string, control: WireRecord): FrameSettingControl {
  return {
    kind: 'text',
    value,
    inputType: INPUT_TYPES.find((type) => type === control['inputType']),
    placeholder: optionalText(control['placeholder']),
  };
}

function selectControl(
  pluginId: string,
  value: string,
  control: WireRecord,
): FrameSettingControl {
  const options = sanitizeOptions(control['options']);
  if (options.length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": a select control needs at least one { value, label } option.`,
    );
  }
  return { kind: 'select', value, options };
}

function sliderControl(
  value: number,
  control: WireRecord,
): FrameSettingControl {
  return {
    kind: 'slider',
    value,
    min: optionalNumber(control['min']),
    max: optionalNumber(control['max']),
    step: optionalNumber(control['step']),
  };
}

function sanitizeOptions(value: unknown): readonly SelectOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(
      (option): option is SelectOption =>
        isWireObject(option) &&
        typeof option['value'] === 'string' &&
        typeof option['label'] === 'string',
    )
    .map((option) => ({ value: option.value, label: option.label }));
}
