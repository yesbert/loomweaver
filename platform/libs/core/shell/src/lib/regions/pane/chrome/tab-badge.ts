import { TabBadge, TabBadgeTone } from '@loomweaver/plugin-sdk';

const TONES: readonly TabBadgeTone[] = ['neutral', 'brand', 'success', 'danger'];

const MAX_LITERAL_LENGTH = 40;

const MAX_KEY_LENGTH = 200;

export function tabBadgeOf(value: unknown): TabBadge | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const literal = raw['textIsLiteral'] === true;
  const text =
    typeof raw['text'] === 'string' && raw['text'].length > 0
      ? [...raw['text']]
          .slice(0, literal ? MAX_LITERAL_LENGTH : MAX_KEY_LENGTH)
          .join('')
      : undefined;
  const icon =
    typeof raw['icon'] === 'string' && raw['icon'].length > 0
      ? raw['icon']
      : undefined;
  if (text === undefined && icon === undefined) {
    return undefined;
  }
  const tone = TONES.find((candidate) => candidate === raw['tone']);
  return {
    ...(text !== undefined && { text }),
    ...(text !== undefined && literal && { textIsLiteral: true }),
    ...(icon !== undefined && { icon }),
    ...(tone !== undefined && tone !== 'neutral' && { tone }),
  };
}
