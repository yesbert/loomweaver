import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaneSplitHandle } from './pane-split-handle';

function pointer(
  type: string,
  props: { clientX?: number; clientY?: number; pointerId?: number },
): Event {
  const event = new Event(type, { bubbles: true });
  return Object.assign(event, props);
}

describe('PaneSplitHandle', () => {
  let fixture: ComponentFixture<PaneSplitHandle>;
  let host: HTMLElement;
  let stream: number[];
  let commits: number;

  function create(orientation: 'row' | 'column', ratio = 0.5): void {
    fixture = TestBed.createComponent(PaneSplitHandle);
    fixture.componentRef.setInput('ratio', ratio);
    fixture.componentRef.setInput('orientation', orientation);
    fixture.componentRef.setInput('label', 'Resize');
    host = fixture.nativeElement as HTMLElement;
    stream = [];
    commits = 0;
    fixture.componentInstance.ratioStream.subscribe((v) => stream.push(v));
    fixture.componentInstance.ratioCommit.subscribe(() => (commits += 1));
    fixture.detectChanges();
  }

  it('reflects a row handle as a vertical separator with ARIA values', () => {
    create('row', 0.42);
    expect(host.getAttribute('role')).toBe('separator');
    expect(host.getAttribute('aria-orientation')).toBe('vertical');
    expect(host.getAttribute('aria-label')).toBe('Resize');
    expect(host.getAttribute('aria-valuenow')).toBe('42');
    expect(host.getAttribute('tabindex')).toBe('0');
    expect(host.className).toContain('cursor-col-resize');
  });

  it('reflects a column handle as a horizontal separator', () => {
    create('column');
    expect(host.getAttribute('aria-orientation')).toBe('horizontal');
    expect(host.className).toContain('cursor-row-resize');
  });

  it('arrow keys step the ratio and commit (row)', () => {
    create('row', 0.5);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(stream).toEqual([0.52, 0.48]);
    expect(commits).toBe(2);
  });

  it('shift makes a coarse step, and column uses up/down', () => {
    create('column', 0.5);
    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }),
    );
    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }),
    );
    expect(stream[0]).toBeCloseTo(0.6);
    expect(stream[1]).toBeCloseTo(0.4);
  });

  it('ignores unrelated keys', () => {
    create('row');
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(stream).toEqual([]);
    expect(commits).toBe(0);
  });

  it('pointer drag streams the fraction and commits on release', () => {
    create('row', 0.5);
    const parent = document.createElement('div');
    parent.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    parent.append(host);
    host.setPointerCapture = () => undefined;
    host.releasePointerCapture = () => undefined;

    host.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 30 }));
    host.dispatchEvent(pointer('pointermove', { clientX: 70 }));
    expect(stream.at(-1)).toBeCloseTo(0.7);

    host.dispatchEvent(pointer('pointerup', { pointerId: 1 }));
    expect(commits).toBe(1);

    host.dispatchEvent(pointer('pointermove', { clientX: 10 }));
    expect(stream.at(-1)).toBeCloseTo(0.7);
  });
});
