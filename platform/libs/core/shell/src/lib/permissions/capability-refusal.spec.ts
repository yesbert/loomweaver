import {
  Component,
  computed,
  ErrorHandler,
  inject,
  InjectionToken,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { MenuService } from '../menu/menu.service';
import { NotificationBoard } from '../notifications/notification-board';
import { HostContextFactory } from '../plugin/context/host-context-factory';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { CapabilityError } from '@loomweaver/plugin-sdk';
import { CommandService } from '../commands/command.service';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { NotificationService } from '../notifications/notification.service';
import {
  FrameRpcDeps,
  frameRpcMethods,
} from '../plugin/frame/rpc/frame-rpc-methods';
import { provideShell } from '../provide-shell';
import { CapabilityRefusalReporter } from './capability-refusal';
import { CapabilityRefusalErrorHandler } from './refusal-error-handler';
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
      providers: [
        { provide: ErrorHandler, useClass: CapabilityRefusalErrorHandler },
      ],
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

  it('lets the notice leave after the lifetime it states, action and all', () => {
    vi.useFakeTimers();
    try {
      const { handler, notifications, grants } = setup();
      revoke(grants);

      handler.handleError(new CapabilityError('ui', 'payments'));

      vi.advanceTimersByTime(7999);
      expect(notifications.notifications()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(notifications.notifications()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
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
      CapabilityRefusalErrorHandler,
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
      reportRefusal: (error: unknown) => reporter.report(error),
    } as unknown as FrameRpcDeps);

    expect(() => methods.navigateContent('quotes')).toThrow(CapabilityError);
    const [toast] = notifications.notifications();
    expect(toast?.message).toBe('permission.unavailable');
    expect(toast?.action).toBeUndefined();
  });
});

describe('a capability read a plugin kept, used in a template after the capability was revoked', () => {
  const KEPT_READ = new InjectionToken<() => boolean>('kept read');

  @Component({ selector: 'lw-kept-read', template: '{{ state() }}' })
  class KeptRead {
    private readonly signedIn = inject(KEPT_READ);
    readonly state = computed(() => (this.signedIn() ? 'in' : 'out'));
  }

  @Component({
    imports: [KeptRead],
    template: '<span>{{ redraws() }}</span><lw-kept-read />',
  })
  class Workbench {
    readonly redraws = signal(0);
  }

  function render() {
    TestBed.configureTestingModule({
      rethrowApplicationErrors: false,
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: ErrorHandler, useClass: CapabilityRefusalErrorHandler },
        { provide: ContentTabsService, useValue: {} },
        { provide: MenuService, useValue: {} },
        {
          provide: KEPT_READ,
          useFactory: () => {
            const grants = inject(CapabilityGrantService);
            grants.register('reader', ['session'], ['session']);
            return inject(HostContextFactory).create(
              'reader',
              (capability) => grants.isGranted('reader', capability),
              'trusted',
            ).session.authenticated;
          },
        },
      ],
    });
    localStorage.clear();
    const board = TestBed.inject(NotificationBoard);
    const raised = vi.spyOn(board, 'show');
    const fixture = TestBed.createComponent(Workbench);
    fixture.autoDetectChanges();
    return { fixture, raised, grants: TestBed.inject(CapabilityGrantService) };
  }

  it('tells the user once, not on every change-detection pass, and the workbench goes on drawing', async () => {
    const { fixture, raised, grants } = render();
    await fixture.whenStable();
    expect(raised).not.toHaveBeenCalled();

    grants.setGranted('reader', 'session', false);
    await fixture.whenStable();
    for (let pass = 1; pass <= 5; pass++) {
      fixture.componentInstance.redraws.set(pass);
      TestBed.tick();
      await fixture.whenStable();
    }

    expect(raised).toHaveBeenCalledTimes(1);
    expect(
      TestBed.inject(NotificationService)
        .notifications()
        .map((notice) => notice.message),
    ).toEqual(['permission.blocked']);
    expect((fixture.nativeElement as HTMLElement).textContent).toBe('5out');
    localStorage.clear();
  });
});
