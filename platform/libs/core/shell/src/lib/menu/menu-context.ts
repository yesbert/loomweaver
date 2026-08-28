import { MenuContext } from '@loomweaver/plugin-sdk';

export function menuContextString(
  context: MenuContext | undefined,
  key: string,
): string {
  return String(context?.[key] ?? '');
}
