import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { CapabilityError } from '@loomweaver/plugin-sdk';
import { CommandService } from '../commands/command.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { NotificationService } from '../notifications/notification.service';
import {
  FrameRpcDeps,
  frameRpcMethods,
} from '../plugin/sandbox/sandbox-rpc-methods';
import { provideShell } from '../provide-shell';
import {
  CapabilityRefusalReporter,
  ShellErrorHandler,
} from './capability-refusal';
import { CapabilityGrantService } from './capability-grant.service';

describe('capability refusal', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [{ provide: ErrorHandler, useClass: ShellErrorHandler }],
    });
    localStorage.clear();
    return {
      handler: TestBed.inject(ErrorHandler),
      notifications: TestBed.inject(NotificationService),
      grants: TestBed.inject(CapabilityGrantService),
    };
  }

  function revoke(grants: CapabilityGrantService): void {
    grants.register('payments', ['ui'], ['ui']);
    grants.setGranted('payments', 'ui', false);
  }

  it('tells the user about a refusal that reached nobody else, and offers the settings for a revocation', () => {
    const { handler, notifications, grants } = setup();
    revoke(grants);

    handler.handleError(new CapabilityError('ui', 'payments'));

    const [toast] = notifications.notifications();
    expect(toast?.message).toBe('permission.blocked');
    expect(toast?.action?.label).toBe('permission.openSettings');
  });

  it('does not point to the settings for a capability that was never granted', () => {
    const { handler, notifications, grants } = setup();
    grants.register('payments', ['navigation'], ['navigation']);
    const reported = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const refusal = new CapabilityError('ui', 'payments');
    handler.handleError(refusal);

    const [toast] = notifications.notifications();
    expect(toast?.message).toBe('permission.unavailable');
    expect(toast?.action).toBeUndefined();
    expect(reported).toHaveBeenCalledWith(refusal.message);
  });

  it('treats a plugin the broker never met as never granted', () => {
    const { handler, notifications } = setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    handler.handleError(new CapabilityError('ui', 'unknown'));

    expect(notifications.notifications()[0]?.message).toBe(
      'permission.unavailable',
    );
  });

  it('is the handler the workbench installs, not one a test provided', () => {
    const provided = (
      provideShell() as unknown as { provide?: unknown; useClass?: unknown }[]
    ).filter((entry) => entry.provide === ErrorHandler);

    expect(provided.map((entry) => entry.useClass)).toEqual([
      ShellErrorHandler,
    ]);
  });

  it('leaves an error that is not a refusal to the handler it had', () => {
    const { handler, notifications } = setup();
    const reported = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    handler.handleError(new Error('something else'));

    expect(notifications.notifications()).toEqual([]);
    expect(reported).toHaveBeenCalled();
  });

  it('stays quiet when a plugin in the page handles its own refusal', () => {
    const { notifications } = setup();
    const commands = TestBed.inject(CommandService);
    TestBed.inject(ContributionRegistry).addCommand({
      id: 'payments.match',
      title: 'Match',
      run: () => {
        try {
          throw new CapabilityError('ui', 'payments');
        } catch {
          return;
        }
      },
    });

    commands.execute('payments.match');

    expect(notifications.notifications()).toEqual([]);
  });

  it('tells the user about a refusal crossing the frame boundary, handled there or not', () => {
    const { notifications, grants } = setup();
    grants.register('payments', ['navigation'], ['navigation']);
    grants.setGranted('payments', 'navigation', false);
    const reporter = TestBed.inject(CapabilityRefusalReporter);
    const ctx = {
      navigateContent: () => {
        throw new CapabilityError('navigation', 'payments');
      },
    };
    const methods = frameRpcMethods({
      pluginId: 'payments',
      ctx,
      watched: new Map(),
      reportRefusal: (error: unknown) => reporter.report(error),
    } as unknown as FrameRpcDeps);

    expect(() => methods.navigateContent('quotes')).toThrow(CapabilityError);
    expect(notifications.notifications()[0]?.message).toBe(
      'permission.blocked',
    );
  });

  it('keeps a frame-boundary refusal for a capability never granted away from the settings', () => {
    const { notifications } = setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reporter = TestBed.inject(CapabilityRefusalReporter);
    const ctx = {
      navigateContent: () => {
        throw new CapabilityError('navigation', 'payments');
      },
    };
    const methods = frameRpcMethods({
      pluginId: 'payments',
      ctx,
      watched: new Map(),
      reportRefusal: (error: unknown) => reporter.report(error),
    } as unknown as FrameRpcDeps);

    expect(() => methods.navigateContent('quotes')).toThrow(CapabilityError);
    const [toast] = notifications.notifications();
    expect(toast?.message).toBe('permission.unavailable');
    expect(toast?.action).toBeUndefined();
  });
});
