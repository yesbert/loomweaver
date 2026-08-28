import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LwButton, LwButtonSize, LwButtonVariant } from './lw-button';

@Component({
  imports: [LwButton],
  template: `<button
    lwButton
    [variant]="variant"
    [size]="size"
    [iconOnly]="iconOnly"
  >
    Los
  </button>`,
})
class Host {
  variant: LwButtonVariant = 'default';
  size: LwButtonSize = 'md';
  iconOnly = false;
}

function classesOf(host: Host, patch?: Partial<Host>): string {
  const fixture = TestBed.createComponent(Host);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  const button = (fixture.nativeElement as HTMLElement).querySelector('button');
  return button?.className ?? '';
}

describe('LwButton', () => {
  it('applies base + variant; md is the default size (no size modifier)', () => {
    const classes = classesOf(new Host());
    expect(classes).toContain('lw-btn');
    expect(classes).toContain('lw-btn--default');
    expect(classes).not.toContain('lw-btn--sm');
  });

  it('adds the sm modifier only for the small size', () => {
    expect(classesOf(new Host(), { size: 'sm' })).toContain('lw-btn--sm');
  });

  it('maps each variant to its modifier class', () => {
    expect(classesOf(new Host(), { variant: 'primary' })).toContain(
      'lw-btn--primary',
    );
    expect(classesOf(new Host(), { variant: 'success' })).toContain(
      'lw-btn--success',
    );
    expect(classesOf(new Host(), { variant: 'danger' })).toContain(
      'lw-btn--danger',
    );
    expect(classesOf(new Host(), { variant: 'warning' })).toContain(
      'lw-btn--warning',
    );
    expect(classesOf(new Host(), { variant: 'info' })).toContain(
      'lw-btn--info',
    );
    expect(classesOf(new Host(), { variant: 'ghost' })).toContain(
      'lw-btn--ghost',
    );
  });

  it('adds the icon modifier alongside the size when iconOnly', () => {
    const classes = classesOf(new Host(), { size: 'sm', iconOnly: true });
    expect(classes).toContain('lw-btn--icon');
    expect(classes).toContain('lw-btn--sm');
  });
});
