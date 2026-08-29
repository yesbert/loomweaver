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
  '--lw-font-sans',
  '--lw-font-mono',
] as const;

export type LwToken = (typeof LW_TOKENS)[number];

const known = new Set<string>(LW_TOKENS);

export function isKnownToken(name: string): boolean {
  return known.has(name);
}

export interface ThemeRegistration {
  readonly pluginId: string;
  readonly tokens: Readonly<Record<string, string>>;
  readonly dark?: Readonly<Record<string, string>>;
}

function ownerByToken(
  registrations: readonly ThemeRegistration[],
): Map<string, ThemeRegistration> {
  const owners = new Map<string, ThemeRegistration>();
  for (const registration of registrations) {
    const names = [
      ...Object.keys(registration.tokens),
      ...Object.keys(registration.dark ?? {}),
    ];
    for (const name of names) {
      if (!known.has(name) || owners.has(name)) {
        continue;
      }
      owners.set(name, registration);
    }
  }
  return owners;
}

function composeScheme(
  registrations: readonly ThemeRegistration[],
  pick: (
    registration: ThemeRegistration,
  ) => Readonly<Record<string, string>> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, owner] of ownerByToken(registrations)) {
    const value = pick(owner)?.[name];
    if (value === undefined) {
      continue;
    }
    out[name] = value;
  }
  return out;
}

export function composeTokens(
  registrations: readonly ThemeRegistration[],
): Record<string, string> {
  return composeScheme(registrations, (registration) => registration.tokens);
}

export function composeDarkTokens(
  registrations: readonly ThemeRegistration[],
): Record<string, string> {
  return composeScheme(registrations, (registration) => registration.dark);
}

interface LayerRules {
  readonly light: CSSStyleRule;
  readonly dark: CSSStyleRule;
}

const registrations: ThemeRegistration[] = [];
let appliedLight: string[] = [];
let appliedDark: string[] = [];
let cachedRules: LayerRules | null | undefined;

function pluginLayerRules(): LayerRules | null {
  if (cachedRules !== undefined) {
    return cachedRules;
  }
  cachedRules = createPluginLayerRules();
  return cachedRules;
}

function createPluginLayerRules(): LayerRules | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const element = document.createElement('style');
  element.dataset['lwPluginTheme'] = '';
  document.head.append(element);
  const sheet = element.sheet;
  if (!sheet) {
    return null;
  }
  try {
    const index = sheet.insertRule(
      '@layer lw-plugin-theme { :root {} :root.dark {} }',
      sheet.cssRules.length,
    );
    const layer = sheet.cssRules[index] as CSSLayerBlockRule;
    const light = layer.cssRules[0] as CSSStyleRule | undefined;
    const dark = layer.cssRules[1] as CSSStyleRule | undefined;
    if (!light || !dark) {
      return null;
    }
    return { light, dark };
  } catch {
    return null;
  }
}

function writeScheme(
  rule: CSSStyleRule,
  previous: readonly string[],
  composed: Record<string, string>,
): string[] {
  const style = rule.style;
  for (const name of previous) {
    style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(composed)) {
    style.setProperty(name, value);
  }
  return Object.keys(composed);
}

function apply(): void {
  const rules = pluginLayerRules();
  if (!rules) {
    return;
  }
  appliedLight = writeScheme(
    rules.light,
    appliedLight,
    composeTokens(registrations),
  );
  appliedDark = writeScheme(
    rules.dark,
    appliedDark,
    composeDarkTokens(registrations),
  );
}

export function addThemeRegistration(registration: ThemeRegistration): void {
  registrations.push(registration);
  apply();
}

export function removeThemeRegistration(registration: ThemeRegistration): void {
  const index = registrations.indexOf(registration);
  if (index === -1) {
    return;
  }
  registrations.splice(index, 1);
  apply();
}
