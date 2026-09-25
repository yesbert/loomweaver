import { computed, Signal } from '@angular/core';
import { KeyValueStore } from '../../persistence/key-value-store';
import { workspaceScopedKey } from '../active-workspace.service';
import {
  BUILT_IN_WORKSPACE_ID,
  offersBuiltInWorkspace,
} from '../declaration/composed-definitions';
import {
  PanelDeclarations,
  definitionBaseline,
} from '../declaration/definition-baseline';
import { WorkspaceDefinition } from '../declaration/workspace-definition';
import {
  activeStateDiffers,
  changedWorkspaceIds,
  storedStateDiffers,
} from './workspace-changes';
import { StateChannels } from './state-channels';
import { Workspace } from '../catalog/saved-workspaces';

export interface UnsavedReading {
  readonly channels: StateChannels;
  readonly panels: PanelDeclarations;
  readonly activeId: () => string;
  readonly baselineOf: (id: string) => Readonly<Record<string, string>>;
  readonly workspaces: () => readonly Workspace[];
  readonly definitions: readonly WorkspaceDefinition[];
  readonly workingStateStore: KeyValueStore;
}

export function unsavedWorkspaces(reading: UnsavedReading): {
  readonly hasChanges: Signal<boolean>;
  readonly changedIds: Signal<Set<string>>;
} {
  const declaredPaths = reading.panels.declaredPaths;
  const hasChanges = computed(() =>
    activeStateDiffers(
      reading.channels,
      reading.baselineOf(reading.activeId()),
      declaredPaths,
    ),
  );
  const changedIds = computed(() =>
    changedWorkspaceIds({
      activeId: reading.activeId(),
      activeDiffers: hasChanges(),
      canReadBack: reading.workingStateStore.peek !== undefined,
      candidates: changeCandidates(
        reading.definitions,
        reading.workspaces(),
        reading.panels,
      ),
      storedDiffers: (candidate) =>
        storedStateDiffers(
          reading.workingStateStore.peek?.bind(reading.workingStateStore),
          workspaceScopedKey,
          candidate,
          declaredPaths,
        ),
    }),
  );
  return { hasChanges, changedIds };
}

function changeCandidates(
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
  panels: PanelDeclarations,
): readonly { id: string; baseline: Readonly<Record<string, string>> }[] {
  const builtIn = offersBuiltInWorkspace(definitions)
    ? [{ id: BUILT_IN_WORKSPACE_ID, baseline: {} }]
    : [];
  return [
    ...builtIn,
    ...definitions.map((definition) => ({
      id: definition.id,
      baseline: definitionBaseline(definition, panels),
    })),
    ...saved,
  ];
}
