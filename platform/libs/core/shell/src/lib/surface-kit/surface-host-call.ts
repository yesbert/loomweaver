export function quietly(call: unknown): void {
  Promise.resolve(call).catch((error: unknown) =>
    console.warn('[loom] the workbench refused a request from this surface', error),
  );
}
