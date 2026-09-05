const shut = new Map<string, boolean>();

export function foldedShut(key: string, startsShut: boolean): boolean {
  return shut.get(key) ?? startsShut;
}

export function rememberFold(key: string, isShut: boolean): void {
  shut.set(key, isShut);
}

/**
 * Forgets every fold a {@link LwNavGroupElement} is holding for this session.
 *
 * The memory is process-wide by design, so that a tree drawn again after leaving the screen finds
 * what the user left. That is also what makes one test leak into the next, which is what this is
 * for: call it between cases.
 */
export function forgetLwNavFolds(): void {
  shut.clear();
}
