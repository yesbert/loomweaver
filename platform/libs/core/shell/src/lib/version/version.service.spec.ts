import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';
import { APP_VERSION } from './app-version';

describe('VersionService', () => {
  it('exposes the stamped build version', () => {
    const service = TestBed.inject(VersionService);
    expect(service.version()).toBe(APP_VERSION);
  });
});
