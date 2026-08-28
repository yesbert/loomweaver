import { Component, EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SHELL_LAYOUT, ShellLayout } from '../layout/layout';
import { provideBarItems } from '../foundation/bar-item';
import { provideViews } from '../layout/view';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { SettingsService } from '../settings/settings.service';
import {
  CompositionReport,
  installCompositionReport,
} from './composition-report';
import { provideShellFeatures } from '../foundation/shell-features';
import type { MockInstance } from 'vitest';

const LAYOUT: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
    { id: 'main', type: 'content', dock: 'center' },
  ],
};

@Component({ selector: 'lw-stub', template: '' })
class Stub {}

function setUp(extra: (Provider | EnvironmentProviders)[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SHELL_LAYOUT, useValue: LAYOUT }, ...extra],
  });
  return {
    report: TestBed.inject(CompositionReport),
    registry: TestBed.inject(ContributionRegistry),
    settings: TestBed.inject(SettingsService),
  };
}

describe('CompositionReport (K7)', () => {
  let warn: MockInstance;
  let info: MockInstance;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
    info.mockRestore();
  });

  it('names a bar item aimed at a region the layout does not declare, and the ones it does', () => {
    const app = setUp(provideBarItems({ id: 'x', bar: 'status', slot: 'end' }));

    app.report.checkStaticContributions();

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("'status'");
    expect(message).toContain('does not declare');
    expect(message).toContain('top-bar, status-bar');
  });

  it('stays quiet when the region is there and of the right type', () => {
    const app = setUp(
      provideBarItems({ id: 'x', bar: 'status-bar', slot: 'end' }),
    );

    app.report.checkStaticContributions();

    expect(warn).not.toHaveBeenCalled();
  });

  it('reports the region type when the id exists but the anatomy is wrong', () => {
    const app = setUp(provideBarItems({ id: 'x', bar: 'main', slot: 'end' }));

    app.report.checkStaticContributions();

    expect(String(warn.mock.calls[0][0])).toContain("a 'content' region");
  });

  it('reports an omit that matched nothing, and suggests the prefix that would have', () => {
    const app = setUp();
    app.settings.register({
      id: 'shell.permissions',
      title: 'settings.permissions',
      rows: [],
    });
    app.registry.omit(['shell.permissions']);

    app.report.print();

    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("omit 'shell.permissions' matched nothing");
    expect(message).toContain("'setting:shell.permissions'");
  });

  it('says nothing about an omit that hid something, even though the omit hid it', () => {
    const app = setUp();
    app.registry.addCommand({ id: 'c.one', title: 't', run: () => undefined });
    app.registry.omit(['c.one']);

    app.report.print();

    expect(app.registry.commands()).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('reports a settings button whose command no one registers', () => {
    const app = setUp();
    app.settings.register({
      id: 'sec',
      title: 'sec',
      rows: [
        {
          id: 'sec.row',
          label: 'l',
          control: { kind: 'button', label: 'b', command: 'nobody.home' },
        },
      ],
    });

    app.report.print();

    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain('settings row "sec.row"');
    expect(message).toContain("'nobody.home'");
  });

  it('reports a menu entry whose command an omit removed', () => {
    const app = setUp();
    app.registry.addCommand({ id: 'c.one', title: 't', run: () => undefined });
    app.registry.addMenuItem({ id: 'menu:c.one', menu: 'm', command: 'c.one' });
    app.registry.omit(['c.one']);

    app.report.print();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('menu entry "menu:c.one"');
  });

  it('reports a bar button pointing at a command no one registers', () => {
    const app = setUp();
    app.registry.addBarItem({
      id: 'b.one',
      bar: 'status-bar',
      slot: 'end',
      icon: 'add',
      tooltip: 't',
      command: 'nobody.home',
    });

    app.report.print();

    expect(String(warn.mock.calls[0][0])).toContain('bar item "b.one"');
  });

  it('lists the layout and the capabilities that are switched off', () => {
    const app = setUp([provideShellFeatures({ content: { pin: false } })]);

    app.report.print();

    const message = String(info.mock.calls[0][0]);
    expect(message).toContain('top-bar (bar/top)');
    expect(message).toContain('content.pin');
  });

  it('says so plainly when a distribution switches nothing off', () => {
    const app = setUp();

    app.report.print();

    expect(String(info.mock.calls[0][0])).toContain('Capabilities off: none');
  });

  it('installs the console entry point once and never overwrites a foreign global', () => {
    const app = setUp();
    const host = window as unknown as Record<string, unknown>;
    delete host['loomweaver'];

    installCompositionReport(app.report);
    const installed = host['loomweaver'];
    installCompositionReport(app.report);

    expect(host['loomweaver']).toBe(installed);
    (installed as { report: () => void }).report();
    expect(info).toHaveBeenCalled();
    delete host['loomweaver'];
  });

  it('names a docked view aimed at a layout without any panel at all', () => {
    const app = setUp(
      provideViews({
        id: 'outline',
        region: 'primary',
        title: 't',
        order: 0,
        component: Stub,
      }),
    );

    app.report.checkStaticContributions();

    expect(String(warn.mock.calls[0][0])).toContain(
      "declares no 'panel' region",
    );
  });
});
