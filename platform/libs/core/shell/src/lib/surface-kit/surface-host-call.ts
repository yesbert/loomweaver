export function quietly(call: unknown): void {
  Promise.resolve(call).catch((error: unknown) =>
    console.warn('[loom] a call from this surface to the workbench failed', error),
  );
}
