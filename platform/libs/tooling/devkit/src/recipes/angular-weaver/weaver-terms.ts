export const CONTAINER_EXAMPLE_ID = 'example';

export function capabilityItems(capabilities: readonly string[]): string {
  return capabilities.map((capability) => `'${capability}'`).join(', ');
}
