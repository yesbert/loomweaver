const MARKUP_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '{': '&#123;',
  '}': '&#125;',
  '@': '&#64;',
};

export function markupText(value: string): string {
  return value.replaceAll(/[&<>"'{}@]/g, (character) => MARKUP_ENTITIES[character]);
}

export function stringLiteral(value: string): string {
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", String.raw`\'`)
    .replaceAll('\n', String.raw`\n`)
    .replaceAll('\r', String.raw`\r`);
  return `'${escaped}'`;
}
