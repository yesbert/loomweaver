import { LwButtonSize, LwButtonVariant } from '@loomweaver/plugin-sdk';

const BUTTON_VARIANTS: Readonly<Record<LwButtonVariant, true>> = {
  primary: true,
  default: true,
  success: true,
  danger: true,
  warning: true,
  info: true,
  ghost: true,
};

export function isButtonVariant(value: unknown): value is LwButtonVariant {
  return typeof value === 'string' && Object.hasOwn(BUTTON_VARIANTS, value);
}

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
