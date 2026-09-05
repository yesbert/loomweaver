export function addressIsUnder(
  shown: string | undefined,
  named: string,
): boolean {
  if (shown === undefined) {
    return false;
  }
  return shown === named || shown.startsWith(named === '' ? '' : `${named}/`);
}
