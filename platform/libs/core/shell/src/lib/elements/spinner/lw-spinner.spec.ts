import { TestBed } from '@angular/core/testing';
import { LwSpinner } from './lw-spinner';

describe('LwSpinner', () => {
  it('renders a status element sized from the input, with the given label', () => {
    const fixture = TestBed.createComponent(LwSpinner);
    fixture.componentRef.setInput('size', '1rem');
    fixture.componentRef.setInput('label', 'Bitte warten');
    fixture.detectChanges();

    const element = (fixture.nativeElement as HTMLElement).querySelector('span');
    expect(element?.getAttribute('role')).toBe('status');
    expect(element?.getAttribute('aria-label')).toBe('Bitte warten');
    expect((element as HTMLElement).style.width).toBe('1rem');
    expect(element?.className).toContain('animate-spin');
  });
});
