import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { RetentionUnloadGuard } from '../regions/pane/unsaved-work/retention-unload-guard';
import { PopoutWindow } from '../popout/popout-window';
import { IdentityChangeReload } from './identity-change';

describe('IdentityChangeReload', () => {
  const principal = (subject: string | undefined, roles: string[] = []) =>
    ({ authenticated: true, roles, claims: {}, subject }) as AuthSnapshot;

  const setup = (
    initial: AuthSnapshot = ANONYMOUS,
    { base = '/', popout = false, closes = true } = {},
  ) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_BASE_HREF, useValue: base },
        { provide: PopoutWindow, useValue: { active: popout } },
      ],
    });
    const snapshot = signal<AuthSnapshot>(initial);
    const service = TestBed.inject(IdentityChangeReload);
    const leaving = service as unknown as {
      openAt(url: string): void;
      closeWindow(): boolean;
    };
    const reload = vi
      .spyOn(leaving, 'openAt')
      .mockImplementation(() => undefined);
    const close = vi
      .spyOn(leaving, 'closeWindow')
      .mockImplementation(() => closes);
    service.start(snapshot);
    TestBed.tick();
    return { snapshot, reload, close };
  };

  const changePerson = (snapshot: WritableSignal<AuthSnapshot>) => {
    snapshot.set(ANONYMOUS);
    TestBed.tick();
    snapshot.set(principal('grace'));
    TestBed.tick();
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

  it('opens the application at its start rather than at the current address', () => {
    const { snapshot, reload } = setup(principal('ada'));
    changePerson(snapshot);
    expect(reload).toHaveBeenCalledExactlyOnceWith('/');
  });

  it('opens the application under the base it is served from', () => {
    const { snapshot, reload } = setup(principal('ada'), { base: '/app/' });
    changePerson(snapshot);
    expect(reload).toHaveBeenCalledExactlyOnceWith('/app/');
  });

  it('closes a pop-out window instead of opening the application in it', () => {
    const { snapshot, reload, close } = setup(principal('ada'), {
      popout: true,
    });
    changePerson(snapshot);
    expect(close).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('opens the start in a pop-out window the browser refuses to close', () => {
    const { snapshot, reload } = setup(principal('ada'), {
      popout: true,
      closes: false,
    });
    changePerson(snapshot);
    expect(reload).toHaveBeenCalledExactlyOnceWith('/');
  });

  it('never closes a window that is not a pop-out', () => {
    const { snapshot, close } = setup(principal('ada'));
    changePerson(snapshot);
    expect(close).not.toHaveBeenCalled();
  });
});
