import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PermissionsSettings } from './permissions-settings';
import { CapabilityGrantService } from './capability-grant.service';
import { PluginEnablementService } from '../plugin-store/lifecycle/plugin-enablement.service';
import { PluginDeploymentService } from '../plugin-store/lifecycle/plugin-deployment.service';
import { PluginIsolationLevelService } from '../foundation/plugin-isolation-level';
import type { PluginManifest } from '@loomweaver/plugin-sdk';
import { provideRequiredPlugins } from './required-plugins';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        settings: {
          permissionsDesc: 'Permissions desc',
          permissionsEmpty: 'No plugins are installed.',
          permissionsProvided: 'Provided by your organisation',
          permissionsRequired: 'Part of this application',
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

  function render(required: readonly string[] = []) {
    TestBed.configureTestingModule({
      imports: [PermissionsSettings, transloco()],
      providers: [provideRequiredPlugins(...required)],
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

  it('offers no switch for a plugin the distribution cannot run without', () => {
    const { host } = render(['treaties']);

    expect(host.textContent).toContain('Part of this application');
    expect(
      host.querySelector('[data-testid="plugin-enabled-treaties"]'),
    ).toBeNull();
  });

  it('still lets the user withdraw what such a plugin may do', () => {
    const { host } = render(['treaties']);

    expect(host.textContent).toContain('Interface');
    expect(
      host.querySelector('[data-testid="perm-treaties-ui"]'),
    ).not.toBeNull();
  });

  it('shows a required plugin as on even where the user had switched it off', () => {
    localStorage.setItem('lw.shell.disabled-plugins', JSON.stringify(['treaties']));
    const { host } = render(['treaties']);

    expect(host.textContent).not.toContain('Turned off');
    expect(host.textContent).toContain('Interface');
    expect(
      host.querySelector('[data-testid="plugin-enabled-treaties"]'),
    ).toBeNull();
  });

  it('keeps the switch for a plugin nobody declared required', () => {
    const { host } = render(['something-else']);

    expect(host.textContent).not.toContain('Part of this application');
    expect(
      host.querySelector('[data-testid="plugin-enabled-treaties"]'),
    ).not.toBeNull();
  });

  it('ignores a plugin that claims to be required in its own manifest', () => {
    const manifest = {
      id: 'treaties',
      name: 'Treaties',
      required: true,
      essential: true,
    } as unknown as PluginManifest;
    const { host } = render();

    TestBed.inject(PluginEnablementService).register(
      manifest.id,
      manifest.name ?? manifest.id,
    );

    expect(host.textContent).not.toContain('Part of this application');
    expect(
      host.querySelector('[data-testid="plugin-enabled-treaties"]'),
    ).not.toBeNull();
  });
});
