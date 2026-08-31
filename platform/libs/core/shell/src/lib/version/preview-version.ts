const PRERELEASE_IDENTIFIER = /^[0-9A-Za-z-]+$/;

export function isPreviewVersion(version: string): boolean {
  const withoutBuildMetadata = version.split('+', 1)[0];
  const marker = withoutBuildMetadata.indexOf('-');
  if (marker === -1) {
    return false;
  }
  return withoutBuildMetadata
    .slice(marker + 1)
    .split('.')
    .every((identifier) => PRERELEASE_IDENTIFIER.test(identifier));
}
