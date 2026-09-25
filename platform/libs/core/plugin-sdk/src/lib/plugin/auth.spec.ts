import {
  ANONYMOUS,
  AuthSnapshot,
  isAccessDisabled,
  isAccessVisible,
  meetsAccess,
} from './auth.js';

const admin: AuthSnapshot = { authenticated: true, roles: ['user', 'admin'], claims: {} };
const user: AuthSnapshot = { authenticated: true, roles: ['user'], claims: {} };

describe('meetsAccess', () => {
  it('allows an undefined requirement', () => {
    expect(meetsAccess(undefined, ANONYMOUS)).toBe(true);
  });

  it('checks the authenticated flag in both directions', () => {
    expect(meetsAccess({ authenticated: true }, ANONYMOUS)).toBe(false);
    expect(meetsAccess({ authenticated: true }, user)).toBe(true);
    expect(meetsAccess({ authenticated: false }, user)).toBe(false);
  });

  it('matches anyRole (at least one) and allRoles (every)', () => {
    expect(meetsAccess({ anyRole: ['admin'] }, user)).toBe(false);
    expect(meetsAccess({ anyRole: ['admin', 'user'] }, user)).toBe(true);
    expect(meetsAccess({ allRoles: ['user', 'admin'] }, user)).toBe(false);
    expect(meetsAccess({ allRoles: ['user', 'admin'] }, admin)).toBe(true);
  });

  it('ignores empty role lists', () => {
    expect(meetsAccess({ anyRole: [], allRoles: [] }, ANONYMOUS)).toBe(true);
  });
});

describe('isAccessVisible / isAccessDisabled', () => {
  it('hides an unmet requirement by default (hide mode)', () => {
    expect(isAccessVisible({ anyRole: ['admin'] }, user)).toBe(false);
    expect(isAccessDisabled({ anyRole: ['admin'] }, user)).toBe(false);
  });

  it('keeps an unmet disable-mode requirement visible but disabled', () => {
    const access = { anyRole: ['admin'], mode: 'disable' as const };
    expect(isAccessVisible(access, user)).toBe(true);
    expect(isAccessDisabled(access, user)).toBe(true);
  });

  it('shows and enables a met requirement regardless of mode', () => {
    const access = { anyRole: ['admin'], mode: 'disable' as const };
    expect(isAccessVisible(access, admin)).toBe(true);
    expect(isAccessDisabled(access, admin)).toBe(false);
  });
});
