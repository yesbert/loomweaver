import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';
import { APP_VERSION } from './app-version';
import { isPreviewVersion } from './preview-version';

describe('VersionService', () => {
  it('exposes the stamped build version', () => {
    const service = TestBed.inject(VersionService);
    expect(service.version()).toBe(APP_VERSION);
  });

  it('says whether the stamped version is a preview, agreeing with the version itself', () => {
    const service = TestBed.inject(VersionService);
    expect(service.isPreview()).toBe(isPreviewVersion(APP_VERSION));
  });

  it('follows the version when a later source replaces it', () => {
    const service = TestBed.inject(VersionService);

    service.version.set('0.8.0-preview.3');
    expect(service.isPreview()).toBe(true);

    service.version.set('0.8.0');
    expect(service.isPreview()).toBe(false);
  });
});
