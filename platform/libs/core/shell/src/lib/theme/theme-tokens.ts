export const LW_TOKENS = [
  '--lw-brand',
  '--lw-brand-strong',
  '--lw-brand-text',
  '--lw-brand-fill',
  '--lw-on-brand',
  '--lw-accent',
  '--lw-accent-strong',
  '--lw-surface',
  '--lw-surface-raised',
  '--lw-surface-overlay',
  '--lw-field',
  '--lw-border',
  '--lw-content',
  '--lw-content-muted',
  '--lw-content-faint',
  '--lw-unsaved',
  '--lw-tooltip',
  '--lw-tooltip-content',
  '--lw-positive',
  '--lw-on-positive',
  '--lw-negative',
  '--lw-negative-fill',
  '--lw-on-negative',
  '--lw-caution',
  '--lw-on-caution',
  '--lw-info',
  '--lw-on-info',
  '--lw-scrim',
  '--lw-scroll-thumb',
  '--lw-scroll-track',
  '--lw-font-sans',
  '--lw-font-mono',
] as const;

const known = new Set<string>(LW_TOKENS);

export function isKnownToken(name: string): boolean {
  return known.has(name);
}
