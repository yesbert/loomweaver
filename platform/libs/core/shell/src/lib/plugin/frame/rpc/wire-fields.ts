export type WireRecord = Readonly<Record<string, unknown>>;

export function wireRecord(value: unknown): WireRecord {
  return (value ?? {}) as WireRecord;
}

export function isWireObject(value: unknown): value is WireRecord {
  return typeof value === 'object' && value !== null;
}

export function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export function onlyTrue(value: unknown): true | undefined {
  return value === true ? true : undefined;
}

export function textList(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : undefined;
}

export function requiredText(value: unknown, refusal: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(refusal);
  }
  return value;
}

export function textArgument(
  value: unknown,
  call: string,
  name: string,
): string {
  if (typeof value !== 'string') {
    throw new TypeError(
      `Sandbox plugin: ${call} takes '${name}' as a string, got ${typeof value}.`,
    );
  }
  return value;
}
