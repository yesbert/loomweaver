import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { DialogRef } from '../dialog/dialog-ref';
import { DialogService } from '../dialog/dialog.service';
import { CommandService } from '../commands/command.service';
import { DEFAULT_WORKSPACE_ID } from './active-workspace.service';
import { WorkspaceDefinition } from './workspace-definition';
import { WorkspaceService } from './workspace.service';
import { WorkspaceDialog } from './workspace-dialog';

interface DialogInternals {
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
    originOf: (id: string) => origins[id] ?? null,
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: WorkspaceService, useValue: ws },
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
    expect(build(DEFAULT_WORKSPACE_ID).tab()).toBe('mine');
  });

  it('opens on the user list when a saved workspace is active', () => {
    expect(build('ws-42').tab()).toBe('mine');
  });

  it('opens on the user list when the distribution ships none', () => {
    expect(build(DEFAULT_WORKSPACE_ID, []).tab()).toBe('mine');
  });
});

describe('WorkspaceDialog (where a variant came from)', () => {
  it('names the workspace a variant was saved from', () => {
    const dialog = build(DEFAULT_WORKSPACE_ID, DEFINITIONS, {
      mine: 'app.review',
    });

    expect(dialog.originName('mine')).toBe('k.review');
  });

  it('says nothing where a variant has no origin left to name', () => {
    const dialog = build(DEFAULT_WORKSPACE_ID, DEFINITIONS, { mine: 'gone' });

    expect(dialog.originName('mine')).toBeNull();
  });
});
