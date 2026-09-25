import { KeyValueStore } from './key-value-store';

export function peekThrough(
  inner: KeyValueStore,
  keyOf: (key: string) => string = (key) => key,
): ((key: string) => string | undefined) | undefined {
  const innerPeek = inner.peek?.bind(inner);
  return innerPeek === undefined ? undefined : (key) => innerPeek(keyOf(key));
}
