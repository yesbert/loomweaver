import { LwButtonSize, LwButtonVariant } from '@loomweaver/plugin-sdk';

export function lwButtonClasses(
  variant: LwButtonVariant,
  size: LwButtonSize,
  iconOnly: boolean,
): string[] {
  const classes = ['lw-btn', `lw-btn--${variant}`];
  if (size === 'sm') {
    classes.push('lw-btn--sm');
  }
  if (iconOnly) {
    classes.push('lw-btn--icon');
  }
  return classes;
}
