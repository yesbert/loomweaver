import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { VIEW_STATE, ViewState } from '@loomweaver/plugin-sdk';
import { TestbedOutlineView } from './testbed-outline-view';

function stubViewState() {
  const value = signal<unknown>(undefined);
  const state: ViewState = {
    instanceId: 'testbed.outline',
    value: () => value(),
    set: (next) => value.set(next),
  };
  return state;
}

function mount(state: ViewState) {
  TestBed.configureTestingModule({
    imports: [TestbedOutlineView],
    providers: [{ provide: VIEW_STATE, useValue: state }],
  });
  const fixture = TestBed.createComponent(TestbedOutlineView);
  fixture.detectChanges();
  return fixture;
}

describe('TestbedOutlineView', () => {
  it('renders its numbered outline sections in natural order by default', () => {
    const fixture = mount(stubViewState());
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(rows).toHaveLength(4);
    expect(rows[0].textContent).toContain('Row C');
  });

  it('toggles to alphabetical order and writes the choice to VIEW_STATE', () => {
    const state = stubViewState();
    const setSpy = vi.spyOn(state, 'set');
    const fixture = mount(state);

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="outline-sort"]',
    );
    (button as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(setSpy).toHaveBeenCalledWith({ sort: 'alpha' });
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(rows[0].textContent).toContain('Row A');
  });

  it('restores a persisted sort from VIEW_STATE', () => {
    const state = stubViewState();
    state.set({ sort: 'alpha' });
    const fixture = mount(state);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    expect(rows[0].textContent).toContain('Row A');
  });
});
