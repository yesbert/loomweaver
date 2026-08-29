import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from './plugin/contribution-registry';
import {
  BuiltInMenuDeps,
  HostCommandDeps,
  seedBuiltInMenus,
  seedHostCommands,
} from './shell-seeds';
import {
  DEFAULT_SHELL_FEATURES,
  ShellFeatures,
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

function features(input: ShellFeaturesInput): ShellFeatures {
  return {
    content: { ...DEFAULT_SHELL_FEATURES.content, ...input.content },
    sidebar: { ...DEFAULT_SHELL_FEATURES.sidebar, ...input.sidebar },
    rail: { ...DEFAULT_SHELL_FEATURES.rail, ...input.rail },
    workspaces: {
      ...DEFAULT_SHELL_FEATURES.workspaces,
      ...input.workspaces,
    },
    windows: { ...DEFAULT_SHELL_FEATURES.windows, ...input.windows },
    commands: { ...DEFAULT_SHELL_FEATURES.commands, ...input.commands },
  };
}

function seed(input: ShellFeaturesInput): ContributionRegistry {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  const registry = TestBed.inject(ContributionRegistry);
  seedBuiltInMenus(registry, layout, {
    popout: { active: false },
    features: features(input),
  } as unknown as BuiltInMenuDeps);
  return registry;
}

function commandIds(registry: ContributionRegistry): readonly string[] {
  return registry.commands().map((command) => command.id);
}

function seedCommands(input: ShellFeaturesInput): ContributionRegistry {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  const registry = TestBed.inject(ContributionRegistry);
  seedHostCommands(registry, layout, {
    popout: { active: false },
    features: features(input),
  } as unknown as HostCommandDeps);
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
      features: features({}),
      } as unknown as HostCommandDeps);

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
      features: features({}),
      dialogs: {
        open: (_component: unknown, options: Record<string, unknown>) =>
          void opened.push(options),
      },
    } as unknown as HostCommandDeps);
    registry.commands().find((command) => command.id === id)?.run?.();
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
