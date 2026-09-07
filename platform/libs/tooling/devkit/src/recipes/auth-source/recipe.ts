import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toCamelCase, toPascalCase } from '../../lib/generate/casing';

export interface AuthSourceInput {
  readonly name: string;
  readonly bare?: boolean;
}

export interface ResolvedAuthSource {
  readonly name: string;
  readonly className: string;
  readonly propertyName: string;
  readonly bare: boolean;
}

export const SESSION_PLUGIN_ID = 'session';

export function resolveAuthSourceInput(input: AuthSourceInput): ResolvedAuthSource {
  if (!isKebabId(input.name)) {
    throw new Error(`Auth source name must be kebab-case (e.g. "dev"); got "${input.name}".`);
  }
  return {
    name: input.name,
    className: toPascalCase(input.name),
    propertyName: toCamelCase(input.name),
    bare: input.bare ?? false,
  };
}

export function sessionPluginSymbol(a: ResolvedAuthSource): string {
  return `${a.propertyName}SessionPlugin`;
}

function moduleFile(a: ResolvedAuthSource): string {
  return `// Provider-neutral AuthSource. LoomWeaver owns no authentication — it only reacts to
// a session snapshot. Wire it with: provideAuthSource(() => ${a.propertyName}AuthSource()).
// Replace the dev switcher below by mapping your product's real session onto an AuthSnapshot.
import { signal, Signal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';

const USER: AuthSnapshot = {
  authenticated: true,
  roles: ['user'],
  claims: {},
  displayName: 'Signed-in user',
};

const ADMIN: AuthSnapshot = {
  authenticated: true,
  roles: ['user', 'admin'],
  claims: {},
  displayName: 'Administrator',
};

const state = signal<AuthSnapshot>(ANONYMOUS);

export function ${a.propertyName}AuthSource(): Signal<AuthSnapshot> {
  return state.asReadonly();
}

export function cycle${a.className}User(): void {
  const current = state();
  const next = !current.authenticated
    ? USER
    : current.roles.includes('admin')
      ? ANONYMOUS
      : ADMIN;
  state.set(next);
}
`;
}

function pluginFile(a: ResolvedAuthSource): string {
  return `// The verbs a user needs to operate the stand-in session: sign in, switch the account, sign
// out, from a rail item whose menu carries them. This is presentation for a product that has no
// backend yet; nothing here protects anything. Delete it once your own session arrives.
import type { Disposable, Plugin, PluginContext } from '@loomweaver/plugin-sdk';
import { cycle${a.className}User, ${a.propertyName}AuthSource } from './${a.name}-auth-source';

const MENU = 'session.account/menu';
const snapshot = ${a.propertyName}AuthSource();

let drawn: Disposable[] = [];

function signIn(): void {
  if (!snapshot().authenticated) {
    cycle${a.className}User();
  }
}

function switchAccount(): void {
  cycle${a.className}User();
  if (!snapshot().authenticated) {
    cycle${a.className}User();
  }
}

function signOut(): void {
  while (snapshot().authenticated) {
    cycle${a.className}User();
  }
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function draw(ctx: PluginContext): void {
  for (const part of drawn) {
    part.dispose();
  }
  const current = snapshot();
  const name = current.displayName ?? '';
  drawn = [
    ctx.registerRailItem({
      id: 'session.account',
      rail: 'primary',
      icon: 'account',
      title: current.authenticated ? name : 'session.signIn',
      anchor: 'bottom',
      order: 20,
      menu: MENU,
      menuTrigger: 'primary',
      ...(current.authenticated ? { initials: initialsOf(name) } : {}),
      menuHeader: current.authenticated
        ? {
            title: name,
            detail: \`session.role.\${current.roles.includes('admin') ? 'admin' : 'user'}\`,
            initials: initialsOf(name),
          }
        : { title: 'session.signedOut', icon: 'account' },
    }),
    ...(current.authenticated
      ? [
          ctx.registerMenuItem({
            id: 'session.menu.switch',
            menu: MENU,
            command: 'session.switchAccount',
            group: 'account',
            order: 10,
          }),
          ctx.registerMenuItem({
            id: 'session.menu.signOut',
            menu: MENU,
            command: 'session.signOut',
            group: 'account',
            order: 20,
          }),
        ]
      : [
          ctx.registerMenuItem({
            id: 'session.menu.signIn',
            menu: MENU,
            command: 'session.signIn',
            group: 'account',
            order: 10,
          }),
        ]),
  ];
}

export const ${sessionPluginSymbol(a)}: Plugin = {
  manifest: { id: 'session', name: 'Account', capabilities: ['contributions'] },
  activate(ctx) {
    const then = (step: () => void) => () => {
      step();
      draw(ctx);
    };
    ctx.registerCommand({
      id: 'session.signIn',
      title: 'session.signIn',
      icon: 'account',
      access: { authenticated: false },
      run: then(signIn),
    });
    ctx.registerCommand({
      id: 'session.switchAccount',
      title: 'session.switchAccount',
      icon: 'account',
      access: { authenticated: true },
      run: then(switchAccount),
    });
    ctx.registerCommand({
      id: 'session.signOut',
      title: 'session.signOut',
      icon: 'signOut',
      access: { authenticated: true },
      run: then(signOut),
    });
    draw(ctx);
  },
  deactivate() {
    for (const part of drawn) {
      part.dispose();
    }
    drawn = [];
  },
};
`;
}

function indexFile(a: ResolvedAuthSource): string {
  return `export { cycle${a.className}User, ${a.propertyName}AuthSource } from './${a.name}-auth-source';
export { ${sessionPluginSymbol(a)} } from './${a.name}-session.plugin';
`;
}

const I18N: Readonly<Record<'en' | 'de', Record<string, unknown>>> = {
  en: {
    signIn: 'Sign in',
    switchAccount: 'Switch account',
    signOut: 'Sign out',
    signedOut: 'Not signed in',
    role: { user: 'User', admin: 'Administrator' },
  },
  de: {
    signIn: 'Anmelden',
    switchAccount: 'Konto wechseln',
    signOut: 'Abmelden',
    signedOut: 'Nicht angemeldet',
    role: { user: 'Benutzer', admin: 'Administrator' },
  },
};

export const authSource: Recipe<AuthSourceInput> = {
  id: 'auth-source',
  build(input: AuthSourceInput): FileMap {
    const a = resolveAuthSourceInput(input);
    const source = { [`${a.name}-auth-source.ts`]: moduleFile(a) };
    if (a.bare) {
      return source;
    }
    return {
      ...source,
      [`${a.name}-session.plugin.ts`]: pluginFile(a),
      'index.ts': indexFile(a),
      'i18n/en.json': `${JSON.stringify(I18N.en, null, 2)}\n`,
      'i18n/de.json': `${JSON.stringify(I18N.de, null, 2)}\n`,
    };
  },
};
