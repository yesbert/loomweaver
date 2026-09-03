import { ApplicationRef, Injector } from '@angular/core';
import { FeatureSwitches } from './features/feature-switches.service';
import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from './plugin/contribution-registry';
import { HostCommandDeps, seedHostCommands } from './shell-seeds';
import { BuiltInMenuDeps, seedBuiltInMenus } from './shell-menu-seeds';
import {
  provideShellFeatures,
  ShellFeaturesInput,
} from './foundation/shell-features';

const layout = {
  regions: [
    { type: 'rail', dock: 'left' },
    { type: 'rail', dock: 'right' },
    { type: 'panel', dock: 'left' },
    { type: 'panel', dock: 'right' },
    { type: 'content' },
  ],
};

function switchesFor(input: ShellFeaturesInput): FeatureSwitches {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideShellFeatures(input)] });
  return TestBed.inject(FeatureSwitches);
}

function flush(): void {
  TestBed.inject(ApplicationRef).tick();
}

function seed(input: ShellFeaturesInput): ContributionRegistry {
  const features = switchesFor(input);
  const registry = TestBed.inject(ContributionRegistry);
  seedBuiltInMenus(registry, layout, {
    popout: { active: false },
    features,
    injector: TestBed.inject(Injector),
  } as unknown as BuiltInMenuDeps);
  flush();
  return registry;
}

function commandIds(registry: ContributionRegistry): readonly string[] {
  return registry.commands().map((command) => command.id);
}

function seedCommands(input: ShellFeaturesInput): ContributionRegistry {
  const features = switchesFor(input);
  const registry = TestBed.inject(ContributionRegistry);
  seedHostCommands(registry, layout, {
    popout: { active: false },
    features,
    injector: TestBed.inject(Injector),
  } as unknown as HostCommandDeps);
  flush();
  return registry;
}

describe('seedHostCommands (K1d: workspaces)', () => {
  it('registers the workspace commands with the full workbench', () => {
    const ids = commandIds(seedCommands({}));

    expect(ids).toEqual(
      expect.arrayContaining([
        'shell.workspace.manage',
        'shell.workspace.reset',
      ]),
    );
  });

  it('registers neither where workspaces are off, and keeps the rest', () => {
    const ids = commandIds(seedCommands({ workspaces: { enabled: false } }));

    expect(ids).not.toContain('shell.workspace.manage');
    expect(ids).not.toContain('shell.workspace.reset');
    expect(ids).toContain('shell.openSettings');
    expect(ids).toContain('shell.content.splitRight');
  });
});

describe('seedHostCommands (K5: curation commands)', () => {
  it('registers both customise commands with the full workbench', () => {
    const ids = commandIds(seedCommands({}));

    expect(ids).toEqual(
      expect.arrayContaining(['shell.rail.customize', 'shell.views.customize']),
    );
  });

  it('drops the command whose capability is off', () => {
    const ids = commandIds(
      seedCommands({ rail: { curate: false }, sidebar: { curate: false } }),
    );

    expect(ids).not.toContain('shell.rail.customize');
    expect(ids).not.toContain('shell.views.customize');
  });

  it('registers neither where the layout has no rail and no panel', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(ContributionRegistry);
    seedHostCommands(registry, { regions: [{ type: 'content' }] }, {
      popout: { active: false },
      features: TestBed.inject(FeatureSwitches),
      injector: TestBed.inject(Injector),
    } as unknown as HostCommandDeps);
    flush();

    const ids = commandIds(registry);
    expect(ids).not.toContain('shell.rail.customize');
    expect(ids).not.toContain('shell.views.customize');
    expect(ids).toContain('shell.openSettings');
  });
});

describe('seedHostCommands (dialogs that hold the top edge)', () => {
  function optionsOf(id: string): Record<string, unknown> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(ContributionRegistry);
    const opened: Record<string, unknown>[] = [];
    seedHostCommands(registry, layout, {
      popout: { active: false },
      features: TestBed.inject(FeatureSwitches),
      injector: TestBed.inject(Injector),
      dialogs: {
        open: (_component: unknown, options: Record<string, unknown>) =>
          void opened.push(options),
      },
    } as unknown as HostCommandDeps);
    flush();
    registry
      .commands()
      .find((command) => command.id === id)
      ?.run?.();
    return opened[0];
  }

  it('opens both curation dialogs bare and anchored to the top edge', () => {
    expect(optionsOf('shell.rail.customize')).toMatchObject({
      bare: true,
      align: 'top',
    });
    expect(optionsOf('shell.views.customize')).toMatchObject({
      bare: true,
      align: 'top',
    });
  });

  it('anchors the workspace dialog to the top edge as well', () => {
    expect(optionsOf('shell.workspace.manage')).toMatchObject({
      align: 'top',
    });
  });
});

describe('seedHostCommands (K6: app reset)', () => {
  it('registers the app reset even where workspaces are off', () => {
    const ids = commandIds(seedCommands({ workspaces: { enabled: false } }));

    expect(ids).toContain('shell.app.reset');
    expect(ids).not.toContain('shell.workspace.reset');
  });
});

describe('seedBuiltInMenus (K1c: sidebar and rail capabilities)', () => {
  it('registers every sidebar and rail entry with the full workbench', () => {
    const ids = commandIds(seed({}));

    expect(ids).toEqual(
      expect.arrayContaining([
        'shell.view.moveToOtherSidebar',
        'shell.view.stackBelow',
        'shell.view.openInContent',
        'shell.view.resetState',
        'shell.view.hide',
        'shell.rail.hideItem',
        'shell.rail.moveToOtherRail',
      ]),
    );
  });

  it('drops each entry with its capability', () => {
    const registry = seed({
      sidebar: {
        moveViews: false,
        stackViews: false,
        openViewInContent: false,
        resetViewState: false,
        hideViews: false,
      },
      rail: { hideItems: false, moveItems: false },
    });
    const ids = commandIds(registry);

    expect(ids).not.toContain('shell.view.moveToOtherSidebar');
    expect(ids).not.toContain('shell.view.stackBelow');
    expect(ids).not.toContain('shell.view.openInContent');
    expect(ids).not.toContain('shell.view.resetState');
    expect(ids).not.toContain('shell.view.hide');
    expect(ids).not.toContain('shell.rail.hideItem');
    expect(ids).not.toContain('shell.rail.moveToOtherRail');
    expect(ids).toContain('shell.view.openInWindow');
    expect(registry.menuItems().map((item) => item.command)).not.toContain(
      'shell.view.stackBelow',
    );
  });

  it('drops both pop-out entries where windows are off (K1d)', () => {
    const ids = commandIds(seed({ windows: { popout: false } }));

    expect(ids).not.toContain('shell.view.openInWindow');
    expect(ids).not.toContain('shell.tab.openInWindow');
    expect(ids).toContain('shell.tab.close');
  });
});

describe('the seeds follow the switches live', () => {
  it('registers the split command when its switch turns on, and drops it when it turns off', () => {
    const registry = seedCommands({ content: { splitRight: false } });
    expect(commandIds(registry)).not.toContain('shell.content.splitRight');

    TestBed.inject(FeatureSwitches).update({ content: { splitRight: true } });
    flush();

    const split = registry
      .commands()
      .find((command) => command.id === 'shell.content.splitRight');
    expect(split?.shortcut).toBe('mod+\\');
    expect(split?.paletteHidden).not.toBe(true);

    TestBed.inject(FeatureSwitches).update({ content: { splitRight: false } });
    flush();

    expect(commandIds(registry)).not.toContain('shell.content.splitRight');
  });

  it('the workspace commands come and go together with their switch', () => {
    const registry = seedCommands({ workspaces: { enabled: false } });
    expect(commandIds(registry)).not.toContain('shell.workspace.manage');

    TestBed.inject(FeatureSwitches).update({ workspaces: { enabled: true } });
    flush();
    expect(commandIds(registry)).toEqual(
      expect.arrayContaining([
        'shell.workspace.manage',
        'shell.workspace.reset',
      ]),
    );

    TestBed.inject(FeatureSwitches).update({ workspaces: { enabled: false } });
    flush();
    expect(commandIds(registry)).not.toContain('shell.workspace.manage');
    expect(commandIds(registry)).not.toContain('shell.workspace.reset');
  });

  it('a menu entry follows its switch', () => {
    const registry = seed({ sidebar: { hideViews: false } });
    const menuCommands = () => registry.menuItems().map((item) => item.command);
    expect(menuCommands()).not.toContain('shell.view.hide');

    TestBed.inject(FeatureSwitches).update({ sidebar: { hideViews: true } });
    flush();
    expect(menuCommands()).toContain('shell.view.hide');
    expect(commandIds(registry)).toContain('shell.view.hide');

    TestBed.inject(FeatureSwitches).update({ sidebar: { hideViews: false } });
    flush();
    expect(menuCommands()).not.toContain('shell.view.hide');
    expect(commandIds(registry)).not.toContain('shell.view.hide');
  });
});
