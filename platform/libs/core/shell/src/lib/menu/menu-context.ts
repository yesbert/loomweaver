import { MenuContext } from '@loomweaver/plugin-sdk';

export function requiredMenuContext(value: unknown, refusal: string): MenuContext {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(refusal);
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== 'string' && typeof raw !== 'number' && typeof raw !== 'boolean') {
      throw new TypeError(refusal);
    }
    clean[key] = raw;
  }
  return clean;
}

export function menuContextString(
  context: MenuContext | undefined,
  key: string,
): string {
  return String(context?.[key] ?? '');
}
