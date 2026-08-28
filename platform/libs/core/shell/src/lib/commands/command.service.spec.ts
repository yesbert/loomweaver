import { ErrorHandler, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ANONYMOUS, AuthSnapshot, CapabilityError } from '@loomweaver/plugin-sdk';
import { CommandService } from './command.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { AUTH_SOURCE } from '../auth/auth-context';
import { NotificationService } from '../notifications/notification.service';
import { ShellErrorHandler } from '../permissions/capability-refusal';
import { provideShellFeatures } from '../foundation/shell-features';
import { PaletteMruService } from './palette-mru.service';

describe('CommandService', () => {
  let commands: CommandService;
  let registry: ContributionRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: ShellErrorHandler }],
    });
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
  });

  it('formats a command shortcut for display, and withholds it where shortcuts are off', () => {
    const command = {
      id: 'do.thing',
      title: 't',
      shortcut: 'mod+k',
      run: vi.fn(),
    };

    expect(commands.shortcutOf(command)).toMatch(/K$/);
    expect(
      commands.shortcutOf({ id: 'x', title: 't', run: vi.fn() }),
    ).toBeUndefined();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideShellFeatures({ commands: { shortcuts: false } })],
    });

    expect(TestBed.inject(CommandService).shortcutOf(command)).toBeUndefined();
  });

  it('leaves the recently-used record alone for an item in the chrome', () => {
    localStorage.clear();
    const mru = TestBed.inject(PaletteMruService);
    const run = vi.fn();
    registry.addCommand({ id: 'do.thing', title: 't', run });

    commands.trigger({ command: 'do.thing' });
    commands.execute('do.thing');

    expect(run).toHaveBeenCalledTimes(2);
    expect(mru.ids()).toEqual([]);
    expect(localStorage.getItem('lw.shell.command-mru')).toBeNull();
  });

  it('calls an item triggerable only where its trigger leads somewhere', () => {
    registry.addCommand({ id: 'do.thing', title: 't', run: vi.fn() });

    expect(commands.triggerable({ command: 'do.thing' })).toBe(true);
    expect(commands.triggerable({ command: 'do.ghost' })).toBe(false);
    expect(commands.triggerable({ run: vi.fn() })).toBe(true);
    expect(commands.triggerable({})).toBe(false);
  });

  it('executes a registered command by id', () => {
    const run = vi.fn();
    registry.addCommand({ id: 'do.thing', title: 't', run });

    commands.execute('do.thing');

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('warns and does nothing for an unknown command id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    commands.execute('missing');

    expect(warn).toHaveBeenCalledWith('Command "missing" is not registered.');
    warn.mockRestore();
  });

  it('triggers the bound command when an item names one', () => {
    const run = vi.fn();
    registry.addCommand({ id: 'do.thing', title: 't', run });

    commands.trigger({ command: 'do.thing' });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('falls back to an item inline callback when it names no command', () => {
    const run = vi.fn();

    commands.trigger({ run });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('prefers the bound command over an inline callback', () => {
    const commandRun = vi.fn();
    const inlineRun = vi.fn();
    registry.addCommand({ id: 'do.thing', title: 't', run: commandRun });

    commands.trigger({ command: 'do.thing', run: inlineRun });

    expect(commandRun).toHaveBeenCalledTimes(1);
    expect(inlineRun).not.toHaveBeenCalled();
  });

  it('logs a rejection from an async command instead of leaving it unhandled', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const failure = Promise.reject(new Error('boom'));
    registry.addCommand({ id: 'do.async', title: 't', run: () => failure });

    commands.execute('do.async');
    await failure.catch(() => undefined);

    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('logs a synchronous throw from a command', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    registry.addCommand({
      id: 'do.throw',
      title: 't',
      run: () => {
        throw new Error('boom');
      },
    });

    commands.execute('do.throw');

    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('surfaces a denied capability as a warning toast, not a silent console error', () => {
    const show = vi.spyOn(TestBed.inject(NotificationService), 'show');
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    registry.addCommand({
      id: 'do.gated',
      title: 't',
      run: () => {
        throw new CapabilityError('ui', 'p');
      },
    });

    commands.execute('do.gated');

    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'warning',
        message: 'permission.blocked',
      }),
    );
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('CommandService auth gating', () => {
  let auth: WritableSignal<AuthSnapshot>;
  let registry: ContributionRegistry;
  let commands: CommandService;

  beforeEach(() => {
    auth = signal<AuthSnapshot>(ANONYMOUS);
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SOURCE, useValue: auth }],
    });
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
  });

  it('blocks an unmet command and runs it once the session qualifies', () => {
    const run = vi.fn();
    registry.addCommand({
      id: 'secret',
      title: 't',
      access: { anyRole: ['admin'] },
      run,
    });

    commands.execute('secret');
    expect(run).not.toHaveBeenCalled();

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    commands.execute('secret');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('available() reflects whether the session may run the command', () => {
    const command = {
      id: 'secret',
      title: 't',
      access: { anyRole: ['admin'] },
      run: () => undefined,
    };
    expect(commands.available(command)).toBe(false);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(commands.available(command)).toBe(true);
  });
});

describe('CommandService window scope (popout)', () => {
  const cmd = { id: 'go.somewhere', title: 't', run: vi.fn() };

  function setUpAt(pathname: string) {
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
    registry.addCommand(cmd);
    return TestBed.inject(CommandService);
  }

  beforeEach(() => cmd.run.mockClear());

  it('leaves an unmarked command alone in the main window', () => {
    const commands = setUpAt('/entry/e-01');

    expect(commands.available(cmd)).toBe(true);
    commands.execute('go.somewhere');
    expect(cmd.run).toHaveBeenCalledTimes(1);
  });

  it('withholds an unmarked command in a pop-out, for every trigger alike', () => {
    const commands = setUpAt('/popout/search');

    expect(commands.available(cmd)).toBe(false);
    commands.execute('go.somewhere');
    expect(cmd.run).not.toHaveBeenCalled();
  });

  it('offers a command that declares popout, in a pop-out', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            location: { pathname: '/popout/search' },
          } as unknown as Document,
        },
      ],
    });
    const run = vi.fn();
    TestBed.inject(ContributionRegistry).addCommand({
      id: 'works.anywhere',
      title: 't',
      popout: true,
      run,
    });

    TestBed.inject(CommandService).execute('works.anywhere');

    expect(run).toHaveBeenCalledTimes(1);
  });
});
