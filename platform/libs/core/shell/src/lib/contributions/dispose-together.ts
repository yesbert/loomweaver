import { Disposable } from '@loomweaver/plugin-sdk';

export function disposeTogether(
  disposables: readonly Disposable[],
): Disposable {
  return {
    dispose: () => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    },
  };
}
