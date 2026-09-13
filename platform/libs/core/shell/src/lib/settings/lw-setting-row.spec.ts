import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LwSettingRow } from './lw-setting-row';

@Component({
  imports: [LwSettingRow],
  template: `<lw-setting-row [label]="label" [icon]="icon" />`,
})
class Host {
  label = 'Version';
  icon = '';
}

function render(icon: string): HTMLElement {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.icon = icon;
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('a settings row led by a symbol', () => {
  it('draws the symbol before the label', () => {
    const row = render('info');
    const symbol = row.querySelector('lw-icon');

    expect(symbol).not.toBeNull();
    expect(symbol?.getAttribute('name')).toBe('info');
    expect(row.textContent).toContain('Version');
  });

  it('leaves a row without one as it was', () => {
    expect(render('').querySelector('lw-icon')).toBeNull();
  });

  it('does not let the symbol name the row', () => {
    const symbol = render('info').querySelector('lw-icon');

    expect(symbol?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('a settings row in a stack of rows', () => {
  it('takes a line of its own, so a container can draw on its edges', () => {
    const row = render('').querySelector('lw-setting-row');

    expect(row?.classList.contains('block')).toBe(true);
  });
});
