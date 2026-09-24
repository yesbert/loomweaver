export function addressIsUnder(
  shown: string | undefined,
  named: string,
): boolean {
  if (shown === undefined) {
    return false;
  }
  if (named === '') {
    return true;
  }
  return shown === named || shown.startsWith(`${named}/`);
}
