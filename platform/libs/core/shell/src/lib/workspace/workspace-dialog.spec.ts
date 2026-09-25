import { DialogRef } from '@loomweaver/plugin-sdk';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
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
