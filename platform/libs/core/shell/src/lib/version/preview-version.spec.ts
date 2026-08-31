import { describe, expect, it } from 'vitest';
import { isPreviewVersion } from './preview-version';

describe('isPreviewVersion', () => {
  it('says no for a version of a released line', () => {
    expect(isPreviewVersion('0.7.9')).toBe(false);
  });

  it('says yes for a version marked as a preview of a line', () => {
    expect(isPreviewVersion('0.8.0-preview.3')).toBe(true);
  });

  it('ignores build metadata, which is not a preview marker', () => {
    expect(isPreviewVersion('0.7.9+build.5')).toBe(false);
    expect(isPreviewVersion('0.8.0-preview.3+build.5')).toBe(true);
  });

  it('refuses a marker that is there but empty', () => {
    expect(isPreviewVersion('0.8.0-')).toBe(false);
  });

  it('refuses a marker with an empty identifier in it', () => {
    expect(isPreviewVersion('0.8.0-preview..3')).toBe(false);
  });

  it('refuses a marker carrying what a marker cannot carry', () => {
    expect(isPreviewVersion('0.8.0-preview_3')).toBe(false);
  });
});
