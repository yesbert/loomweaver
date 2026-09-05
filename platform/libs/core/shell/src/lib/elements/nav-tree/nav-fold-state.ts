const shut = new Map<string, boolean>();

export function foldedShut(key: string, startsShut: boolean): boolean {
  return shut.get(key) ?? startsShut;
}

export function rememberFold(key: string, isShut: boolean): void {
  shut.set(key, isShut);
}

export function forgetFolds(): void {
  shut.clear();
}
