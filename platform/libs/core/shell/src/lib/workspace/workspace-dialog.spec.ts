import { DialogRef } from '@loomweaver/plugin-sdk';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { DialogService } from '../dialog/dialog.service';
import { CommandService } from '../commands/command.service';
import {
  BUILT_IN_WORKSPACE_ID,
  offersBuiltInWorkspace,
} from './declaration/composed-definitions';
import { WorkspaceCatalog } from './catalog/workspace-catalog';
import { WorkspaceDefinition } from './declaration/workspace-definition';
import { WorkspaceService } from './workspace.service';
import { WorkspaceDialog } from './workspace-dialog';
import { type Workspace } from './catalog/saved-workspaces';
import { UnusableWorkspacesService } from './usability/unusable-workspaces.service';
import { assignWorkspaceInitials } from './workspace-initials';

interface DialogInternals {
  readonly offersBuiltIn: boolean;
  tab(): 'mine' | 'provided';
  originName(id: string): string | null;
}

const DEFINITIONS: readonly WorkspaceDefinition[] = [
  { id: 'app.review', title: 'k.review', content: { tabs: ['search'] } },
];

function build(
  activeId: string,
  definitions = DEFINITIONS,
  origins: Readonly<Record<string, string | null>> = {},
): DialogInternals {
  const ws = {
    workspaces: signal([]),
    definitions,
    activeId: signal(activeId),
    hasChanges: signal(false),
    changedIds: signal(new Set<string>()),
  };
  const catalog = {
    offersBuiltIn: offersBuiltInWorkspace(definitions),
    originOf: (id: string) => origins[id] ?? null,
    definitionOf: (id: string) =>
      definitions.find((definition) => definition.id === id),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: WorkspaceService, useValue: ws },
      { provide: WorkspaceCatalog, useValue: catalog },
      { provide: DialogRef, useValue: { close: () => undefined } },
      { provide: DialogService, useValue: {} },
      { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      { provide: CommandService, useValue: { execute: () => undefined } },
    ],
  });
  TestBed.overrideComponent(WorkspaceDialog, {
    set: { template: '', imports: [] },
  });
  const fixture = TestBed.createComponent(WorkspaceDialog);
  fixture.detectChanges();
  return fixture.componentInstance as unknown as DialogInternals;
}

describe('WorkspaceDialog (two lists)', () => {
  it('opens on the provided list when a provided workspace is active', () => {
    expect(build('app.review').tab()).toBe('provided');
  });

  it('opens on the user list when the default workspace is active', () => {
    expect(build(BUILT_IN_WORKSPACE_ID).tab()).toBe('mine');
  });

  it('opens on the user list when a saved workspace is active', () => {
    expect(build('ws-42').tab()).toBe('mine');
  });

  it('opens on the user list when the distribution ships none', () => {
    expect(build(BUILT_IN_WORKSPACE_ID, []).tab()).toBe('mine');
  });
});

describe('WorkspaceDialog (the built-in workspace)', () => {
  it('offers it where the distribution declares no initial workspace', () => {
    expect(build(BUILT_IN_WORKSPACE_ID).offersBuiltIn).toBe(true);
  });

  it('does not offer it beside a declared initial workspace', () => {
    const dialog = build('app.review', [{ ...DEFINITIONS[0], initial: true }]);

    expect(dialog.offersBuiltIn).toBe(false);
  });
});

describe('WorkspaceDialog (where a variant came from)', () => {
  it('names the workspace a variant was saved from', () => {
    const dialog = build(BUILT_IN_WORKSPACE_ID, DEFINITIONS, {
      mine: 'app.review',
    });

    expect(dialog.originName('mine')).toBe('k.review');
  });

  it('says nothing where a variant has no origin left to name', () => {
    const dialog = build(BUILT_IN_WORKSPACE_ID, DEFINITIONS, { mine: 'gone' });

    expect(dialog.originName('mine')).toBeNull();
  });
});

function render(
  saved: readonly Workspace[],
  origins: Readonly<Record<string, string | null>> = {},
): HTMLElement {
  const ws = {
    workspaces: signal(saved),
    initials: signal(assignWorkspaceInitials(saved)),
    definitions: DEFINITIONS,
    activeId: signal(BUILT_IN_WORKSPACE_ID),
    hasChanges: signal(false),
    changedIds: signal(new Set<string>()),
  };
  const catalog = {
    offersBuiltIn: true,
    originOf: (id: string) => origins[id] ?? null,
    definitionOf: (id: string) =>
      DEFINITIONS.find((definition) => definition.id === id),
  };
  TestBed.configureTestingModule({
    imports: [
      WorkspaceDialog,
      TranslocoTestingModule.forRoot({
        langs: {
          en: {
            k: { review: 'Review' },
            workspace: { variantOf: 'Variant of {{name}}' },
          },
        },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      { provide: WorkspaceService, useValue: ws },
      { provide: WorkspaceCatalog, useValue: catalog },
      {
        provide: UnusableWorkspacesService,
        useValue: { ids: () => new Set<string>() },
      },
      { provide: DialogRef, useValue: { close: () => undefined } },
      { provide: DialogService, useValue: {} },
      { provide: CommandService, useValue: { execute: () => undefined } },
    ],
  });
  const fixture = TestBed.createComponent(WorkspaceDialog);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function switchButton(host: HTMLElement): HTMLButtonElement {
  const button = host
    .querySelector('[data-testid="workspace-initials"]')
    ?.closest('button');
  if (!button) {
    throw new Error('no saved workspace drawn');
  }
  return button;
}

describe('WorkspaceDialog (what a saved workspace is called)', () => {
  it('names a saved workspace by the initials it shows, then by its name', () => {
    const host = render([{ id: 'mine', name: 'Alpha Beta', baseline: {} }]);

    expect(switchButton(host).textContent).toContain('AB');
    expect(switchButton(host).getAttribute('aria-label')).toBe(
      'AB, Alpha Beta',
    );
  });

  it('names a variant by its initials, its name and the workspace it came from', () => {
    const host = render([{ id: 'mine', name: 'Alpha Beta', baseline: {} }], {
      mine: 'app.review',
    });

    expect(switchButton(host).getAttribute('aria-label')).toBe(
      'AB, Alpha Beta, Variant of Review',
    );
  });
});
