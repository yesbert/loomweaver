import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { RetentionUnloadGuard } from '../regions/pane/retention/retention-unload-guard';
import { IdentityChangeReload } from './identity-change';

describe('IdentityChangeReload', () => {
  const principal = (subject: string | undefined, roles: string[] = []) =>
    ({ authenticated: true, roles, claims: {}, subject }) as AuthSnapshot;

  const setup = (initial: AuthSnapshot = ANONYMOUS) => {
    TestBed.configureTestingModule({});
    const snapshot = signal<AuthSnapshot>(initial);
    const service = TestBed.inject(IdentityChangeReload);
    const reload = vi
      .spyOn(service as unknown as { reload(): void }, 'reload')
      .mockImplementation(() => undefined);
    service.start(snapshot);
    TestBed.tick();
    return { snapshot, reload };
  };

  it('does not reload on the first sign-in', () => {
    const { snapshot, reload } = setup();
    snapshot.set(principal('ada'));
    TestBed.tick();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload on sign-out', () => {
    const { snapshot, reload } = setup(principal('ada'));
    snapshot.set(ANONYMOUS);
    TestBed.tick();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when the same subject changes roles', () => {
    const { snapshot, reload } = setup(principal('ada', ['user']));
    snapshot.set(principal('ada', ['user', 'admin']));
    TestBed.tick();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads when a different subject replaces the established one', () => {
    const { snapshot, reload } = setup(principal('ada'));
    snapshot.set(principal('grace'));
    TestBed.tick();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('suppresses the dirty-work unload prompt before the identity reload', () => {
    const { snapshot, reload } = setup(principal('ada'));
    const suppress = vi.spyOn(TestBed.inject(RetentionUnloadGuard), 'suppress');
    snapshot.set(principal('grace'));
    TestBed.tick();
    expect(suppress).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads when a different subject signs in after a sign-out', () => {
    const { snapshot, reload } = setup(principal('ada'));
    snapshot.set(ANONYMOUS);
    TestBed.tick();
    snapshot.set(principal('grace'));
    TestBed.tick();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('never fires for sessions without a subject', () => {
    const { snapshot, reload } = setup();
    snapshot.set(principal(undefined));
    TestBed.tick();
    snapshot.set(principal(undefined, ['admin']));
    TestBed.tick();
    expect(reload).not.toHaveBeenCalled();
  });
});
