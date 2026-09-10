import { computed, Signal } from '@angular/core';
import { KeyValueStore } from '../../persistence/key-value-store';
import { workspaceScopedKey } from '../active-workspace.service';
import { WorkspaceDefinition } from '../workspace-definition';
import { BaselineContext, changeCandidates } from './workspace-lookup';
import {
  activeStateDiffers,
  changedWorkspaceIds,
  storedStateDiffers,
  workspaceChangeShape,
} from './workspace-changes';
import { StateChannel, Workspace } from './workspace-state';

export interface UnsavedReading {
  readonly channels: Record<string, StateChannel>;
  readonly keys: readonly string[];
  readonly hiddenViewsKey: string;
  readonly paneTreesKey: string;
  readonly declaredPaths: (region: string) => readonly string[];
  readonly activeId: () => string;
  readonly baselineOf: (id: string) => Readonly<Record<string, string>>;
  readonly workspaces: () => readonly Workspace[];
  readonly definitions: readonly WorkspaceDefinition[];
  readonly context: BaselineContext;
  readonly workingState: KeyValueStore;
}

export function unsavedWorkspaces(reading: UnsavedReading): {
  readonly hasChanges: Signal<boolean>;
  readonly changedIds: Signal<Set<string>>;
} {
  const shape = () =>
    workspaceChangeShape(
      reading.keys,
      reading.hiddenViewsKey,
      reading.paneTreesKey,
      reading.declaredPaths,
    );
  const hasChanges = computed(() =>
    activeStateDiffers(
      reading.channels,
      reading.baselineOf(reading.activeId()),
      shape(),
    ),
  );
  const changedIds = computed(() =>
    changedWorkspaceIds({
      activeId: reading.activeId(),
      activeDiffers: hasChanges(),
      canReadBack: reading.workingState.peek !== undefined,
      candidates: changeCandidates(
        reading.definitions,
        reading.workspaces(),
        reading.context,
      ),
      storedDiffers: (candidate) =>
        storedStateDiffers(
          reading.workingState.peek?.bind(reading.workingState),
          workspaceScopedKey,
          candidate,
          shape(),
        ),
    }),
  );
  return { hasChanges, changedIds };
}
