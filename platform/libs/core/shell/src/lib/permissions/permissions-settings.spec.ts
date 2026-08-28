import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PermissionsSettings } from './permissions-settings';
import { CapabilityGrantService } from './capability-grant.service';
import { PluginEnablementService } from '../plugin-store/lifecycle/plugin-enablement.service';
import { PluginDeploymentService } from '../plugin-store/lifecycle/plugin-deployment.service';
import { PluginIsolationLevelService } from '../foundation/plugin-isolation-level';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        settings: {
          permissionsDesc: 'Permissions desc',
          permissionsEmpty: 'No plugins are installed.',
          permissionsProvided: 'Provided by your organisation',
          pluginEnabled: 'Enabled',
          pluginLevel: {
            trusted: 'Runs inside this application',
            isolated: 'Runs isolated',
            embedded: 'Runs embedded',
          },
          pluginDisabled: 'Turned off',
          capability: { ui: 'Interface' },
          capabilityDesc: { ui: 'Dialogs and toasts' },
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('PermissionsSettings', () => {
  afterEach(() => localStorage.clear());

  function render() {
    TestBed.configureTestingModule({
      imports: [PermissionsSettings, transloco()],
    });
    TestBed.inject(PluginEnablementService).register('treaties', 'Treaties');
    TestBed.inject(CapabilityGrantService).register('treaties', ['ui'], ['ui']);
    const fixture = TestBed.createComponent(PermissionsSettings);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('states the rung a plugin runs at, and offers no switch for it', () => {
    const { fixture, host } = render();

    TestBed.inject(PluginIsolationLevelService).register('treaties', 'isolated');
    fixture.detectChanges();
    expect(host.textContent).toContain('Runs isolated');

    TestBed.inject(PluginIsolationLevelService).register('treaties', 'embedded');
    fixture.detectChanges();

    expect(host.textContent).toContain('Runs embedded');
    expect(
      host.querySelector('[data-testid="perm-level-treaties"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="perm-level-treaties"] input'),
    ).toBeNull();
  });

  it('never tells the user a trusted plugin is held back from the application', () => {
    const { host } = render();

    expect(host.textContent).not.toContain('Runs isolated');
    expect(host.textContent).not.toContain('Runs embedded');
    expect(host.textContent).toContain('Runs inside this application');
  });

  it('offers the switches for a plugin the user chose', () => {
    const { host } = render();

    expect(
      host.querySelector('[data-testid="plugin-enabled-treaties"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="perm-treaties-ui"]'),
    ).not.toBeNull();
    expect(
      host.querySelector('[data-testid="perm-provided-treaties"]'),
    ).toBeNull();
  });

  it('states what a deployed plugin holds and offers no switch to withdraw it', () => {
    const { fixture, host } = render();
    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'treaties',
        name: 'Treaties',
        entryUrl: '/treaties/plugin.html',
        capabilities: ['ui'],
        deployed: true,
      },
    ]);
    fixture.detectChanges();

    expect(host.textContent).toContain('Interface');
    expect(host.textContent).toContain('Provided by your organisation');
    expect(
      host.querySelector('[data-testid="plugin-enabled-treaties"]'),
    ).toBeNull();
    expect(host.querySelector('[data-testid="perm-treaties-ui"]')).toBeNull();
  });
});
