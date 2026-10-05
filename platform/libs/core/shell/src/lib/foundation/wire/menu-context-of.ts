import { MenuContext } from '@loomweaver/plugin-sdk';

type ContextValue = string | number | boolean;

function isContextValue(value: unknown): value is ContextValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function menuContextOf(value: unknown): MenuContext | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, ContextValue] =>
      isContextValue(entry[1]),
    ),
  );
}

export function requiredMenuContext(value: unknown, refusal: string): MenuContext {
  if (!isRecord(value) || Object.values(value).some((raw) => !isContextValue(raw))) {
    throw new TypeError(refusal);
  }
  return menuContextOf(value) as MenuContext;
}
