import { ErrorHandler, WritableSignal, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ANONYMOUS, AuthSnapshot, Command } from '@loomweaver/plugin-sdk';
import { CommandInvocationService } from './command-invocation.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { AUTH_SOURCE } from '../auth/auth-context';
import { ShellErrorHandler } from '../permissions/capability-refusal';
import { NotificationService } from '../notifications/notification.service';
import { PaletteMruService } from './palette-mru.service';

const CALLER = 'caller-plugin';
const OTHER = 'other-plugin';

function open(command: Command): Command {
  return { ...command, callable: true };
}

describe('CommandInvocationService', () => {
  let invocation: CommandInvocationService;
  let registry: ContributionRegistry;
  let auth: WritableSignal<AuthSnapshot>;

  beforeEach(() => {
    auth = signal<AuthSnapshot>(ANONYMOUS);
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_SOURCE, useValue: auth },
        { provide: ErrorHandler, useClass: ShellErrorHandler },
      ],
    });
    registry = TestBed.inject(ContributionRegistry);
    invocation = TestBed.inject(CommandInvocationService);
  });

  describe('reaching a command', () => {
    it('runs a command another plugin opened, and hands back its answer', async () => {
      registry.addCommand(
        open({
          id: 'other.count',
          title: 'Count',
          answers: 'How many rows there are',
          run: () => ({ rows: 3 }),
        }),
        OTHER,
      );

      const outcome = await invocation.invoke(CALLER, true, 'other.count');

      expect(outcome).toEqual({ outcome: 'answered', value: { rows: 3 } });
    });

    it('answers without a value where the command declares none', async () => {
      const run = vi.fn(() => 'ignored');
      registry.addCommand(open({ id: 'other.go', title: 'Go', run }), OTHER);

      expect(await invocation.invoke(CALLER, true, 'other.go')).toEqual({
        outcome: 'answered',
      });
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('refuses a command another plugin never opened', async () => {
      const run = vi.fn();
      registry.addCommand({ id: 'other.closed', title: 'C', run }, OTHER);

      const outcome = await invocation.invoke(CALLER, true, 'other.closed');

      expect(outcome).toMatchObject({ outcome: 'refused', reason: 'unavailable' });
      expect(run).not.toHaveBeenCalled();
    });

    it('runs a caller its own command even where it declared nothing', async () => {
      const run = vi.fn();
      registry.addCommand({ id: 'mine.quiet', title: 'Q', run }, CALLER);

      expect(await invocation.invoke(CALLER, false, 'mine.quiet')).toEqual({
        outcome: 'answered',
      });
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('refuses an id nothing registered, exactly as it refuses a closed one', async () => {
      registry.addCommand({ id: 'other.closed', title: 'C', run: vi.fn() }, OTHER);

      const ghost = await invocation.invoke(CALLER, true, 'nothing.here');
      const closed = await invocation.invoke(CALLER, true, 'other.closed');

      expect(ghost).toEqual(closed);
    });

    it('refuses an opened command the session does not qualify for', async () => {
      const run = vi.fn();
      registry.addCommand(
        open({
          id: 'other.admin',
          title: 'Admin',
          access: { anyRole: ['admin'] },
          run,
        }),
        OTHER,
      );

      expect(await invocation.invoke(CALLER, true, 'other.admin')).toMatchObject(
        { outcome: 'refused', reason: 'unavailable' },
      );
      expect(run).not.toHaveBeenCalled();

      auth.set({ authenticated: true, roles: ['admin'], claims: {} });

      expect(await invocation.invoke(CALLER, true, 'other.admin')).toEqual({
        outcome: 'answered',
      });
    });
  });

  describe('arguments and answers', () => {
    beforeEach(() => {
      registry.addCommand(
        open({
          id: 'other.open',
          title: 'Open',
          arguments: [
            { name: 'path', kind: 'text', description: 'Where', required: true },
          ],
          answers: 'The path it opened',
          run: (_context, args) => args?.['path'],
        }),
        OTHER,
      );
    });

    it('passes checked arguments through to the command', async () => {
      expect(
        await invocation.invoke(CALLER, true, 'other.open', { path: 'a/b' }),
      ).toEqual({ outcome: 'answered', value: 'a/b' });
    });

    it('refuses a missing required argument before the command runs', async () => {
      expect(await invocation.invoke(CALLER, true, 'other.open')).toMatchObject({
        outcome: 'refused',
        reason: 'invalid-arguments',
      });
    });

    it('refuses a value of the wrong kind', async () => {
      expect(
        await invocation.invoke(CALLER, true, 'other.open', { path: 4 }),
      ).toMatchObject({ outcome: 'refused', reason: 'invalid-arguments' });
    });

    it('checks the grant before it checks the arguments', async () => {
      expect(
        await invocation.invoke(CALLER, false, 'other.open', { path: 4 }),
      ).toMatchObject({ outcome: 'refused', reason: 'unavailable' });
    });

    it('reports an answer that could not be carried as a failure, not as an answer', async () => {
      registry.addCommand(
        open({
          id: 'other.handle',
          title: 'Handle',
          answers: 'A handle',
          run: () => ({ dispose: () => undefined }),
        }),
        OTHER,
      );

      expect(await invocation.invoke(CALLER, true, 'other.handle')).toMatchObject(
        { outcome: 'failed' },
      );
    });
  });

  describe('failures and loops', () => {
    it('tells a refusal from a failure, and neither from an answer', async () => {
      registry.addCommand(
        open({
          id: 'other.boom',
          title: 'Boom',
          run: () => {
            throw new Error('it broke');
          },
        }),
        OTHER,
      );

      const failure = await invocation.invoke(CALLER, true, 'other.boom');
      const refusal = await invocation.invoke(CALLER, true, 'other.ghost');

      expect(failure).toEqual({ outcome: 'failed', message: 'it broke' });
      expect(refusal.outcome).toBe('refused');
    });

    it('reports a failing command through the shell error handler', async () => {
      const errors = TestBed.inject(ErrorHandler);
      const handled = vi.spyOn(errors, 'handleError');
      registry.addCommand(
        open({
          id: 'other.reject',
          title: 'Reject',
          run: () => Promise.reject(new Error('later')),
        }),
        OTHER,
      );

      await invocation.invoke(CALLER, true, 'other.reject');

      expect(handled).toHaveBeenCalled();
    });

    it('leaves the recently-used record alone, because nothing chose it', async () => {
      localStorage.clear();
      const mru = TestBed.inject(PaletteMruService);
      registry.addCommand(open({ id: 'other.go', title: 'Go', run: vi.fn() }), OTHER);

      expect((await invocation.invoke(CALLER, true, 'other.go')).outcome).toBe(
        'answered',
      );
      expect(mru.ids()).toEqual([]);
      expect(localStorage.getItem('lw.shell.command-mru')).toBeNull();
    });

    it('refuses a chain that has become a loop', async () => {
      const seen: string[] = [];
      registry.addCommand(
        open({
          id: 'other.loop',
          title: 'Loop',
          run: async () => {
            const nested = await invocation.invoke(CALLER, true, 'other.loop');
            seen.push(
              nested.outcome === 'refused' ? nested.reason : nested.outcome,
            );
          },
        }),
        OTHER,
      );

      await invocation.invoke(CALLER, true, 'other.loop');

      expect(seen).toContain('too-deep');
      expect(seen.length).toBeLessThan(20);
    });

    it('tells the user when a plugin is refused for lack of the grant', async () => {
      const notifications = TestBed.inject(NotificationService);
      const shown = vi.spyOn(notifications, 'show');
      registry.addCommand(open({ id: 'other.go', title: 'Go', run: vi.fn() }), OTHER);

      await invocation.invoke(CALLER, false, 'other.go');

      expect(shown).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'permission-blocked' }),
      );
    });
  });

  describe('enumeration', () => {
    beforeEach(() => {
      registry.addCommand(
        open({
          id: 'other.zebra',
          title: 'Zebra',
          description: 'The last one',
          run: vi.fn(),
        }),
        OTHER,
      );
      registry.addCommand(
        open({ id: 'other.apple', title: 'Apple', run: vi.fn() }),
        OTHER,
      );
      registry.addCommand({ id: 'other.closed', title: 'Closed', run: vi.fn() }, OTHER);
    });

    it('lists what is open, ordered by id, and nothing else', () => {
      expect(invocation.invocable(CALLER, true).map((entry) => entry.id)).toEqual(
        ['other.apple', 'other.zebra'],
      );
    });

    it('describes what a command takes without running it', () => {
      const run = vi.fn();
      registry.addCommand(
        open({
          id: 'other.open',
          title: 'Open',
          arguments: [
            { name: 'path', kind: 'text', description: 'Where', required: true },
            {
              name: 'mode',
              kind: 'choice',
              choices: ['preview', 'permanent'],
              description: 'How',
            },
          ],
          run,
        }),
        OTHER,
      );

      const listed = invocation
        .invocable(CALLER, true)
        .find((entry) => entry.id === 'other.open');

      expect(listed?.arguments).toEqual([
        { name: 'path', kind: 'text', description: 'Where', required: true },
        {
          name: 'mode',
          kind: 'choice',
          choices: ['preview', 'permanent'],
          description: 'How',
        },
      ]);
      expect(run).not.toHaveBeenCalled();
    });

    it('carries the description where there is one, and none where there is not', () => {
      const listed = invocation.invocable(CALLER, true);

      expect(listed[0].description).toBeUndefined();
      expect(listed[1].description).toBe('The last one');
    });

    it('holds nothing beyond the caller´s own without the grant', () => {
      registry.addCommand(open({ id: 'mine.open', title: 'M', run: vi.fn() }), CALLER);

      expect(invocation.invocable(CALLER, false).map((entry) => entry.id)).toEqual(
        ['mine.open'],
      );
    });

    it('omits a command its own plugin never opened', () => {
      registry.addCommand({ id: 'mine.quiet', title: 'Q', run: vi.fn() }, CALLER);

      expect(invocation.invocable(CALLER, true).map((entry) => entry.id)).not.toContain(
        'mine.quiet',
      );
    });

    it('lists only what would actually run', async () => {
      registry.addCommand(
        open({
          id: 'other.admin',
          title: 'Admin',
          access: { anyRole: ['admin'] },
          run: vi.fn(),
        }),
        OTHER,
      );

      expect(invocation.invocable(CALLER, true).map((e) => e.id)).not.toContain(
        'other.admin',
      );

      for (const entry of invocation.invocable(CALLER, true)) {
        expect(
          (await invocation.invoke(CALLER, true, entry.id)).outcome,
        ).not.toBe('refused');
      }
    });

    it('lists a command once the session qualifies for it', () => {
      registry.addCommand(
        open({
          id: 'other.admin',
          title: 'Admin',
          access: { anyRole: ['admin'] },
          run: vi.fn(),
        }),
        OTHER,
      );
      auth.set({ authenticated: true, roles: ['admin'], claims: {} });

      expect(invocation.invocable(CALLER, true).map((e) => e.id)).toContain(
        'other.admin',
      );
    });

    it('drops a command when the plugin that registered it goes away', () => {
      const handle = registry.addCommand(
        open({ id: 'other.temp', title: 'T', run: vi.fn() }),
        OTHER,
      );

      expect(invocation.invocable(CALLER, true).map((e) => e.id)).toContain(
        'other.temp',
      );

      handle.dispose();

      expect(invocation.invocable(CALLER, true).map((e) => e.id)).not.toContain(
        'other.temp',
      );
    });
  });
});

describe('CommandInvocationService in a window of its own', () => {
  function setUpAt(pathname: string): CommandInvocationService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: { location: { pathname } } as unknown as Document,
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand(open({ id: 'other.main', title: 'M', run: vi.fn() }), OTHER);
    registry.addCommand(
      open({ id: 'other.anywhere', title: 'A', popout: true, run: vi.fn() }),
      OTHER,
    );
    return TestBed.inject(CommandInvocationService);
  }

  it('lists and runs only what declared itself suitable there', async () => {
    const invocation = setUpAt('/popout/search');

    expect(invocation.invocable(CALLER, true).map((e) => e.id)).toEqual([
      'other.anywhere',
    ]);
    expect(await invocation.invoke(CALLER, true, 'other.main')).toMatchObject({
      outcome: 'refused',
      reason: 'unavailable',
    });
  });

  it('leaves the main window alone', () => {
    const invocation = setUpAt('/entry/e-01');

    expect(invocation.invocable(CALLER, true).map((e) => e.id)).toEqual([
      'other.anywhere',
      'other.main',
    ]);
  });
});
