import { TestBed } from '@angular/core/testing';
import { LwVersion } from './lw-version';
import { VersionService } from './version.service';

function render(prefix?: string) {
  const fixture = TestBed.createComponent(LwVersion);
  if (prefix !== undefined) {
    fixture.componentRef.setInput('prefix', prefix);
  }
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).textContent?.trim();
}

describe('LwVersion', () => {
  beforeEach(() => {
    TestBed.overrideProvider(VersionService, {
      useValue: { version: () => '1.2.3' },
    });
  });

  it('renders the version with a leading "v" by default', () => {
    expect(render()).toBe('v1.2.3');
  });

  it('drops the prefix when set to empty', () => {
    expect(render('')).toBe('1.2.3');
  });
});
