export function isKebabId(value: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
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

export function toTitleCase(value: string): string {
  return words(value)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
