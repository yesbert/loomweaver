import { demoSession } from './session';

describe('demoSession', () => {
  afterEach(() => {
    demoSession.signIn();
    localStorage.clear();
  });

  it('starts with someone signed in', () => {
    expect(demoSession.snapshot().authenticated).toBe(true);
    expect(demoSession.snapshot().displayName).toBe('Merle Behrens');
  });

  it('signs out to an anonymous snapshot, which is what takes the rail item that triggered it off screen', () => {
    demoSession.signOut();

    expect(demoSession.snapshot().authenticated).toBe(false);
    expect(demoSession.snapshot().roles).toEqual([]);
  });

  it('remembers being signed out across a reload', () => {
    demoSession.signOut();

    expect(localStorage.getItem('demo.session.signed-out')).toBe('true');
  });

  it('switches to a second account whose roles differ, and remembers it', () => {
    demoSession.switchAccount();

    expect(demoSession.snapshot().roles).toEqual(['sales']);
    expect(demoSession.snapshot().displayName).toBe('Jonas Weiler');
    expect(localStorage.getItem('demo.session.account')).toBe('1');

    demoSession.switchAccount();

    expect(demoSession.snapshot().roles).toEqual(['accounting']);
  });

  it('signs back in', () => {
    demoSession.signOut();
    demoSession.signIn();

    expect(demoSession.snapshot().authenticated).toBe(true);
    expect(localStorage.getItem('demo.session.signed-out')).toBe('false');
  });
});
