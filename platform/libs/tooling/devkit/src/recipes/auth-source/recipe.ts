import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toCamelCase, toPascalCase } from '../../lib/generate/casing';

export interface AuthSourceInput {
  readonly name: string;
}

export interface ResolvedAuthSource {
  readonly name: string;
  readonly className: string;
  readonly propertyName: string;
}

export function resolveAuthSourceInput(input: AuthSourceInput): ResolvedAuthSource {
  if (!isKebabId(input.name)) {
    throw new Error(`Auth source name must be kebab-case (e.g. "dev"); got "${input.name}".`);
  }
  return {
    name: input.name,
    className: toPascalCase(input.name),
    propertyName: toCamelCase(input.name),
  };
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

export const authSource: Recipe<AuthSourceInput> = {
  id: 'auth-source',
  build(input: AuthSourceInput): FileMap {
    const a = resolveAuthSourceInput(input);
    return { [`${a.name}-auth-source.ts`]: moduleFile(a) };
  },
};
