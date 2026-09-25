export const KEBAB_ID_PATTERN = '^[a-z][a-z0-9]*(-[a-z0-9]+)*$';

const KEBAB_ID = new RegExp(KEBAB_ID_PATTERN);

export function isKebabId(value: string): boolean {
  return KEBAB_ID.test(value);
}

function words(value: string): string[] {
  return value.split(/[-_\s]+/).filter(Boolean);
}

export function toPascalCase(value: string): string {
  return words(value)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** The kebab-case spelling of a camelCase option, for command lines that prefer it. */
export function kebabCase(name: string): string {
  return name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function toTitleCase(value: string): string {
  return words(value)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
