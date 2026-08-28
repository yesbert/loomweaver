import { Component, EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { WorkspaceService } from '../../workspace/workspace.service';
import { RailWorkspaceEntries } from './rail-workspace-entries';
import { RailItemsService, workspaceRailItemId } from './rail-items.service';
import { RailItem } from '../../foundation/rail-item';
import { provideWorkspaces } from '../../workspace/provide-workspaces';
import { provideShellFeatures } from '../../foundation/shell-features';

@Component({ selector: 'lw-rail-probe', template: '' })
class RailProbe {}

const layout = provideLayout({
  regions: [
    { id: 'activity', type: 'rail', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
  ],
});

function setup(extra: EnvironmentProviders[] = [], keepStorage = false) {
  if (!keepStorage) {
    localStorage.clear();
  }
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), layout, ...extra],
  });
  TestBed.inject(RailWorkspaceEntries).start();
  return {
    registry: TestBed.inject(ContributionRegistry),
    railItems: TestBed.inject(RailItemsService),
    workspaces: TestBed.inject(WorkspaceService),
  };
}

function railIds(registry: ContributionRegistry): string[] {
  return registry.railItems().map((item) => item.id);
}

describe('RailWorkspaceEntries', () => {
  it('adds an entry only for a workspace the user shows in that rail', async () => {
    const { registry, railItems, workspaces } = setup();
    await workspaces.saveCurrent('Quarter close');
    const [saved] = workspaces.workspaces();
    TestBed.tick();

    expect(railIds(registry)).toEqual([]);

    railItems.show(workspaceRailItemId(saved.id), 'activity');
    TestBed.tick();

    const entry = registry.railItems()[0];
    expect(entry.title).toBe('Quarter close');
    expect(entry.workspace).toBe(saved.id);
    expect(entry.rail).toBe('activity');
  });

  it('removes the entry again when the workspace is deleted', async () => {
    const { registry, railItems, workspaces } = setup();
    await workspaces.saveCurrent('Quarter close');
    const [saved] = workspaces.workspaces();
    railItems.show(workspaceRailItemId(saved.id), 'activity');
    TestBed.tick();
    expect(railIds(registry)).toHaveLength(1);

    workspaces.remove(saved.id);
    TestBed.tick();

    expect(railIds(registry)).toEqual([]);
  });

  it('follows a rename without leaving a second entry behind', async () => {
    const { registry, railItems, workspaces } = setup();
    await workspaces.saveCurrent('Quarter close');
    const [saved] = workspaces.workspaces();
    railItems.show(workspaceRailItemId(saved.id), 'activity');
    TestBed.tick();

    workspaces.rename(saved.id, 'Year end');
    TestBed.tick();

    expect(registry.railItems()).toHaveLength(1);
    expect(registry.railItems()[0].title).toBe('Year end');
  });
});

describe('RailWorkspaceEntries reporting a declared workspace nothing offers', () => {
  const DEFINITION = { id: 'acme.review', title: 'k.review' } as const;

  const twoRails = provideLayout({
    regions: [
      { id: 'activity', type: 'rail', dock: 'left' },
      { id: 'secondary', type: 'rail', dock: 'right' },
      { id: 'main', type: 'content', dock: 'center' },
    ],
  });

  function compose(entries: RailItem[]): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        twoRails,
        provideWorkspaces(DEFINITION),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const entry of entries) {
      registry.addRailItem(entry);
    }
    TestBed.inject(RailWorkspaceEntries).start();
  }

  async function render(): Promise<void> {
    const fixture = TestBed.createComponent(RailProbe);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('names a declared workspace that nothing switches to', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    compose([]);

    await render();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('acme.review'));
    warn.mockRestore();
  });

  it('stays silent when the product offers the workspace, whichever rail holds it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    compose([
      {
        id: 'acme.entry',
        rail: 'secondary',
        icon: 'workspaces',
        title: 'k.review',
        workspace: 'acme.review',
      },
    ]);

    await render();

    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('acme.review'),
    );
    warn.mockRestore();
  });
});

describe('RailWorkspaceEntries when a product keeps saved workspaces out of the rail', () => {
  it('draws no entry for one the user placed, and keeps the placement for later', async () => {
    const first = setup();
    await first.workspaces.saveCurrent('Quarter close');
    const [saved] = first.workspaces.workspaces();
    first.railItems.show(workspaceRailItemId(saved.id), 'activity');
    TestBed.tick();
    expect(railIds(first.registry)).toHaveLength(1);

    const off = setup(
      [provideShellFeatures({ workspaces: { savedInRail: false } })],
      true,
    );
    TestBed.tick();
    expect(railIds(off.registry)).toEqual([]);

    const on = setup([], true);
    TestBed.tick();
    expect(railIds(on.registry)).toEqual([workspaceRailItemId(saved.id)]);
  });

  it('leaves the entries a product declared alone', async () => {
    const { registry } = setup([
      provideShellFeatures({ workspaces: { savedInRail: false } }),
      provideWorkspaces({ id: 'app.review', title: 'Review' }),
    ]);
    registry.addRailItem({
      id: 'app.rail.review',
      rail: 'activity',
      icon: 'workspaces',
      title: 'Review',
      workspace: 'app.review',
    });
    TestBed.tick();

    expect(railIds(registry)).toContain('app.rail.review');
  });
});
