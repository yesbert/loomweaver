import { TestBed } from '@angular/core/testing';
import { LwSpinner } from './lw-spinner';

describe('LwSpinner', () => {
  it('renders a status element sized from the input, with the given label', () => {
    const fixture = TestBed.createComponent(LwSpinner);
    fixture.componentRef.setInput('size', '1rem');
    fixture.componentRef.setInput('label', 'Bitte warten');
    fixture.detectChanges();

    const el = (fixture.nativeElement as HTMLElement).querySelector('span');
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-label')).toBe('Bitte warten');
    expect((el as HTMLElement).style.width).toBe('1rem');
    expect(el?.className).toContain('animate-spin');
  });
});
