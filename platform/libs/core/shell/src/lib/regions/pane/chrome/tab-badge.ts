import { TabBadge, TabBadgeTone } from '@loomweaver/plugin-sdk';

const TONES: readonly TabBadgeTone[] = ['neutral', 'brand', 'success', 'danger'];

const MAX_TEXT_LENGTH = 40;

export function tabBadgeOf(value: unknown): TabBadge | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const text =
    typeof raw['text'] === 'string' && raw['text'].length > 0
      ? raw['text'].slice(0, MAX_TEXT_LENGTH)
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
    ...(text !== undefined && raw['textIsLiteral'] === true && { textIsLiteral: true }),
    ...(icon !== undefined && { icon }),
    ...(tone !== undefined && tone !== 'neutral' && { tone }),
  };
}
