import { Component, Injector, Type, computed, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaneChromeService } from './pane-chrome.service';
import { PaneTreeService } from '../tree/pane-tree.service';
import { leafOf } from '../tree/pane-node';
import { RetainedComponent } from '../retention/retained-component';

@Component({ selector: 'lw-kept-frame', template: '' })
class KeptFrame {}

@Component({
  imports: [RetainedComponent],
  template: `
    @if (blownUp()) {
      <section>
        <ng-container
          [lwRetainedComponent]="frame"
          [componentInjector]="injector"
          retentionKey="content:b|frame"
          mode="in-place"
          [retain]="true"
        />
      </section>
    } @else if (!minimized()) {
      <div>
        <ng-container
          [lwRetainedComponent]="frame"
          [componentInjector]="injector"
          retentionKey="content:b|frame"
          mode="in-place"
          [retain]="true"
        />
      </div>
    }
  `,
})
class PaneOfTheTree {
  private readonly chrome = inject(PaneChromeService);
  readonly frame: Type<unknown> = KeptFrame;
  readonly injector = inject(Injector);
  readonly minimized = computed(() => this.chrome.isMinimized('content', 'b'));
  readonly blownUp = computed(
    () => this.chrome.maximizedPaneIn('content') !== null,
  );
}

describe('PaneChromeService', () => {
  let chrome: PaneChromeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.inject(PaneTreeService).commit('content', {
      kind: 'split',
      id: 'root',
      orientation: 'row',
      ratio: 0.5,
      first: leafOf('a', 'doc/a'),
      second: leafOf('b', 'doc/b'),
    });
    chrome = TestBed.inject(PaneChromeService);
  });

  describe('maximize', () => {
    it('has no maximized pane initially', () => {
      expect(chrome.isMaximized('content', 'a')).toBe(false);
      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });

    it('toggles a pane maximized and back', () => {
      chrome.toggleMaximize('content', 'a');
      expect(chrome.isMaximized('content', 'a')).toBe(true);
      expect(chrome.maximizedPaneIn('content')).toBe('a');

      chrome.toggleMaximize('content', 'a');
      expect(chrome.isMaximized('content', 'a')).toBe(false);
      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });

    it('maximizing another pane replaces the current one', () => {
      chrome.toggleMaximize('content', 'a');
      chrome.toggleMaximize('content', 'b');
      expect(chrome.isMaximized('content', 'a')).toBe(false);
      expect(chrome.isMaximized('content', 'b')).toBe(true);
    });

    it('scopes the maximized pane to its dock', () => {
      chrome.toggleMaximize('content', 'a');
      expect(chrome.maximizedPaneIn('content')).toBe('a');
      expect(chrome.maximizedPaneIn('left')).toBeNull();
      expect(chrome.isMaximized('left', 'a')).toBe(false);
    });

    it('restore clears any maximized pane', () => {
      chrome.toggleMaximize('content', 'a');
      chrome.endMaximize();
      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });
  });

  describe('another arrangement taking the place of this one', () => {
    function sameIdsElsewhere(): string {
      return JSON.stringify({
        content: {
          kind: 'split',
          id: 'root',
          orientation: 'row',
          ratio: 0.5,
          first: leafOf('a', 'doc/c'),
          second: leafOf('b', 'doc/d'),
        },
      });
    }

    it('a pane blown up in one workspace is not blown up in the next, whatever its id', () => {
      chrome.toggleMaximize('content', 'a');

      TestBed.inject(PaneTreeService).hydrate(sameIdsElsewhere());

      expect(chrome.maximizedPaneIn('content')).toBeNull();
    });

    it('a pane minimised in one workspace is not minimised in the next, whatever its id', () => {
      chrome.toggleMinimize('content', 'b');

      TestBed.inject(PaneTreeService).hydrate(sameIdsElsewhere());

      expect(chrome.isMinimized('content', 'b')).toBe(false);
    });

    it('what is minimised or blown up afterwards belongs to the new arrangement', () => {
      chrome.toggleMinimize('content', 'b');
      TestBed.inject(PaneTreeService).hydrate(sameIdsElsewhere());

      chrome.toggleMinimize('content', 'a');
      chrome.toggleMaximize('content', 'b');

      expect(chrome.isMinimized('content', 'a')).toBe(true);
      expect(chrome.isMinimized('content', 'b')).toBe(false);
      expect(chrome.maximizedPaneIn('content')).toBe('b');
    });
  });

  describe('a kept surface that is hidden in place, in a pane that is taken down and drawn again', () => {
    interface MovableParent extends HTMLElement {
      moveBefore(node: Node, child: Node | null): void;
    }

    let movedWhileInTheDocument: Node[] = [];

    function drawn() {
      const fixture = TestBed.createComponent(PaneOfTheTree);
      fixture.detectChanges();
      const frame: HTMLElement =
        fixture.nativeElement.querySelector('lw-kept-frame');
      movedWhileInTheDocument = [];
      return { fixture, frame };
    }

    beforeEach(() => {
      (Element.prototype as Partial<MovableParent>).moveBefore = function (
        this: HTMLElement,
        node: Node,
        child: Node | null,
      ) {
        movedWhileInTheDocument.push(node);
        this.insertBefore(node, child);
      };
      TestBed.resetTestingModule();
      TestBed.inject(PaneTreeService).commit('content', {
        kind: 'split',
        id: 'root',
        orientation: 'row',
        ratio: 0.5,
        first: leafOf('a', 'doc/a'),
        second: leafOf('b', 'frame'),
      });
      chrome = TestBed.inject(PaneChromeService);
    });

    afterEach(() => {
      delete (Element.prototype as Partial<MovableParent>).moveBefore;
    });

    it('minimising its pane takes it out before the pane goes, and restoring puts the same one back', () => {
      const { fixture, frame } = drawn();

      chrome.toggleMinimize('content', 'b');
      fixture.detectChanges();

      expect(movedWhileInTheDocument).toEqual([frame]);
      expect(frame.isConnected).toBe(true);

      chrome.toggleMinimize('content', 'b');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('lw-kept-frame')).toBe(frame);
      expect(movedWhileInTheDocument).toEqual([frame, frame]);
    });

    it('blowing a pane up and ending it moves it each time the panes are drawn again', () => {
      const { fixture, frame } = drawn();

      chrome.toggleMaximize('content', 'b');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('lw-kept-frame')).toBe(frame);
      expect(movedWhileInTheDocument).toEqual([frame, frame]);

      chrome.endMaximize();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('lw-kept-frame')).toBe(frame);
      expect(movedWhileInTheDocument).toEqual([frame, frame, frame, frame]);
    });
  });

  describe('minimize', () => {
    it('toggles a pane minimized and back', () => {
      expect(chrome.isMinimized('content', 'a')).toBe(false);
      chrome.toggleMinimize('content', 'a');
      expect(chrome.isMinimized('content', 'a')).toBe(true);
      chrome.toggleMinimize('content', 'a');
      expect(chrome.isMinimized('content', 'a')).toBe(false);
    });

    it('tracks several minimized panes independently', () => {
      chrome.toggleMinimize('content', 'a');
      chrome.toggleMinimize('content', 'b');
      expect(chrome.isMinimized('content', 'a')).toBe(true);
      expect(chrome.isMinimized('content', 'b')).toBe(true);
    });

    it('distinguishes the same pane id across docks', () => {
      chrome.toggleMinimize('content', 'a');
      expect(chrome.isMinimized('content', 'a')).toBe(true);
      expect(chrome.isMinimized('left', 'a')).toBe(false);
    });

    it('clearMinimized removes only the given dock', () => {
      chrome.toggleMinimize('content', 'a');
      chrome.toggleMinimize('left', 'b');
      chrome.clearMinimized('content');
      expect(chrome.isMinimized('content', 'a')).toBe(false);
      expect(chrome.isMinimized('left', 'b')).toBe(true);
    });

    it('clearMinimized is a no-op when the dock has nothing minimized', () => {
      chrome.toggleMinimize('content', 'a');
      const before = chrome.isMinimized('content', 'a');
      chrome.clearMinimized('left');
      expect(chrome.isMinimized('content', 'a')).toBe(before);
    });
  });
});
