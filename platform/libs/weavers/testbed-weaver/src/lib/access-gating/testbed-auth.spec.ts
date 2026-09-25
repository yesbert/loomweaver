import { testbedAuth } from './testbed-auth';

function cycled() {
  testbedAuth.cycle();
  return testbedAuth.snapshot();
}

describe('testbedAuth', () => {
  afterEach(() => {
    testbedAuth.signOut();
    localStorage.clear();
  });

  it('cycles anonymous → user → admin → anonymous', () => {
    testbedAuth.signOut();
    expect(testbedAuth.snapshot().authenticated).toBe(false);
    expect(cycled().roles).toEqual(['user']);
    expect(cycled().roles).toEqual(['user', 'admin']);
    expect(cycled().authenticated).toBe(false);
  });

  it('signOut returns to anonymous from any principal', () => {
    testbedAuth.signInAsAdmin();
    expect(testbedAuth.snapshot().roles).toContain('admin');
    testbedAuth.signOut();
    expect(testbedAuth.snapshot().authenticated).toBe(false);
    expect(testbedAuth.snapshot().roles).toEqual([]);
  });

  it('dropAdmin steps an admin down to a plain signed-in user', () => {
    testbedAuth.signInAsAdmin();
    testbedAuth.dropAdmin();
    expect(testbedAuth.snapshot().authenticated).toBe(true);
    expect(testbedAuth.snapshot().roles).toEqual(['user']);
  });

  it('dropAdmin is a no-op when not an admin', () => {
    testbedAuth.signOut();
    testbedAuth.dropAdmin();
    expect(testbedAuth.snapshot().authenticated).toBe(false);
    testbedAuth.cycle();
    testbedAuth.dropAdmin();
    expect(testbedAuth.snapshot().roles).toEqual(['user']);
  });

  it('Ada keeps her subject across role changes; Grace is a different subject', () => {
    testbedAuth.signOut();
    expect(cycled().subject).toBe('ada');
    expect(cycled().subject).toBe('ada');
    testbedAuth.switchToGrace();
    expect(testbedAuth.snapshot().subject).toBe('grace');
    expect(testbedAuth.snapshot().roles).toEqual(['user']);
  });

  it('cycle returns to anonymous from Grace (she is outside the demo cycle)', () => {
    testbedAuth.switchToGrace();
    expect(cycled().authenticated).toBe(false);
  });

  it('persists the current principal by name for restore across a reload', () => {
    testbedAuth.switchToGrace();
    expect(localStorage.getItem('testbed.auth.principal')).toBe('grace');
    testbedAuth.signOut();
    expect(localStorage.getItem('testbed.auth.principal')).toBe('anonymous');
  });
});
