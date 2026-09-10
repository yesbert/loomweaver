import { isHomePath } from '../regions/content/content-path';
import { WorkspaceDefinition } from './workspace-definition';

export interface Opening {
  readonly declared: WorkspaceDefinition | undefined;
  readonly adopted: boolean;
  readonly atTheOpeningAddress: () => boolean;
  readonly alreadyEntered: () => boolean;
  readonly arrangementSettled: () => Promise<void>;
  readonly enter: (id: string) => Promise<void>;
  readonly contentPath: () => string;
  readonly goTo: (path: string) => void;
}

export function declaredStart(
  definitions: readonly WorkspaceDefinition[],
): WorkspaceDefinition | undefined {
  return definitions.find((definition) => definition.initial);
}

export function atTheOpeningAddress(boot: string, here: string): boolean {
  return isHomePath(boot) && isHomePath(here);
}

export async function startWhereTheDistributionSays(
  opening: Opening,
): Promise<void> {
  const declared = opening.declared;
  if (declared?.content === undefined || !opening.atTheOpeningAddress()) {
    return;
  }
  if (!opening.adopted) {
    if (opening.alreadyEntered()) {
      return;
    }
    await opening.arrangementSettled();
    if (!opening.atTheOpeningAddress() || opening.alreadyEntered()) {
      return;
    }
    await opening.enter(declared.id);
  }
  const path = opening.contentPath();
  if (path === '' || !opening.atTheOpeningAddress()) {
    return;
  }
  opening.goTo(path);
}
